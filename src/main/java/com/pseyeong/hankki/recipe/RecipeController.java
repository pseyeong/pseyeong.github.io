package com.pseyeong.hankki.recipe;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.server.ResponseStatusException;

import com.pseyeong.hankki.member.LoginUser;

@Controller
public class RecipeController {

	private final RecipeService recipeService;
	private final SaveRepository saveRepository;

	public RecipeController(RecipeService recipeService, SaveRepository saveRepository) {
		this.recipeService = recipeService;
		this.saveRepository = saveRepository;
	}

	/** 전체 레시피 목록. 필터 상태는 쿼리 문자열에 담긴다. */
	@GetMapping("/recipes")
	public String list(
			@RequestParam(required = false) String price,
			@RequestParam(required = false) String time,
			@RequestParam(required = false) String tool,
			@RequestParam(required = false) String sort,
			Model model) {
		RecipeFilter filter = RecipeFilter.of(price, time, tool, sort);
		List<RecipeSummary> recipes = recipeService.search(filter);
		model.addAttribute("heading", "전체 레시피");
		model.addAttribute("pageTitle", "전체 레시피 - 자취한끼");
		model.addAttribute("description", "가격·조리시간·조리도구로 골라 보는 1인분 자취 레시피. 1인분에 얼마 드는지 한눈에 확인하세요.");
		model.addAttribute("groups", filter.groups());
		model.addAttribute("sortOptions", filter.sortOptions());
		model.addAttribute("recipes", recipes);
		return "recipe/list";
	}

	@GetMapping("/recipes/{id:\\d+}")
	public String detail(@PathVariable long id, @AuthenticationPrincipal LoginUser user, Model model) {
		RecipeDetail recipe = recipeService.findDetail(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
		model.addAttribute("recipe", recipe);
		model.addAttribute("saved", user != null && saveRepository.isSaved(user.id(), id));
		model.addAttribute("hideTab", true);
		return "recipe/detail";
	}
}
