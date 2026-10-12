package com.pseyeong.hankki.auth;

import java.net.URI;

/**
 * 로그인 후 돌아갈 주소 검사. 이 사이트 안의 경로만 허용한다.
 * (외부 주소로 보내는 "open redirect" 공격을 막기 위해 //evil.com, https://evil.com, \ 등은 모두 거부한다)
 */
public final class SafeRedirect {

	private static final int MAX_LENGTH = 500;

	private SafeRedirect() {
	}

	/** 안전하면 그대로, 아니면 fallback */
	public static String local(String target, String fallback) {
		if (target == null || target.isBlank() || target.length() > MAX_LENGTH) {
			return fallback;
		}
		if (!target.startsWith("/") || target.startsWith("//") || target.contains("\\")) {
			return fallback;
		}
		for (int i = 0; i < target.length(); i++) {
			if (Character.isISOControl(target.charAt(i))) {
				return fallback;
			}
		}
		try {
			URI uri = URI.create(target);
			if (uri.getScheme() != null || uri.getHost() != null) {
				return fallback;
			}
		}
		catch (IllegalArgumentException e) {
			return fallback;
		}
		// 로그인 화면으로 다시 돌아오는 순환 방지
		if (target.equals("/login") || target.startsWith("/login?") || target.startsWith("/login/")
				|| target.startsWith("/oauth2/")) {
			return fallback;
		}
		return target;
	}
}
