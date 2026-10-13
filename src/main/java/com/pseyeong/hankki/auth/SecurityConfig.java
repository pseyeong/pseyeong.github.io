package com.pseyeong.hankki.auth;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.authentication.DelegatingAuthenticationEntryPoint;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.util.matcher.RequestMatcher;

/**
 * 접근 규칙. 기본은 누구나 열람 가능하고, 아래만 로그인이 필요하다.
 * - 레시피 작성·수정(화면과 API), 사진 업로드, 마이페이지, 저장·저장 취소: 로그인
 * - /admin: 관리자 (8단계에서 화면을 만들 때 DB 역할과 함께 완성)
 * 로그인하지 않고 들어오면 /login 으로 보내고, 로그인하면 원래 페이지로 돌아온다.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

	@Bean
	public SecurityFilterChain filterChain(HttpSecurity http, LoginRequiredEntryPoint entryPoint,
			OAuthLoginSuccessHandler successHandler) throws Exception {
		http
				.authorizeHttpRequests(auth -> auth
						.requestMatchers("/recipes/new", "/recipes/*/edit", "/my/**", "/my").authenticated()
						.requestMatchers(HttpMethod.POST, "/recipes/*/save", "/recipes/*/unsave").authenticated()
						.requestMatchers("/api/recipes/**", "/api/uploads/**", "/api/me/**").authenticated()
						.requestMatchers("/admin/**", "/admin").hasRole("ADMIN")
						.anyRequest().permitAll())
				.oauth2Login(oauth -> oauth
						.loginPage("/login")
						.successHandler(successHandler)
						.failureUrl("/login?error"))
				.logout(logout -> logout.logoutSuccessUrl("/"))
				.exceptionHandling(ex -> ex.authenticationEntryPoint(entryPointFor(entryPoint)));
		return http.build();
	}

	/**
	 * 화면 요청은 /login 으로 보내고, /api 요청은 로그인 화면 대신 401 을 돌려준다 (자바스크립트가 처리).
	 * authenticationEntryPoint 를 직접 지정하면 defaultAuthenticationEntryPointFor 가 무시되어 직접 위임한다.
	 */
	private static AuthenticationEntryPoint entryPointFor(LoginRequiredEntryPoint pageEntryPoint) {
		RequestMatcher api = request -> request.getRequestURI().startsWith("/api/");
		return DelegatingAuthenticationEntryPoint.builder()
				.addEntryPointFor(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED), api)
				.defaultEntryPoint(pageEntryPoint)
				.build();
	}
}
