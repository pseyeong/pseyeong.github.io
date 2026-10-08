package com.pseyeong.hankki.home;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import com.pseyeong.hankki.recipe.RecipeService;

@Controller
public class HomeController {

	private final RecipeService recipeService;

	public HomeController(RecipeService recipeService) {
		this.recipeService = recipeService;
	}

	@GetMapping("/")
	public String home(Model model) {
		model.addAttribute("shortcuts", Shortcut.values());
		model.addAttribute("popular", recipeService.findPopular(10));
		model.addAttribute("latest", recipeService.findLatest(10));
		return "home";
	}
}
