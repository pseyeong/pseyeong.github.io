package com.pseyeong.hankki.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class SafeRedirectTest {

	@Test
	void 사이트_안의_경로는_그대로_허용한다() {
		assertEquals("/recipes/7", SafeRedirect.local("/recipes/7", "/"));
		assertEquals("/search?q=계란,양파", SafeRedirect.local("/search?q=계란,양파", "/"));
	}

	@ParameterizedTest
	@ValueSource(strings = {
			"https://evil.com", "//evil.com", "/\\evil.com", "evil.com", "javascript:alert(1)",
			"/login", "/login?next=/", "/oauth2/authorization/kakao", "/a\nb", ""})
	void 외부_주소와_순환_주소는_거부한다(String target) {
		assertEquals("/", SafeRedirect.local(target, "/"));
	}

	@Test
	void null_과_너무_긴_주소는_거부한다() {
		assertEquals("/", SafeRedirect.local(null, "/"));
		assertEquals("/", SafeRedirect.local("/" + "a".repeat(600), "/"));
	}
}
