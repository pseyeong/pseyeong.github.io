package com.pseyeong.hankki.recipe;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.pseyeong.hankki.recipe.RecipeRepository.IngredientRow;

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

			List<RecipeDetail.Line> ingredients = new ArrayList<>();
			List<RecipeDetail.Line> customIngredients = new ArrayList<>();
			List<String> seasonings = new ArrayList<>();
			BigDecimal shopping = BigDecimal.ZERO;
			LocalDate priceDate = null;

			for (IngredientRow row : rows) {
				if (row.name() == null) {
					customIngredients.add(new RecipeDetail.Line(
							row.customName(), row.displayAmount() == null ? "" : row.displayAmount(), null));
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
				ingredients.add(new RecipeDetail.Line(
						row.name(), amountLabel(row.displayAmount(), row.quantity(), row.unit()), cost));
			}

			return new RecipeDetail(
					recipe.id(), recipe.title(), recipe.description(), recipe.coverImage(),
					recipe.servings(), recipe.cookMinutes(), recipe.tool(),
					recipe.pricePerServing(), recipe.partialPrice(), recipe.authorNickname(),
					priceDate,
					shopping.setScale(0, RoundingMode.HALF_UP).intValue(),
					ingredients, customIngredients, seasonings,
					repository.findSteps(id));
		});
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
