package com.pseyeong.hankki.recipe;

import java.util.List;

import org.springframework.web.util.UriComponentsBuilder;

/**
 * 레시피 목록 필터. 상태는 주소(쿼리)에 담긴다: /recipes?price=3000&time=10&tool=냄비&sort=latest
 * 허용 목록에 없는 값은 무시한다.
 *
 * @param price 1인분 단가 상한(원)
 * @param time 조리시간 상한(분)
 * @param tool 조리도구
 */
public record RecipeFilter(Integer price, Integer time, String tool, RecipeSort sort) {

	public static final List<Integer> PRICES = List.of(3000, 5000, 10000);
	public static final List<Integer> TIMES = List.of(10, 20, 30);
	public static final List<String> TOOLS = List.of("전자레인지", "에어프라이어", "프라이팬", "냄비");

	public record Chip(String label, String href, boolean active) {
	}

	public record Group(String label, List<Chip> chips) {
	}

	public record SortOption(String label, String href, boolean selected) {
	}

	public static RecipeFilter of(String price, String time, String tool, String sort) {
		Integer p = parseInt(price);
		Integer t = parseInt(time);
		return new RecipeFilter(
				p != null && PRICES.contains(p) ? p : null,
				t != null && TIMES.contains(t) ? t : null,
				tool != null && TOOLS.contains(tool) ? tool : null,
				RecipeSort.from(sort));
	}

	/** 필터를 하나도 걸지 않은 목록 */
	public static RecipeFilter none(RecipeSort sort) {
		return new RecipeFilter(null, null, null, sort);
	}

	/** 화면에 보여줄 필터 칩 묶음. 선택된 칩을 다시 누르면 해제된다. */
	public List<Group> groups() {
		return List.of(
				new Group("가격", PRICES.stream()
						.map(p -> new Chip(priceLabel(p), href(p.equals(price) ? null : p, time, tool, sort), p.equals(price)))
						.toList()),
				new Group("시간", TIMES.stream()
						.map(t -> new Chip(t + "분 이내", href(price, t.equals(time) ? null : t, tool, sort), t.equals(time)))
						.toList()),
				new Group("도구", TOOLS.stream()
						.map(t -> new Chip(t, href(price, time, t.equals(tool) ? null : t, sort), t.equals(tool)))
						.toList()));
	}

	public List<SortOption> sortOptions() {
		return java.util.Arrays.stream(RecipeSort.values())
				.map(s -> new SortOption(s.label(), href(price, time, tool, s), s == sort))
				.toList();
	}

	private static String href(Integer price, Integer time, String tool, RecipeSort sort) {
		UriComponentsBuilder builder = UriComponentsBuilder.fromPath("/recipes");
		if (price != null) {
			builder.queryParam("price", price);
		}
		if (time != null) {
			builder.queryParam("time", time);
		}
		if (tool != null) {
			builder.queryParam("tool", tool);
		}
		if (sort != RecipeSort.PRICE) {
			builder.queryParam("sort", sort.code());
		}
		return builder.build().encode().toUriString();
	}

	private static String priceLabel(int price) {
		return price >= 10000 ? (price / 10000) + "만원 이하" : (price / 1000) + "천원 이하";
	}

	private static Integer parseInt(String value) {
		if (value == null) {
			return null;
		}
		try {
			return Integer.valueOf(value.trim());
		}
		catch (NumberFormatException e) {
			return null;
		}
	}
}
