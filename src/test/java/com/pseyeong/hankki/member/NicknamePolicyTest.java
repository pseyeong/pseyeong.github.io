package com.pseyeong.hankki.member;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class NicknamePolicyTest {

	private final NicknamePolicy policy = new NicknamePolicy();

	@ParameterizedTest
	@ValueSource(strings = {"배고픈감자4821", "ab", "Abc123", "가나", "열두글자열두글자열두글자"})
	void 규칙에_맞는_닉네임은_통과한다(String nickname) {
		assertNull(policy.formatError(nickname), nickname);
	}

	@Test
	void 길이_문자_규칙을_지킨다() {
		assertEquals("2자 이상 입력해 주세요", policy.formatError("a"));
		assertEquals("2자 이상 입력해 주세요", policy.formatError(""));
		assertEquals("2자 이상 입력해 주세요", policy.formatError(null));
		assertEquals("12자 이하로 입력해 주세요", policy.formatError("가".repeat(13)));
		assertEquals("한글·영문·숫자만 쓸 수 있어요", policy.formatError("감자 튀김"));
		assertEquals("한글·영문·숫자만 쓸 수 있어요", policy.formatError("감자!"));
		assertEquals("한글·영문·숫자만 쓸 수 있어요", policy.formatError("ㅋㅋㅋ"));
	}

	@ParameterizedTest
	@ValueSource(strings = {"시발놈", "FUCKyou", "개새끼1"})
	void 욕설은_대소문자와_상관없이_거른다(String nickname) {
		assertEquals("사용할 수 없는 표현이 들어 있어요", policy.formatError(nickname));
	}

	@ParameterizedTest
	@ValueSource(strings = {"관리자", "ADMIN", "운영자님", "자취한끼", "공식계정"})
	void 운영_사칭_닉네임은_거른다(String nickname) {
		assertNotNull(policy.formatError(nickname), nickname);
	}

	@Test
	void 랜덤_닉네임은_항상_규칙과_금칙어를_통과한다() {
		NicknameGenerator generator = new NicknameGenerator();
		for (int i = 0; i < 20_000; i++) {
			String nickname = generator.generate();
			assertNull(policy.formatError(nickname), nickname);
		}
	}

	@Test
	void 아바타_글자는_닉네임의_음식_이름이다() {
		assertEquals("감자", NicknameGenerator.avatarLabel("배고픈감자4821"));
		assertEquals("볶음밥", NicknameGenerator.avatarLabel("행복한볶음밥0012"));
		assertEquals("순두부", NicknameGenerator.avatarLabel("느린순두부9999")); // "두부"보다 긴 "순두부"를 고른다
		assertEquals("Ab", NicknameGenerator.avatarLabel("Abc123")); // 직접 바꾼 닉네임은 앞 두 글자
	}
}
