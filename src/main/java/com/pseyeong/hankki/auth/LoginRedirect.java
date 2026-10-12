package com.pseyeong.hankki.auth;

import java.nio.charset.StandardCharsets;

import org.springframework.web.util.UriUtils;

import jakarta.servlet.http.HttpServletRequest;

/** "로그인 후 돌아갈 주소"를 세션에 보관하고 꺼낸다. 값은 항상 SafeRedirect 로 검사한다. */
public final class LoginRedirect {

	static final String SESSION_KEY = "LOGIN_NEXT";

	private LoginRedirect() {
	}

	/** 안전한 next 면 보관하고, 아니면 이전에 보관한 값을 지운다 (오래된 값으로 되돌아가지 않도록) */
	public static void remember(HttpServletRequest request, String next) {
		String safe = SafeRedirect.local(next, null);
		if (safe != null) {
			request.getSession().setAttribute(SESSION_KEY, safe);
		}
		else if (request.getSession(false) != null) {
			request.getSession(false).removeAttribute(SESSION_KEY);
		}
	}

	/** 한 번 꺼내면 지운다. 없으면 fallback */
	public static String consume(HttpServletRequest request, String fallback) {
		var session = request.getSession(false);
		if (session == null) {
			return fallback;
		}
		Object value = session.getAttribute(SESSION_KEY);
		session.removeAttribute(SESSION_KEY);
		return SafeRedirect.local(value instanceof String s ? s : null, fallback);
	}

	/** /login?next=... 주소 (next 가 없거나 안전하지 않으면 /login) */
	public static String loginUrl(String next) {
		String safe = SafeRedirect.local(next, null);
		return safe == null ? "/login" : "/login?next=" + UriUtils.encodeQueryParam(safe, StandardCharsets.UTF_8);
	}
}
