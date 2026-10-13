package com.pseyeong.hankki.recipe;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.pseyeong.hankki.recipe.RecipeRepository.IngredientRow;
import com.pseyeong.hankki.recipe.RecipeRepository.SubstituteRow;

@Service
public class RecipeService {

	private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");

	private final RecipeRepository repository;

	public RecipeService(RecipeRepository repository) {
		this.repository = repository;
	}

	public List<RecipeSummary> search(RecipeFilter filter) {
		return repository.search(filter, null);
	}

	/** 재료별 모음: 이 재료를 쓰는 공개 레시피 */
	public List<RecipeSummary> findByIngredient(long ingredientId, RecipeSort sort) {
		return repository.search(RecipeFilter.none(sort), null, ingredientId);
	}

	/** 홈 "지금 인기 있는 레시피" (저장 많은 순) */
	public List<RecipeSummary> findPopular(int limit) {
		return repository.search(RecipeFilter.none(RecipeSort.POPULAR), limit);
	}

	/** 홈 "방금 올라온 레시피" */
	public List<RecipeSummary> findLatest(int limit) {
		return repository.search(RecipeFilter.none(RecipeSort.LATEST), limit);
	}

	/** 공개 레시피 상세. 없거나 숨김이면 빈 값 */
	public Optional<RecipeDetail> findDetail(long id) {
		return repository.findPublicById(id).map(recipe -> {
			List<IngredientRow> rows = repository.findIngredients(id);
			Map<Long, List<SubstituteRow>> substitutesByIngredient = repository
					.findSubstitutes(rows.stream().filter(r -> r.ingredientId() != null && !r.basic())
							.map(IngredientRow::ingredientId).toList())
					.stream().collect(Collectors.groupingBy(SubstituteRow::ingredientId));

			List<RecipeDetail.Line> ingredients = new ArrayList<>();
			List<RecipeDetail.Line> customIngredients = new ArrayList<>();
			List<String> seasonings = new ArrayList<>();
			BigDecimal shopping = BigDecimal.ZERO;
			LocalDate priceDate = null;

			for (IngredientRow row : rows) {
				if (row.name() == null) {
					customIngredients.add(new RecipeDetail.Line(
							null, row.customName(), row.displayAmount() == null ? "" : row.displayAmount(), null, List.of()));
					continue;
				}
				if (row.priceUpdatedAt() != null) {
					LocalDate date = row.priceUpdatedAt().atZoneSameInstant(SEOUL).toLocalDate();
					if (priceDate == null || date.isAfter(priceDate)) {
						priceDate = date;
					}
				}
				if (row.basic()) {
					seasonings.add(row.name());
					continue;
				}
				Integer cost = null;
				if (row.quantity() != null) {
					cost = row.quantity().multiply(row.unitPrice()).setScale(0, RoundingMode.HALF_UP).intValue();
					shopping = shopping.add(shoppingCost(row));
				}
				List<RecipeDetail.Substitute> substitutes = substitutesByIngredient
						.getOrDefault(row.ingredientId(), List.of()).stream()
						.map(s -> toSubstitute(row, s)).toList();
				ingredients.add(new RecipeDetail.Line(
						row.ingredientId(), row.name(), amountLabel(row.displayAmount(), row.quantity(), row.unit()), cost,
						substitutes));
			}

			return new RecipeDetail(
					recipe.id(), recipe.authorId(), recipe.title(), recipe.description(), recipe.coverImage(),
					recipe.servings(), recipe.cookMinutes(), recipe.tool(),
					recipe.pricePerServing(), recipe.partialPrice(), recipe.authorNickname(),
					priceDate,
					shopping.setScale(0, RoundingMode.HALF_UP).intValue(),
					ingredients, customIngredients, seasonings,
					repository.findSteps(id));
		});
	}

	/**
	 * 대체 재료 한 건. 차액은 이 레시피의 사용량 기준이다:
	 * 대체 재료 사용량 = 원래 사용량 × 비율, 차액 = 대체 재료 금액 - 원래 재료 금액
	 */
	private static RecipeDetail.Substitute toSubstitute(IngredientRow original, SubstituteRow sub) {
		String ratio = original.name() + " 1 : " + sub.name() + " " + plain(sub.ratio());
		Integer delta = null;
		if (original.quantity() != null) {
			BigDecimal amount = original.quantity().multiply(sub.ratio());
			BigDecimal diff = amount.multiply(sub.unitPrice()).subtract(original.quantity().multiply(original.unitPrice()));
			delta = diff.setScale(0, RoundingMode.HALF_UP).intValue();
			ratio += " → " + plain(amount.setScale(1, RoundingMode.HALF_UP)) + sub.unit();
		}
		return new RecipeDetail.Substitute(sub.name(), sub.tag(), delta, ratio, sub.note());
	}

	private static String plain(BigDecimal value) {
		return value.stripTrailingZeros().toPlainString();
	}

	/** 장볼 때 비용: 한 포장 단위로 올림해서 산다. 포장 크기가 없으면 사용량만큼만 산다. */
	private static BigDecimal shoppingCost(IngredientRow row) {
		BigDecimal pack = row.packSize() != null && row.packSize().signum() > 0 ? row.packSize() : row.quantity();
		BigDecimal packs = row.quantity().divide(pack, 0, RoundingMode.CEILING);
		return packs.multiply(pack).multiply(row.unitPrice());
	}

	/** "1/3대 (20g)", "2개", "1공기". 개 단위는 표시용 분량만 보여준다. */
	static String amountLabel(String display, BigDecimal quantity, String unit) {
		String exact = quantity == null ? null : quantity.stripTrailingZeros().toPlainString() + unit;
		if (display == null || display.isBlank()) {
			return exact == null ? "" : exact;
		}
		if (exact == null || "개".equals(unit)) {
			return display;
		}
		return display + " (" + exact + ")";
	}
}
