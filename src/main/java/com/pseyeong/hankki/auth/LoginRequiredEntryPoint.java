package com.pseyeong.hankki.auth;

import java.io.IOException;
import java.net.URI;

import org.springframework.http.HttpMethod;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * 비로그인으로 로그인이 필요한 곳에 들어오면 /login 으로 보낸다. 로그인하면 원래 페이지로 돌아온다.
 * GET 이면 요청한 주소로, POST(저장 버튼 등)면 요청이 시작된 화면(Referer)으로 돌아온다.
 */
@Component
public class LoginRequiredEntryPoint implements AuthenticationEntryPoint {

	@Override
	public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception)
			throws IOException {
		String next = HttpMethod.GET.matches(request.getMethod()) ? requestedPath(request) : refererPath(request);
		response.sendRedirect(request.getContextPath() + LoginRedirect.loginUrl(next));
	}

	private static String requestedPath(HttpServletRequest request) {
		String query = request.getQueryString();
		return request.getRequestURI() + (query == null ? "" : "?" + query);
	}

	/** Referer 가 같은 사이트일 때만 경로를 꺼낸다 */
	private static String refererPath(HttpServletRequest request) {
		String referer = request.getHeader("Referer");
		if (referer == null) {
			return null;
		}
		try {
			URI uri = URI.create(referer);
			if (uri.getHost() == null || !uri.getHost().equalsIgnoreCase(request.getServerName())) {
				return null;
			}
			return uri.getRawPath() + (uri.getRawQuery() == null ? "" : "?" + uri.getRawQuery());
		}
		catch (IllegalArgumentException e) {
			return null;
		}
	}
}
