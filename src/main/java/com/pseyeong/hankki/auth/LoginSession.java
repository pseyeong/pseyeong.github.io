package com.pseyeong.hankki.auth;

import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Component;

import com.pseyeong.hankki.member.LoginUser;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * 로그인한 회원 정보(LoginUser)를 세션에 담는다.
 * 소셜 로그인 직후와, 닉네임을 바꿔서 세션의 정보를 새로 고쳐야 할 때 같은 방식으로 쓴다.
 */
@Component
public class LoginSession {

	private final SecurityContextRepository repository = new HttpSessionSecurityContextRepository();

	public void establish(HttpServletRequest request, HttpServletResponse response, LoginUser user) {
		List<SimpleGrantedAuthority> authorities = user.isAdmin()
				? List.of(new SimpleGrantedAuthority("ROLE_USER"), new SimpleGrantedAuthority("ROLE_ADMIN"))
				: List.of(new SimpleGrantedAuthority("ROLE_USER"));
		SecurityContext context = SecurityContextHolder.createEmptyContext();
		context.setAuthentication(new UsernamePasswordAuthenticationToken(user, null, authorities));
		SecurityContextHolder.setContext(context);
		repository.saveContext(context, request, response);
	}
}
