package com.pseyeong.hankki.recipe;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

/**
 * 레시피 상세 화면용 데이터.
 *
 * @param pricePerServing DB 에 저장된 1인분 단가 (기본 양념 제외)
 * @param partialPrice 기타 재료가 있어 일부 재료가 단가에서 빠졌는지
 * @param priceDate 가격 기준일 (재료 가격 중 가장 최근 갱신일), 없으면 null
 * @param shoppingCost 처음 장볼 때 드는 비용 (포장 단위로 사서 남는 재료 포함)
 * @param ingredients 단가에 들어간 재료 (기본 양념 제외)
 * @param customIngredients 기타 재료 (단가 제외)
 * @param seasonings 기본 양념 이름
 */
public record RecipeDetail(
		long id,
		UUID authorId,
		String title,
		String description,
		String coverImage,
		int servings,
		int cookMinutes,
		String tool,
		int pricePerServing,
		boolean partialPrice,
		String authorNickname,
		LocalDate priceDate,
		int shoppingCost,
		List<Line> ingredients,
		List<Line> customIngredients,
		List<String> seasonings,
		List<Step> steps) {

	private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("yyyy.MM.dd");

	/**
	 * @param cost 이 레시피 전체 사용량 기준 금액(원), 계산할 수 없으면 null
	 * @param substitutes 대체 재료 (없으면 빈 목록)
	 */
	public record Line(Long ingredientId, String name, String amount, Integer cost, List<Substitute> substitutes) {

		public boolean hasSubstitutes() {
			return !substitutes.isEmpty();
		}

		/** 대체 시트 맨 위 설명: "이 레시피 기준 대파 1/2대 (40g) · 300원" */
		public String sheetSubtitle() {
			String price = cost == null ? "" : " · " + String.format("%,d", cost) + "원";
			return "이 레시피 기준 " + name + " " + amount + price;
		}
	}

	/**
	 * 대체 재료 한 건.
	 *
	 * @param delta 이 레시피 사용량 기준, 원래 재료와의 차액(원). 계산할 수 없으면 null
	 * @param ratioLabel "대파 1 : 쪽파 1 → 40g"
	 */
	public record Substitute(String name, String tag, Integer delta, String ratioLabel, String note) {

		/** "+80원", "-120원", "0원" */
		public String deltaLabel() {
			if (delta == null) {
				return "";
			}
			return (delta > 0 ? "+" : delta < 0 ? "-" : "") + String.format("%,d", Math.abs(delta)) + "원";
		}

		/** 태그 색: 없을 때(흰색) / 더 싸게(초록) / 더 가볍게(검정) */
		public String tagClass() {
			return switch (tag) {
				case "더 싸게" -> "bg-primary text-on-primary";
				case "더 가볍게" -> "bg-ink text-surface";
				default -> "bg-surface text-ink";
			};
		}
	}

	public record Step(int no, String content, String image) {
	}

	/** 제목을 첫 공백에서 두 줄로 나눈다: "대파 계란볶음밥" → ["대파", "계란볶음밥"] */
	public List<String> titleParts() {
		return List.of(title.split(" ", 2));
	}

	/** "배고픈감자4821 · 15분 · 1인분 · 프라이팬" */
	public String metaLine() {
		return authorNickname + " · " + cookMinutes + "분 · " + servings + "인분 · " + tool;
	}

	/** "추정치예요 · 가격 기준일 2026.10.01 · 일부 재료 제외" */
	public String priceNote() {
		StringBuilder note = new StringBuilder("추정치예요");
		if (priceDate != null) {
			note.append(" · 가격 기준일 ").append(DATE.format(priceDate));
		}
		if (partialPrice) {
			note.append(" · 일부 재료 제외");
		}
		return note.toString();
	}

	/** 검색 결과·공유 미리보기에 쓰는 설명 */
	public String metaDescription() {
		if (description != null && !description.isBlank()) {
			return description;
		}
		return "1인분 약 " + String.format("%,d", pricePerServing) + "원 · " + metaLine();
	}
}
