package com.pseyeong.hankki.recipe;

import java.util.List;

import org.springframework.stereotype.Service;

/**
 * 레시피 조회.
 * TODO(3단계): 예시 데이터를 DB 조회로 바꾼다. 컨트롤러·템플릿은 그대로 둔다.
 */
@Service
public class RecipeService {

	private static final List<RecipeSummary> SAMPLE_POPULAR = List.of(
			new RecipeSummary(1, "대파 계란볶음밥", 2150, 15, "배고픈감자4821", null),
			new RecipeSummary(2, "참치 김치찌개", 2900, 20, "졸린두부0192", null),
			new RecipeSummary(3, "전자레인지 계란찜", 900, 5, "배고픈감자4821", null),
			new RecipeSummary(4, "두부 간장조림", 1800, 15, "졸린두부0192", null));

	private static final List<RecipeSummary> SAMPLE_LATEST = List.of(
			new RecipeSummary(5, "양파 듬뿍 제육볶음", 3400, 20, "졸린두부0192", null),
			new RecipeSummary(6, "에어프라이어 통감자", 1200, 25, "배고픈감자4821", null));

	public List<RecipeSummary> findPopular(int limit) {
		return SAMPLE_POPULAR.stream().limit(limit).toList();
	}

	public List<RecipeSummary> findLatest(int limit) {
		return SAMPLE_LATEST.stream().limit(limit).toList();
	}
}
