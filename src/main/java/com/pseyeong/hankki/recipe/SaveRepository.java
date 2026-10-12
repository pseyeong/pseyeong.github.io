package com.pseyeong.hankki.recipe;

import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** 레시피 저장(북마크). 공개 레시피만 저장할 수 있다. */
@Repository
public class SaveRepository {

	private final JdbcClient jdbc;

	public SaveRepository(JdbcClient jdbc) {
		this.jdbc = jdbc;
	}

	public boolean isSaved(UUID userId, long recipeId) {
		return jdbc.sql("select exists (select 1 from saves where user_id = :userId and recipe_id = :recipeId)")
				.param("userId", userId)
				.param("recipeId", recipeId)
				.query(Boolean.class)
				.single();
	}

	/** 이미 저장돼 있으면 아무 일도 하지 않는다 */
	public void save(UUID userId, long recipeId) {
		jdbc.sql("""
				insert into saves (user_id, recipe_id)
				select :userId, r.id from recipes r where r.id = :recipeId and r.status = 'public'
				on conflict do nothing
				""")
				.param("userId", userId)
				.param("recipeId", recipeId)
				.update();
	}

	public void unsave(UUID userId, long recipeId) {
		jdbc.sql("delete from saves where user_id = :userId and recipe_id = :recipeId")
				.param("userId", userId)
				.param("recipeId", recipeId)
				.update();
	}
}
