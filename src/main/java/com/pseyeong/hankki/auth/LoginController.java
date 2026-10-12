package com.pseyeong.hankki.auth;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.pseyeong.hankki.member.LoginUser;

import jakarta.servlet.http.HttpServletRequest;

@Controller
public class LoginController {

	/**
	 * @param next 로그인 후 돌아갈 이 사이트 안의 경로 (예: /recipes/7)
	 */
	@GetMapping("/login")
	public String login(@RequestParam(required = false) String next, @AuthenticationPrincipal LoginUser user,
			HttpServletRequest request, Model model) {
		if (user != null) {
			return "redirect:" + SafeRedirect.local(next, "/");
		}
		LoginRedirect.remember(request, next);
		model.addAttribute("hideTab", true);
		return "auth/login";
	}
}
