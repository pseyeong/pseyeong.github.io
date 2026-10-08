package com.pseyeong.hankki.search;

import java.net.URI;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.util.UriComponentsBuilder;

import com.pseyeong.hankki.ingredient.IngredientRepository;
import com.pseyeong.hankki.ingredient.IngredientRepository.Ingredient;

/**
 * 재료로 레시피 찾기. 선택한 재료는 주소에 담긴다: /search?q=계란,양파
 * 이름과 별칭 모두 받는다 ("달걀" → "계란"). 등록되지 않은 재료와 기본 양념은 무시한다.
 */
@Controller
public class SearchController {

	private static final int MAX_INGREDIENTS = 10;

	/** 선택한 재료 칩. href 는 이 재료를 뺀 주소 */
	public record Chip(String name, String removeHref) {
	}

	private final IngredientRepository ingredientRepository;
	private final SearchService searchService;

	public SearchController(IngredientRepository ingredientRepository, SearchService searchService) {
		this.ingredientRepository = ingredientRepository;
		this.searchService = searchService;
	}

	@GetMapping("/search")
	public String search(@RequestParam(required = false) String q, Model model) {
		Map<Long, Ingredient> selected = resolve(q);

		List<Chip> chips = new ArrayList<>();
		for (Ingredient ingredient : selected.values()) {
			List<String> others = selected.values().stream()
					.filter(i -> i.id() != ingredient.id()).map(Ingredient::name).toList();
			chips.add(new Chip(ingredient.name(), link(others)));
		}

		model.addAttribute("chips", chips);
		model.addAttribute("q", String.join(",", selected.values().stream().map(Ingredient::name).toList()));
		model.addAttribute("hasSelection", !selected.isEmpty());
		model.addAttribute("result", searchService.search(selected.keySet()));
		return "search/index";
	}

	/** 입력창에서 재료를 고르면(자바스크립트 없이 Enter 만 쳐도) 선택 목록에 더해 다시 보여준다. */
	@GetMapping(path = "/search", params = "add")
	public ResponseEntity<Void> add(@RequestParam(required = false) String q, @RequestParam String add) {
		Map<Long, Ingredient> selected = resolve((q == null ? "" : q) + "," + add);
		return ResponseEntity.status(HttpStatus.SEE_OTHER)
				.header(HttpHeaders.LOCATION, URI.create(link(selected.values().stream().map(Ingredient::name).toList())).toASCIIString())
				.build();
	}

	/** "계란, 달걀,양파" → {계란, 양파} (중복·모르는 재료·기본 양념 제외, 최대 10개) */
	private Map<Long, Ingredient> resolve(String q) {
		Map<Long, Ingredient> result = new LinkedHashMap<>();
		if (q == null || q.isBlank()) {
			return result;
		}
		for (String term : q.split(",")) {
			if (result.size() >= MAX_INGREDIENTS) {
				break;
			}
			if (term.isBlank() || term.length() > 20) {
				continue;
			}
			ingredientRepository.findByTerm(term)
					.filter(i -> !i.basic())
					.ifPresent(i -> result.putIfAbsent(i.id(), i));
		}
		return result;
	}

	private static String link(List<String> names) {
		UriComponentsBuilder builder = UriComponentsBuilder.fromPath("/search");
		if (!names.isEmpty()) {
			builder.queryParam("q", String.join(",", names));
		}
		return builder.build().encode().toUriString();
	}
}
