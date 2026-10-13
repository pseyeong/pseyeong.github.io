package com.pseyeong.hankki.member;

import java.util.List;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** 마이페이지: 내가 저장한 레시피, 내가 쓴 레시피 */
@Repository
public class MyPageRepository {

	/**
	 * @param hidden 숨김 처리된 레시피 (내가 쓴 레시피 목록에서만 나온다)
	 * @param saveCount 이 레시피를 저장한 사람 수
	 */
	public record Row(
			long id,
			String title,
			int pricePerServing,
			int cookMinutes,
			String tool,
			String coverImage,
			boolean hidden,
			long saveCount) {

		/** 저장한 레시피 목록의 부가 정보: "20분 · 냄비" */
		public String savedMeta() {
			return cookMinutes + "분 · " + tool;
		}

		/** 내가 쓴 레시피 목록의 부가 정보: "저장 48" (숨김이면 " · 숨김") */
		public String writtenMeta() {
			return "저장 " + saveCount + (hidden ? " · 숨김" : "");
		}
	}

	private static final String SELECT = """
			select r.id, r.title, r.price_per_serving, r.cook_minutes, r.tool, r.cover_image,
			       (r.status = 'hidden') as hidden,
			       (select count(*) from saves c where c.recipe_id = r.id) as save_count
			from recipes r
			""";

	private final JdbcClient jdbc;

	public MyPageRepository(JdbcClient jdbc) {
		this.jdbc = jdbc;
	}

	/** 저장한 순서의 최신순. 숨김·삭제된 레시피는 나오지 않는다. */
	public List<Row> findSaved(UUID userId) {
		return jdbc.sql(SELECT + """
				join saves s on s.recipe_id = r.id
				where s.user_id = :userId and r.status = 'public'
				order by s.created_at desc
				""")
				.param("userId", userId)
				.query(this::map)
				.list();
	}

	/** 숨김 상태도 포함한 내가 쓴 레시피 (최신순) */
	public List<Row> findWritten(UUID userId) {
		return jdbc.sql(SELECT + """
				where r.author_id = :userId
				order by r.created_at desc, r.id desc
				""")
				.param("userId", userId)
				.query(this::map)
				.list();
	}

	private Row map(java.sql.ResultSet rs, int n) throws java.sql.SQLException {
		return new Row(
				rs.getLong("id"),
				rs.getString("title"),
				rs.getInt("price_per_serving"),
				rs.getInt("cook_minutes"),
				rs.getString("tool"),
				rs.getString("cover_image"),
				rs.getBoolean("hidden"),
				rs.getLong("save_count"));
	}
}
