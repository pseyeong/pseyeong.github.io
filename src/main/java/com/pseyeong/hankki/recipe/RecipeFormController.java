package com.pseyeong.hankki.recipe;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.server.ResponseStatusException;

import com.pseyeong.hankki.common.web.ApiException;
import com.pseyeong.hankki.member.LoginUser;
import com.pseyeong.hankki.recipe.RecipeWriteRepository.EditIngredient;
import com.pseyeong.hankki.recipe.RecipeWriteRepository.EditRow;
import com.pseyeong.hankki.storage.SupabaseStorage;

/**
 * 레시피 작성·수정 화면. 로그인이 필요하고(SecurityConfig), 수정은 작성자 본인(관리자 제외)만 열 수 있다.
 * 저장은 화면의 자바스크립트가 /api/recipes 로 보낸다.
 */
@Controller
public class RecipeFormController {

	private final RecipeWriteService writeService;
	private final RecipeWriteRepository writeRepository;
	private final RecipeRepository recipeRepository;
	private final SupabaseStorage storage;

	public RecipeFormController(RecipeWriteService writeService, RecipeWriteRepository writeRepository,
			RecipeRepository recipeRepository, SupabaseStorage storage) {
		this.writeService = writeService;
		this.writeRepository = writeRepository;
		this.recipeRepository = recipeRepository;
		this.storage = storage;
	}

	@GetMapping("/recipes/new")
	public String create(Model model) {
		return form(model, "new", null, null);
	}

	@GetMapping("/recipes/{id:\\d+}/edit")
	public String edit(@PathVariable long id, @AuthenticationPrincipal LoginUser user, Model model) {
		EditRow recipe;
		try {
			recipe = writeService.loadForEdit(user, id);
		}
		catch (ApiException e) {
			throw new ResponseStatusException(e.status());
		}
		return form(model, "edit", id, formData(recipe));
	}

	private String form(Model model, String mode, Long recipeId, Map<String, Object> formData) {
		model.addAttribute("mode", mode);
		model.addAttribute("recipeId", recipeId);
		model.addAttribute("formData", formData);
		model.addAttribute("tools", List.of("프라이팬", "냄비", "전자레인지", "에어프라이어"));
		model.addAttribute("storageReady", storage.isConfigured());
		model.addAttribute("hideTab", true);
		return "recipe/form";
	}

	/** 수정 화면의 기존 내용 (자바스크립트에 JSON 으로 전달된다) */
	private Map<String, Object> formData(EditRow recipe) {
		Map<String, Object> data = new LinkedHashMap<>();
		data.put("id", recipe.id());
		data.put("title", recipe.title());
		data.put("servings", recipe.servings());
		data.put("cookMinutes", recipe.cookMinutes());
		data.put("tool", recipe.tool());
		data.put("coverImage", recipe.coverImage());

		List<Map<String, Object>> ingredients = new ArrayList<>();
		for (EditIngredient i : writeRepository.findIngredientsForEdit(recipe.id())) {
			Map<String, Object> row = new LinkedHashMap<>();
			boolean custom = i.ingredientId() == null;
			row.put("ingredientId", i.ingredientId());
			row.put("name", custom ? i.customName() : i.name());
			row.put("custom", custom);
			row.put("unit", i.unit());
			row.put("unitPrice", i.unitPrice());
			row.put("basic", i.basic());
			row.put("quantity", i.quantity());
			row.put("displayAmount", i.displayAmount());
			ingredients.add(row);
		}
		data.put("ingredients", ingredients);

		List<Map<String, Object>> steps = new ArrayList<>();
		for (RecipeDetail.Step s : recipeRepository.findSteps(recipe.id())) {
			Map<String, Object> row = new LinkedHashMap<>();
			row.put("content", s.content());
			row.put("image", s.image());
			steps.add(row);
		}
		data.put("steps", steps);
		return data;
	}
}
