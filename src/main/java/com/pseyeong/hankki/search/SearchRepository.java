package com.pseyeong.hankki.search;

import java.util.Collection;
import java.util.List;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class SearchRepository {

	/** 공개 레시피에 쓰이는 재료 한 줄 (기본 양념·기타 재료 제외) */
	public record RecipeIngredient(long recipeId, long ingredientId, String name) {
	}

	/** "ingredientId 대신 substituteName 으로 가능" */
	public record SubstitutePair(long ingredientId, long substituteId, String substituteName) {
	}

	private final JdbcClient jdbc;

	public SearchRepository(JdbcClient jdbc) {
		this.jdbc = jdbc;
	}

	public List<RecipeIngredient> findMatchableIngredients() {
		return jdbc.sql("""
				select ri.recipe_id, i.id, i.name
				from recipe_ingredients ri
				join ingredients i on i.id = ri.ingredient_id
				join recipes r on r.id = ri.recipe_id
				where r.status = 'public' and not i.is_basic
				order by ri.recipe_id, ri.sort_order, ri.id
				""")
				.query((rs, n) -> new RecipeIngredient(rs.getLong("recipe_id"), rs.getLong("id"), rs.getString("name")))
				.list();
	}

	/** 가진 재료(haveIds) 중 하나로 바꿔 쓸 수 있는 "원래 재료 → 대체 재료" 쌍 */
	public List<SubstitutePair> findSubstitutesUsing(Collection<Long> haveIds) {
		if (haveIds.isEmpty()) {
			return List.of();
		}
		return jdbc.sql("""
				select s.ingredient_id, s.substitute_id, sub.name
				from ingredient_substitutes s
				join ingredients sub on sub.id = s.substitute_id
				where s.substitute_id in (:ids)
				order by s.id
				""")
				.param("ids", haveIds)
				.query((rs, n) -> new SubstitutePair(rs.getLong("ingredient_id"), rs.getLong("substitute_id"), rs.getString("name")))
				.list();
	}
}
