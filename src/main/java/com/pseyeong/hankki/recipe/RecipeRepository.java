package com.pseyeong.hankki.recipe;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/**
 * 레시피 읽기 쿼리. 공개(public) 레시피만 조회한다. 숨김(hidden)은 어디서도 나오지 않는다.
 */
@Repository
public class RecipeRepository {

	/** 상세 화면 기본 정보 */
	public record RecipeRow(
			long id,
			String title,
			String description,
			String coverImage,
			int servings,
			int cookMinutes,
			String tool,
			int pricePerServing,
			boolean partialPrice,
			String authorNickname) {
	}

	/** 레시피 재료 한 줄. 기타 재료는 name 이 null 이고 customName 이 채워진다. */
	public record IngredientRow(
			Long ingredientId,
			String displayAmount,
			BigDecimal quantity,
			String customName,
			String name,
			String unit,
			BigDecimal unitPrice,
			BigDecimal packSize,
			boolean basic,
			OffsetDateTime priceUpdatedAt) {
	}

	/** 원래 재료(ingredientId) 대신 쓸 수 있는 재료 */
	public record SubstituteRow(
			long ingredientId,
			String name,
			String unit,
			BigDecimal unitPrice,
			BigDecimal ratio,
			String tag,
			String note) {
	}

	private static final String SUMMARY_SELECT = """
			select r.id, r.title, r.price_per_serving, r.cook_minutes, r.cover_image,
			       coalesce(p.nickname, '익명') as nickname
			from recipes r
			left join profiles p on p.id = r.author_id
			where r.status = 'public'
			""";

	private static final RowMapper<RecipeSummary> SUMMARY_MAPPER = (rs, n) -> new RecipeSummary(
			rs.getLong("id"),
			rs.getString("title"),
			rs.getInt("price_per_serving"),
			rs.getInt("cook_minutes"),
			rs.getString("nickname"),
			rs.getString("cover_image"));

	private final JdbcClient jdbc;

	public RecipeRepository(JdbcClient jdbc) {
		this.jdbc = jdbc;
	}

	/** 필터와 정렬을 적용한 목록. limit 이 null 이면 전부 */
	public List<RecipeSummary> search(RecipeFilter filter, Integer limit) {
		return search(filter, limit, null);
	}

	/** ingredientId 가 있으면 그 재료를 쓰는 레시피만 (재료별 모음 페이지) */
	public List<RecipeSummary> search(RecipeFilter filter, Integer limit, Long ingredientId) {
		StringBuilder sql = new StringBuilder(SUMMARY_SELECT);
		Map<String, Object> params = new HashMap<>();
		if (ingredientId != null) {
			sql.append(" and exists (select 1 from recipe_ingredients ri where ri.recipe_id = r.id and ri.ingredient_id = :ingredientId)");
			params.put("ingredientId", ingredientId);
		}
		if (filter.price() != null) {
			sql.append(" and r.price_per_serving <= :price");
			params.put("price", filter.price());
		}
		if (filter.time() != null) {
			sql.append(" and r.cook_minutes <= :time");
			params.put("time", filter.time());
		}
		if (filter.tool() != null) {
			sql.append(" and r.tool = :tool");
			params.put("tool", filter.tool());
		}
		sql.append(" order by ").append(filter.sort().orderBy());
		if (limit != null) {
			sql.append(" limit :limit");
			params.put("limit", limit);
		}
		return jdbc.sql(sql.toString()).params(params).query(SUMMARY_MAPPER).list();
	}

	public Optional<RecipeRow> findPublicById(long id) {
		return jdbc.sql("""
				select r.id, r.title, r.description, r.cover_image, r.servings, r.cook_minutes, r.tool,
				       r.price_per_serving, r.is_partial_price, coalesce(p.nickname, '익명') as nickname
				from recipes r
				left join profiles p on p.id = r.author_id
				where r.id = :id and r.status = 'public'
				""")
				.param("id", id)
				.query((rs, n) -> new RecipeRow(
						rs.getLong("id"),
						rs.getString("title"),
						rs.getString("description"),
						rs.getString("cover_image"),
						rs.getInt("servings"),
						rs.getInt("cook_minutes"),
						rs.getString("tool"),
						rs.getInt("price_per_serving"),
						rs.getBoolean("is_partial_price"),
						rs.getString("nickname")))
				.optional();
	}

	public List<IngredientRow> findIngredients(long recipeId) {
		return jdbc.sql("""
				select ri.ingredient_id, ri.display_amount, ri.quantity, ri.custom_name,
				       i.name, i.unit, i.unit_price, i.pack_size, i.is_basic, i.price_updated_at
				from recipe_ingredients ri
				left join ingredients i on i.id = ri.ingredient_id
				where ri.recipe_id = :id
				order by ri.sort_order, ri.id
				""")
				.param("id", recipeId)
				.query((rs, n) -> new IngredientRow(
						rs.getObject("ingredient_id", Long.class),
						rs.getString("display_amount"),
						rs.getBigDecimal("quantity"),
						rs.getString("custom_name"),
						rs.getString("name"),
						rs.getString("unit"),
						rs.getBigDecimal("unit_price"),
						rs.getBigDecimal("pack_size"),
						rs.getBoolean("is_basic"),
						rs.getObject("price_updated_at", OffsetDateTime.class)))
				.list();
	}

	/** 주어진 재료들의 대체 재료 (원래 재료 id 별로 묶어서 쓴다) */
	public List<SubstituteRow> findSubstitutes(Collection<Long> ingredientIds) {
		if (ingredientIds.isEmpty()) {
			return List.of();
		}
		return jdbc.sql("""
				select s.ingredient_id, sub.name, sub.unit, sub.unit_price, s.ratio, s.tag, s.note
				from ingredient_substitutes s
				join ingredients sub on sub.id = s.substitute_id
				where s.ingredient_id in (:ids)
				order by s.id
				""")
				.param("ids", ingredientIds)
				.query((rs, n) -> new SubstituteRow(
						rs.getLong("ingredient_id"),
						rs.getString("name"),
						rs.getString("unit"),
						rs.getBigDecimal("unit_price"),
						rs.getBigDecimal("ratio"),
						rs.getString("tag"),
						rs.getString("note")))
				.list();
	}

	public List<RecipeDetail.Step> findSteps(long recipeId) {
		return jdbc.sql("select step_no, content, image from recipe_steps where recipe_id = :id order by step_no")
				.param("id", recipeId)
				.query((rs, n) -> new RecipeDetail.Step(rs.getInt("step_no"), rs.getString("content"), rs.getString("image")))
				.list();
	}
}
