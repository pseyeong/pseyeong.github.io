package com.pseyeong.hankki.search;

import java.util.List;

import com.pseyeong.hankki.recipe.RecipeSummary;

/**
 * 재료 검색 결과.
 *
 * @param matches 가진 재료와 겹치는 레시피 (일치순)
 * @param substitutes 대체 재료를 쓰면 만들 수 있는 레시피 (matches 와 겹치지 않는다)
 */
public record SearchResult(List<Match> matches, List<SubstituteMatch> substitutes) {

	/**
	 * @param total 레시피에 쓰이는 재료 수 (기본 양념·기타 재료 제외)
	 * @param have 그 중 가진 재료 수
	 * @param missing 부족한 재료 이름
	 */
	public record Match(RecipeSummary recipe, int total, int have, List<String> missing) {

		public boolean complete() {
			return missing.isEmpty();
		}

		/** "재료 모두 보유" / "4개 중 3개 보유" */
		public String badge() {
			return complete() ? "재료 모두 보유" : total + "개 중 " + have + "개 보유";
		}

		/** "지금 바로 만들 수 있어요" / "햄만 더 있으면 돼요" / "참치캔, 부침가루 필요" */
		public String need() {
			if (complete()) {
				return "지금 바로 만들 수 있어요";
			}
			if (missing.size() == 1) {
				return missing.get(0) + "만 더 있으면 돼요";
			}
			List<String> shown = missing.size() > 3 ? missing.subList(0, 3) : missing;
			String names = String.join(", ", shown);
			return missing.size() > 3 ? names + " 외 " + (missing.size() - 3) + "개 필요" : names + " 필요";
		}
	}

	/** @param hint "쪽파 대신 대파로 가능" */
	public record SubstituteMatch(RecipeSummary recipe, String hint) {
	}
}
