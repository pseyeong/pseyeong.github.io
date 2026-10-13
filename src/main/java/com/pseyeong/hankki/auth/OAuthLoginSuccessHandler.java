package com.pseyeong.hankki.auth;

import java.io.IOException;

import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import com.pseyeong.hankki.member.LoginUser;
import com.pseyeong.hankki.member.MemberService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * 카카오·구글 로그인이 성공하면:
 * 1) 소셜 계정 고유 번호로 회원을 찾거나 처음이면 랜덤 닉네임으로 가입시키고
 * 2) 소셜 쪽 정보(실명, 사진 등)는 버리고 우리 회원 정보(LoginUser)만 세션에 담은 뒤
 * 3) 로그인 전에 보던 페이지로 돌려보낸다.
 */
@Component
public class OAuthLoginSuccessHandler implements AuthenticationSuccessHandler {

	private final MemberService memberService;
	private final LoginSession loginSession;

	public OAuthLoginSuccessHandler(MemberService memberService, LoginSession loginSession) {
		this.memberService = memberService;
		this.loginSession = loginSession;
	}

	@Override
	public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
			Authentication authentication) throws IOException {
		OAuth2AuthenticationToken oauth = (OAuth2AuthenticationToken) authentication;
		LoginUser user = memberService.findOrCreate(oauth.getAuthorizedClientRegistrationId(), oauth.getName());
		loginSession.establish(request, response, user);
		response.sendRedirect(request.getContextPath() + LoginRedirect.consume(request, "/"));
	}
}
