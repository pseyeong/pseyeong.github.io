package com.pseyeong.hankki.member;

import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class MemberRepository {

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
