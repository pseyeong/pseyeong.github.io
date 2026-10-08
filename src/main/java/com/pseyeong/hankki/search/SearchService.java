package com.pseyeong.hankki.search;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.pseyeong.hankki.recipe.RecipeFilter;
import com.pseyeong.hankki.recipe.RecipeRepository;
import com.pseyeong.hankki.recipe.RecipeSort;
import com.pseyeong.hankki.recipe.RecipeSummary;
import com.pseyeong.hankki.search.SearchRepository.RecipeIngredient;
import com.pseyeong.hankki.search.SearchRepository.SubstitutePair;
import com.pseyeong.hankki.search.SearchResult.Match;
import com.pseyeong.hankki.search.SearchResult.SubstituteMatch;

@Service
public class SearchService {

	private final SearchRepository searchRepository;
	private final RecipeRepository recipeRepository;

	public SearchService(SearchRepository searchRepository, RecipeRepository recipeRepository) {
		this.searchRepository = searchRepository;
		this.recipeRepository = recipeRepository;
	}

	/**
	 * 가진 재료로 만들 수 있는 레시피를 찾는다.
	 * - 기본 양념과 기타 재료는 매칭에서 제외한다.
	 * - 겹치는 재료가 많은 순, 부족한 재료가 적은 순, 가격 낮은 순으로 정렬한다.
	 * - 부족한 재료를 모두 대체 재료로 메울 수 있으면 따로 묶는다. (matches 에는 넣지 않는다)
	 */
	public SearchResult search(Collection<Long> haveIds) {
		if (haveIds.isEmpty()) {
			return new SearchResult(List.of(), List.of());
		}
		Set<Long> have = Set.copyOf(haveIds);

		Map<Long, RecipeSummary> summaries = recipeRepository.search(RecipeFilter.none(RecipeSort.PRICE), null).stream()
				.collect(Collectors.toMap(RecipeSummary::id, r -> r));
		Map<Long, List<RecipeIngredient>> ingredientsByRecipe = new LinkedHashMap<>();
		for (RecipeIngredient row : searchRepository.findMatchableIngredients()) {
			ingredientsByRecipe.computeIfAbsent(row.recipeId(), k -> new ArrayList<>()).add(row);
		}
		Map<Long, SubstitutePair> substituteFor = new HashMap<>();
		for (SubstitutePair pair : searchRepository.findSubstitutesUsing(have)) {
			substituteFor.putIfAbsent(pair.ingredientId(), pair);
		}

		List<Match> matches = new ArrayList<>();
		List<SubstituteMatch> substitutes = new ArrayList<>();
		for (Map.Entry<Long, List<RecipeIngredient>> entry : ingredientsByRecipe.entrySet()) {
			RecipeSummary recipe = summaries.get(entry.getKey());
			List<RecipeIngredient> ingredients = entry.getValue();
			List<RecipeIngredient> missing = ingredients.stream().filter(i -> !have.contains(i.ingredientId())).toList();
			int haveCount = ingredients.size() - missing.size();

			if (!missing.isEmpty() && missing.stream().allMatch(i -> substituteFor.containsKey(i.ingredientId()))) {
				substitutes.add(new SubstituteMatch(recipe, hint(missing, substituteFor)));
			}
			else if (haveCount >= 1) {
				matches.add(new Match(recipe, ingredients.size(), haveCount, missing.stream().map(RecipeIngredient::name).toList()));
			}
		}

		matches.sort(Comparator
				.comparingInt(Match::have).reversed()
				.thenComparingInt(m -> m.missing().size())
				.thenComparingInt(m -> m.recipe().pricePerServing())
				.thenComparingLong(m -> m.recipe().id()));
		substitutes.sort(Comparator
				.comparingInt((SubstituteMatch s) -> s.recipe().pricePerServing())
				.thenComparingLong(s -> s.recipe().id()));
		return new SearchResult(matches, substitutes);
	}

	/** "쪽파 대신 대파로 가능" (여러 개면 "쪽파 대신 대파 등 3개 재료 대체 가능") */
	private static String hint(List<RecipeIngredient> missing, Map<Long, SubstitutePair> substituteFor) {
		RecipeIngredient first = missing.get(0);
		String substitute = substituteFor.get(first.ingredientId()).substituteName();
		if (missing.size() == 1) {
			return first.name() + " 대신 " + substitute + particleRo(substitute) + " 가능";
		}
		return first.name() + " 대신 " + substitute + " 등 " + missing.size() + "개 재료 대체 가능";
	}

	/** 받침이 없거나 ㄹ 받침이면 "로", 그 밖의 받침이면 "으로" */
	static String particleRo(String word) {
		char last = word.charAt(word.length() - 1);
		if (last < 0xAC00 || last > 0xD7A3) {
			return "로";
		}
		int finalConsonant = (last - 0xAC00) % 28;
		return finalConsonant == 0 || finalConsonant == 8 ? "로" : "으로";
	}
}
