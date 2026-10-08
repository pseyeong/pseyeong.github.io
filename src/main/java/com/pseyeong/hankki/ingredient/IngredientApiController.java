package com.pseyeong.hankki.ingredient;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pseyeong.hankki.ingredient.IngredientRepository.Suggestion;

/** 재료 자동완성. 이름과 별칭 모두로 찾는다 ("달걀"을 쳐도 "계란"이 나온다). */
@RestController
@RequestMapping("/api/ingredients")
public class IngredientApiController {

	private static final int LIMIT = 8;

	private final IngredientRepository ingredientRepository;

	public IngredientApiController(IngredientRepository ingredientRepository) {
		this.ingredientRepository = ingredientRepository;
	}

	/**
	 * @param includeBasic 기본 양념(소금, 간장 등)도 후보에 넣을지. 재료 검색은 false(기본값),
	 *        레시피 작성(6단계)은 true 로 호출한다.
	 */
	@GetMapping("/suggest")
	public List<Suggestion> suggest(
			@RequestParam(defaultValue = "") String q,
			@RequestParam(defaultValue = "false") boolean includeBasic) {
		if (q.isBlank() || q.length() > 20) {
			return List.of();
		}
		return ingredientRepository.suggest(q, includeBasic, LIMIT);
	}
}
