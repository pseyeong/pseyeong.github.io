package com.pseyeong.hankki.recipe;

/**
 * 레시피 목록 정렬. orderBy 는 코드에 고정된 SQL 조각이라 사용자 입력이 섞이지 않는다.
 * 쿼리 주소의 sort 값은 code 와 비교해서 고른다.
 */
public enum RecipeSort {

	PRICE("price", "가격 낮은순", "r.price_per_serving asc, r.id asc"),
	LATEST("latest", "최신순", "r.created_at desc, r.id desc"),
	POPULAR("popular", "인기순",
			"(select count(*) from saves s where s.recipe_id = r.id) desc, r.created_at desc, r.id desc"),
	TIME("time", "조리시간 짧은순", "r.cook_minutes asc, r.price_per_serving asc, r.id asc");

	private final String code;
	private final String label;
	private final String orderBy;

	RecipeSort(String code, String label, String orderBy) {
		this.code = code;
		this.label = label;
		this.orderBy = orderBy;
	}

	public String code() {
		return code;
	}

	public String label() {
		return label;
	}

	public String orderBy() {
		return orderBy;
	}

	/** 모르는 값이면 기본값(가격 낮은순) */
	public static RecipeSort from(String code) {
		for (RecipeSort sort : values()) {
			if (sort.code.equals(code)) {
				return sort;
			}
		}
		return PRICE;
	}
}
