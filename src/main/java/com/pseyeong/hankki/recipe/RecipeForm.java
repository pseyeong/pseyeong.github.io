package com.pseyeong.hankki.recipe;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

/**
 * 레시피 작성·수정 입력 (브라우저가 JSON 으로 보낸다).
 * 항목별 형식은 여기서, 재료 존재 여부·사진 주소·권한 같은 DB 가 필요한 검사는 RecipeWriteService 에서 한다.
 *
 * @param coverImage 대표 사진 공개 주소 (없으면 null)
 */
public record RecipeForm(
		@NotBlank(message = "제목을 입력해 주세요.")
		@Size(max = 60, message = "제목은 60자 이하로 적어 주세요.")
		String title,

		@Min(value = 1, message = "인분은 1 이상이어야 해요.")
		@Max(value = 20, message = "인분은 20 이하로 적어 주세요.")
		int servings,

		@Min(value = 1, message = "조리시간은 1분 이상이어야 해요.")
		@Max(value = 600, message = "조리시간은 600분 이하로 적어 주세요.")
		int cookMinutes,

		@NotBlank(message = "조리도구를 골라 주세요.")
		String tool,

		@Size(max = 500)
		String coverImage,

		@NotEmpty(message = "재료를 하나 이상 넣어 주세요.")
		@Size(max = 30, message = "재료는 30개까지 넣을 수 있어요.")
		List<@Valid Ingredient> ingredients,

		@NotEmpty(message = "조리 순서를 하나 이상 적어 주세요.")
		@Size(max = 30, message = "조리 순서는 30단계까지 적을 수 있어요.")
		List<@Valid Step> steps) {

	/** 등록된 재료는 ingredientId + quantity, 기타 재료는 customName (단가 제외, quantity 없음) */
	public record Ingredient(
			Long ingredientId,

			@Size(max = 30, message = "기타 재료 이름은 30자 이하로 적어 주세요.")
			String customName,

			@DecimalMin(value = "0.01", message = "사용량은 0보다 커야 해요.")
			@DecimalMax(value = "100000", message = "사용량이 너무 커요.")
			BigDecimal quantity,

			@Size(max = 30, message = "표시용 분량은 30자 이하로 적어 주세요.")
			String displayAmount) {

		public boolean isCustom() {
			return ingredientId == null;
		}
	}

	public record Step(
			@NotBlank(message = "조리 순서 설명을 적어 주세요.")
			@Size(max = 500, message = "조리 순서는 500자 이하로 적어 주세요.")
			String content,

			@Size(max = 500)
			String image) {
	}
}
