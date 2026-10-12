package com.pseyeong.hankki.auth;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

/**
 * 접근 규칙. 기본은 누구나 열람 가능하고, 아래만 로그인이 필요하다.
 * - 레시피 작성·수정, 마이페이지, 저장·저장 취소: 로그인
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
						.requestMatchers("/admin/**", "/admin").hasRole("ADMIN")
						.anyRequest().permitAll())
				.oauth2Login(oauth -> oauth
						.loginPage("/login")
						.successHandler(successHandler)
						.failureUrl("/login?error"))
				.logout(logout -> logout.logoutSuccessUrl("/"))
				.exceptionHandling(ex -> ex.authenticationEntryPoint(entryPoint));
		return http.build();
	}
}
