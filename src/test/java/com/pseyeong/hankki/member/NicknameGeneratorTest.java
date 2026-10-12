package com.pseyeong.hankki.member;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.regex.Pattern;

import org.junit.jupiter.api.Test;

class NicknameGeneratorTest {

	/** profiles.nickname 의 DB 규칙과 같다: 2~12자, 한글·영문·숫자만 */
	private static final Pattern RULE = Pattern.compile("^[가-힣a-zA-Z0-9]{2,12}$");

	@Test
	void 만든_닉네임은_항상_닉네임_규칙을_지킨다() {
		NicknameGenerator generator = new NicknameGenerator();
		for (int i = 0; i < 20_000; i++) {
			String nickname = generator.generate();
			assertTrue(RULE.matcher(nickname).matches(), nickname);
			assertTrue(nickname.matches(".*\\d{4}$"), nickname);
		}
	}
}
