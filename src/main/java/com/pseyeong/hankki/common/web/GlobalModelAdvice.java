package com.pseyeong.hankki.common.web;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

import com.pseyeong.hankki.member.LoginUser;

import jakarta.servlet.http.HttpServletRequest;

/**
 * 모든 화면(템플릿)에서 공통으로 쓰는 값을 모델에 넣는다.
 * Thymeleaf 3.1부터 템플릿에서 #request 를 쓸 수 없어서 현재 경로를 여기서 넘긴다.
 * loginUser: 로그인한 회원 (비로그인이면 null)
 */
@ControllerAdvice(annotations = Controller.class)
public class GlobalModelAdvice {

	@ModelAttribute
	public void addCommonAttributes(HttpServletRequest request, @AuthenticationPrincipal LoginUser loginUser,
			Model model) {
		model.addAttribute("loginUser", loginUser);
		model.addAttribute("currentPath", request.getRequestURI());
		model.addAttribute("navTabs", NavTab.values());
	}
}
