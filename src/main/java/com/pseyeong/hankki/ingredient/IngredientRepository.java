package com.pseyeong.hankki.ingredient;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class IngredientRepository {

	/** @param basic 기본 양념 여부 (소금, 간장 등) */
	public record Ingredient(long id, String name, boolean basic) {
	}

	/**
	 * 자동완성 후보. 별칭으로 찾은 경우 alias 에 그 별칭이 들어간다 ("달걀" → 계란).
	 * 레시피 작성 화면이 예상 단가를 바로 계산하도록 단위와 단위당 가격도 함께 준다 (공개 정보).
	 */
	public record Suggestion(long id, String name, String alias, String unit, BigDecimal unitPrice, boolean basic) {
	}

	private final JdbcClient jdbc;

	public IngredientRepository(JdbcClient jdbc) {
		this.jdbc = jdbc;
	}

	/** 이름 또는 별칭이 정확히 일치하는 재료 (대소문자 무시) */
	public Optional<Ingredient> findByTerm(String term) {
		return jdbc.sql("""
				select id, name, is_basic from ingredients
				where lower(name) = lower(:term)
				   or exists (select 1 from unnest(aliases) a where lower(a) = lower(:term))
				order by (lower(name) = lower(:term)) desc
				limit 1
				""")
				.param("term", term.trim())
				.query((rs, n) -> new Ingredient(rs.getLong("id"), rs.getString("name"), rs.getBoolean("is_basic")))
				.optional();
	}

	/** 이름이나 별칭에 q 가 들어간 재료. 이름이 q 로 시작하는 것을 먼저 보여준다. */
	public List<Suggestion> suggest(String q, boolean includeBasic, int limit) {
		String escaped = escapeLike(q.trim());
		return jdbc.sql("""
				select i.id, i.name, i.unit, i.unit_price, i.is_basic,
				       case when i.name ilike :contains escape '\\' then null
				            else (select a from unnest(i.aliases) a where a ilike :contains escape '\\' order by a limit 1)
				       end as alias
				from ingredients i
				where (i.name ilike :contains escape '\\'
				       or exists (select 1 from unnest(i.aliases) a where a ilike :contains escape '\\'))
				  and (:includeBasic or not i.is_basic)
				order by (i.name ilike :prefix escape '\\') desc, i.name
				limit :limit
				""")
				.param("contains", "%" + escaped + "%")
				.param("prefix", escaped + "%")
				.param("includeBasic", includeBasic)
				.param("limit", limit)
				.query((rs, n) -> new Suggestion(rs.getLong("id"), rs.getString("name"), rs.getString("alias"),
						rs.getString("unit"), rs.getBigDecimal("unit_price"), rs.getBoolean("is_basic")))
				.list();
	}

	/** ids 중 실제로 등록된 재료의 id */
	public List<Long> findExistingIds(Collection<Long> ids) {
		if (ids.isEmpty()) {
			return List.of();
		}
		return jdbc.sql("select id from ingredients where id in (:ids)")
				.param("ids", ids)
				.query(Long.class)
				.list();
	}

	private static String escapeLike(String value) {
		return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
	}
}
