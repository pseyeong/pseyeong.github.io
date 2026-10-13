package com.pseyeong.hankki.recipe;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** 레시피 쓰기·수정용 조회와 저장. 호출하는 쪽(RecipeWriteService)의 트랜잭션 안에서 실행된다. */
@Repository
public class RecipeWriteRepository {

	/** 수정 화면용 기본 정보. 숨김 상태여도 작성자는 볼 수 있다. */
	public record EditRow(
			long id,
			UUID authorId,
			String title,
			int servings,
			int cookMinutes,
			String tool,
			String coverImage) {
	}

	/** 수정 화면용 재료. 기타 재료는 ingredientId·unit 등이 비어 있다. */
	public record EditIngredient(
			Long ingredientId,
			String name,
			String customName,
			String unit,
			BigDecimal unitPrice,
			boolean basic,
			BigDecimal quantity,
			String displayAmount) {
	}

	private final JdbcClient jdbc;

	public RecipeWriteRepository(JdbcClient jdbc) {
		this.jdbc = jdbc;
	}

	public Optional<EditRow> findForEdit(long id) {
		return jdbc.sql("""
				select id, author_id, title, servings, cook_minutes, tool, cover_image
				from recipes where id = :id
				""")
				.param("id", id)
				.query((rs, n) -> new EditRow(
						rs.getLong("id"),
						rs.getObject("author_id", UUID.class),
						rs.getString("title"),
						rs.getInt("servings"),
						rs.getInt("cook_minutes"),
						rs.getString("tool"),
						rs.getString("cover_image")))
				.optional();
	}

	public List<EditIngredient> findIngredientsForEdit(long recipeId) {
		return jdbc.sql("""
				select ri.ingredient_id, i.name, ri.custom_name, i.unit, i.unit_price, i.is_basic,
				       ri.quantity, ri.display_amount
				from recipe_ingredients ri
				left join ingredients i on i.id = ri.ingredient_id
				where ri.recipe_id = :id
				order by ri.sort_order, ri.id
				""")
				.param("id", recipeId)
				.query((rs, n) -> new EditIngredient(
						rs.getObject("ingredient_id", Long.class),
						rs.getString("name"),
						rs.getString("custom_name"),
						rs.getString("unit"),
						rs.getBigDecimal("unit_price"),
						rs.getBoolean("is_basic"),
						rs.getBigDecimal("quantity"),
						rs.getString("display_amount")))
				.list();
	}

	/** 이 레시피가 지금 쓰고 있는 사진 주소들 (대표 사진 + 단계 사진) */
	public List<String> findImages(long recipeId) {
		return jdbc.sql("""
				select cover_image as url from recipes where id = :id and cover_image is not null
				union all
				select image from recipe_steps where recipe_id = :id and image is not null
				""")
				.param("id", recipeId)
				.query(String.class)
				.list();
	}

	/** 이 사진 주소를 어떤 레시피든 아직 쓰고 있는지 */
	public boolean isImageInUse(String url) {
		return jdbc.sql("""
				select exists (select 1 from recipes where cover_image = :url)
				    or exists (select 1 from recipe_steps where image = :url)
				""")
				.param("url", url)
				.query(Boolean.class)
				.single();
	}

	public long insertRecipe(UUID authorId, RecipeForm form) {
		return jdbc.sql("""
				insert into recipes (author_id, title, servings, cook_minutes, tool, cover_image)
				values (:author, :title, :servings, :minutes, :tool, :cover)
				returning id
				""")
				.param("author", authorId)
				.param("title", form.title().trim())
				.param("servings", form.servings())
				.param("minutes", form.cookMinutes())
				.param("tool", form.tool())
				.param("cover", blankToNull(form.coverImage()))
				.query(Long.class)
				.single();
	}

	public void updateRecipe(long id, RecipeForm form) {
		jdbc.sql("""
				update recipes
				set title = :title, servings = :servings, cook_minutes = :minutes, tool = :tool, cover_image = :cover
				where id = :id
				""")
				.param("id", id)
				.param("title", form.title().trim())
				.param("servings", form.servings())
				.param("minutes", form.cookMinutes())
				.param("tool", form.tool())
				.param("cover", blankToNull(form.coverImage()))
				.update();
	}

	/** 재료를 통째로 바꾼다. 행이 바뀔 때마다 DB 트리거가 단가를 다시 계산한다. */
	public void replaceIngredients(long recipeId, List<RecipeForm.Ingredient> ingredients) {
		jdbc.sql("delete from recipe_ingredients where recipe_id = :id").param("id", recipeId).update();
		int order = 0;
		for (RecipeForm.Ingredient i : ingredients) {
			jdbc.sql("""
					insert into recipe_ingredients (recipe_id, ingredient_id, custom_name, quantity, display_amount, sort_order)
					values (:recipe, :ingredient, :custom, :quantity, :display, :order)
					""")
					.param("recipe", recipeId)
					.param("ingredient", i.ingredientId())
					.param("custom", i.isCustom() ? i.customName().trim() : null)
					.param("quantity", i.isCustom() ? null : i.quantity())
					.param("display", blankToNull(i.displayAmount()))
					.param("order", order++)
					.update();
		}
	}

	public void replaceSteps(long recipeId, List<RecipeForm.Step> steps) {
		jdbc.sql("delete from recipe_steps where recipe_id = :id").param("id", recipeId).update();
		int no = 1;
		for (RecipeForm.Step s : steps) {
			jdbc.sql("insert into recipe_steps (recipe_id, step_no, content, image) values (:recipe, :no, :content, :image)")
					.param("recipe", recipeId)
					.param("no", no++)
					.param("content", s.content().trim())
					.param("image", blankToNull(s.image()))
					.update();
		}
	}

	/** price_per_serving, is_partial_price 를 확실히 다시 계산한다 (트리거와 같은 함수) */
	public void recalcPrice(long recipeId) {
		jdbc.sql("select public.recalc_recipe_price(:id)").param("id", recipeId).query((rs, n) -> 0).list();
	}

	public void delete(long recipeId) {
		jdbc.sql("delete from recipes where id = :id").param("id", recipeId).update();
	}

	private static String blankToNull(String value) {
		return value == null || value.isBlank() ? null : value.trim();
	}
}
