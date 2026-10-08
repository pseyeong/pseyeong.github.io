package com.pseyeong.hankki.recipe;

/**
 * 목록·카드에 쓰는 레시피 요약.
 *
 * @param pricePerServing 1인분 단가(원)
 * @param coverImage 대표 사진 주소, 없으면 null (사진 자리 표시)
 */
public record RecipeSummary(
		long id,
		String title,
		int pricePerServing,
		int cookMinutes,
		String authorNickname,
		String coverImage) {

	public String cookTimeLabel() {
		return cookMinutes + "분";
	}
}
