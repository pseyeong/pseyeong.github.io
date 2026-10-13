package com.pseyeong.hankki.page;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * docs/PLAN.md 사이트맵의 아직 만들지 않은 페이지들.
 * 각 단계에서 기능별 컨트롤러를 만들면 여기서 해당 매핑을 지운다.
 */
@Controller
public class PageController {

	private static final String VIEW = "pages/placeholder";

	@GetMapping("/about")
	public String about(Model model) {
		return placeholder(model, "서비스 소개", 9);
	}

	@GetMapping("/terms")
	public String terms(Model model) {
		return placeholder(model, "이용약관", 9);
	}

	@GetMapping("/privacy")
	public String privacy(Model model) {
		return placeholder(model, "개인정보처리방침", 9);
	}

	@GetMapping("/admin")
	public String admin(Model model) {
		return placeholder(model, "관리자 요약", 8);
	}

	@GetMapping("/admin/recipes")
	public String adminRecipes(Model model) {
		return placeholder(model, "레시피 관리", 8);
	}

	@GetMapping("/admin/recipes/new")
	public String adminRecipeNew(Model model) {
		return placeholder(model, "레시피 등록", 8);
	}

	@GetMapping("/admin/ingredients")
	public String adminIngredients(Model model) {
		return placeholder(model, "재료 가격표", 8);
	}

	@GetMapping("/admin/substitutes")
	public String adminSubstitutes(Model model) {
		return placeholder(model, "대체 재료", 8);
	}

	@GetMapping("/admin/pending")
	public String adminPending(Model model) {
		return placeholder(model, "기타 재료 후보", 8);
	}

	private String placeholder(Model model, String title, int step) {
		model.addAttribute("pageTitle", title);
		model.addAttribute("step", step);
		return VIEW;
	}
}
