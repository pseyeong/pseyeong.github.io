package com.pseyeong.hankki.member;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class MemberRepository {

	/** @param changedAt 마지막으로 닉네임을 바꾼 시각. 한 번도 안 바꿨으면 null */
	public record NicknameState(String nickname, OffsetDateTime changedAt) {
	}

	private final JdbcClient jdbc;

	public MemberRepository(JdbcClient jdbc) {
		this.jdbc = jdbc;
	}

	public Optional<LoginUser> findByProvider(String provider, String providerId) {
		return jdbc.sql("select id, nickname, role from profiles where provider = :provider and provider_id = :providerId")
				.param("provider", provider)
				.param("providerId", providerId)
				.query((rs, n) -> new LoginUser(rs.getObject("id", UUID.class), rs.getString("nickname"), rs.getString("role")))
				.optional();
	}

	public Optional<NicknameState> findNicknameState(UUID id) {
		return jdbc.sql("select nickname, nickname_changed_at from profiles where id = :id")
				.param("id", id)
				.query((rs, n) -> new NicknameState(rs.getString("nickname"), rs.getObject("nickname_changed_at", OffsetDateTime.class)))
				.optional();
	}

	/** 대소문자를 무시하고 다른 회원이 이미 쓰는 닉네임인지 (excludeId 본인은 제외) */
	public boolean isNicknameTaken(String nickname, UUID excludeId) {
		return jdbc.sql("select exists (select 1 from profiles where lower(nickname) = lower(:nickname) and id <> :id)")
				.param("nickname", nickname)
				.param("id", excludeId)
				.query(Boolean.class)
				.single();
	}

	/** 닉네임을 바꾸고 변경 시각을 기록한다. 겹치면 DuplicateKeyException (DB 고유 제약). */
	public void updateNickname(UUID id, String nickname) {
		jdbc.sql("update profiles set nickname = :nickname, nickname_changed_at = now() where id = :id")
				.param("id", id)
				.param("nickname", nickname)
				.update();
	}

	/** 회원 삭제. 저장 목록은 함께 삭제되고, 쓴 레시피는 남고 작성자만 비워진다 (FK 규칙). */
	public void delete(UUID id) {
		jdbc.sql("delete from profiles where id = :id").param("id", id).update();
	}

	/**
	 * 새 회원을 만든다. 닉네임(대소문자 무시)이나 소셜 계정이 이미 있으면 DuplicateKeyException.
	 */
	public LoginUser insert(String provider, String providerId, String nickname) {
		return jdbc.sql("""
				insert into profiles (nickname, provider, provider_id)
				values (:nickname, :provider, :providerId)
				returning id, nickname, role
				""")
				.param("nickname", nickname)
				.param("provider", provider)
				.param("providerId", providerId)
				.query((rs, n) -> new LoginUser(rs.getObject("id", UUID.class), rs.getString("nickname"), rs.getString("role")))
				.single();
	}
}
