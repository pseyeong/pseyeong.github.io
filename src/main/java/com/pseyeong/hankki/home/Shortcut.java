package com.pseyeong.hankki.home;

/**
 * 홈 바로가기 8개 (가격대·시간·도구).
 * tone 은 아이콘 바탕·선 색 클래스.
 * TODO(4단계): href 를 /recipes 필터 주소로 연결한다.
 */
public enum Shortcut {

	UNDER_3000("3천원 이하", Icons.COIN, "bg-primary text-on-primary"),
	UNDER_5000("5천원 이하", Icons.COIN, "bg-primary-soft text-ink"),
	THREE_MEALS("만원 3끼", "M5 8h14l-1.5 11h-11zM9 8V6a3 3 0 0 1 6 0v2", "bg-primary-soft text-ink"),
	TEN_MINUTES("10분 요리", "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8v4l3 2", "bg-primary-soft text-ink"),
	MICROWAVE("전자레인지", "M3 6h18v12H3zM15 6v12M18 10v.01M18 14v.01", "bg-page text-ink"),
	AIR_FRYER("에어프라이어", "M7 4h10a1 1 0 0 1 1 1v15H6V5a1 1 0 0 1 1-1zM9 14h6M12 8v.01", "bg-page text-ink"),
	PAN("프라이팬", "M3 11h11a5.5 5.5 0 0 1-11 0zM14 11h7", "bg-page text-ink"),
	POT("냄비", "M5 10h14v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2zM3 10h18M9 6h6", "bg-page text-ink");

	private final String label;
	private final String icon;
	private final String tone;

	Shortcut(String label, String icon, String tone) {
		this.label = label;
		this.icon = icon;
		this.tone = tone;
	}

	public String getLabel() {
		return label;
	}

	public String getIcon() {
		return icon;
	}

	public String getTone() {
		return tone;
	}

	public String getHref() {
		return "/recipes";
	}

	private static final class Icons {
		static final String COIN = "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM8.5 9l1.5 6 2-5 2 5 1.5-6";
	}
}
