package com.pseyeong.hankki.recipe;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriUtils;

import com.pseyeong.hankki.ingredient.IngredientRepository;
import com.pseyeong.hankki.ingredient.IngredientRepository.Ingredient;

/**
 * 검색 유입용 모음 페이지. 목록 화면(recipe/list)과 같은 구성을 쓴다.
 * - /ingredients/계란       : 이 재료를 쓰는 레시피 (별칭 "달걀"로 들어와도 같은 재료)
 * - /budget/under-3000     : 1인분 3천원 이하 레시피
 */
@Controller
public class RecipeCollectionController {

	private static final Pattern BUDGET = Pattern.compile("under-(\\d+)");

	private final RecipeService recipeService;
	private final IngredientRepository ingredientRepository;

	public RecipeCollectionController(RecipeService recipeService, IngredientRepository ingredientRepository) {
		this.recipeService = recipeService;
		this.ingredientRepository = ingredientRepository;
	}

	@GetMapping("/ingredients/{name}")
	public String byIngredient(@PathVariable String name, @RequestParam(required = false) String sort, Model model) {
		Ingredient ingredient = ingredientRepository.findByTerm(name)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
		RecipeSort current = RecipeSort.from(sort);
		List<RecipeSummary> recipes = recipeService.findByIngredient(ingredient.id(), current);

		String basePath = "/ingredients/" + UriUtils.encodePath(ingredient.name(), StandardCharsets.UTF_8);
		return render(model, ingredient.name() + " 레시피",
				ingredient.name() + "로 만드는 1인분 자취 레시피 모음. 1인분에 얼마 드는지 한눈에 확인하세요.",
				basePath, current, recipes);
	}

	@GetMapping("/budget/{range}")
	public String byBudget(@PathVariable String range, @RequestParam(required = false) String sort, Model model) {
		Matcher matcher = BUDGET.matcher(range);
		if (!matcher.matches()) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND);
		}
		int price = Integer.parseInt(matcher.group(1));
		if (!RecipeFilter.PRICES.contains(price)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND);
		}
		RecipeSort current = RecipeSort.from(sort);
		List<RecipeSummary> recipes = recipeService.search(new RecipeFilter(price, null, null, current));

		String label = price >= 10000 ? (price / 10000) + "만원" : (price / 1000) + "천원";
		return render(model, "1인분 " + label + " 이하 레시피",
				"1인분 " + label + " 이하로 만들 수 있는 자취 레시피 모음.",
				"/budget/" + range, current, recipes);
	}

	private String render(Model model, String heading, String description, String basePath, RecipeSort current,
			List<RecipeSummary> recipes) {
		model.addAttribute("heading", heading);
		model.addAttribute("pageTitle", heading + " - 자취한끼");
		model.addAttribute("description", description);
		model.addAttribute("groups", null);
		model.addAttribute("sortOptions", RecipeFilter.sortOptionsFor(basePath, current));
		model.addAttribute("recipes", recipes);
		return "recipe/list";
	}
}
