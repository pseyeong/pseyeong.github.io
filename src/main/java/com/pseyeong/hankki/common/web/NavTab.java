package com.pseyeong.hankki.common.web;

/**
 * 모바일 하단 탭 (홈·검색·작성·마이). 아이콘은 SVG path 데이터.
 */
public enum NavTab {

	HOME("홈", "/", "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"),
	SEARCH("검색", "/search", "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3"),
	WRITE("작성", "/recipes/new", "M12 5v14M5 12h14"),
	MY("마이", "/my", "M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 21c0-4 4-6 8-6s8 2 8 6");

	private final String label;
	private final String href;
	private final String icon;

	NavTab(String label, String href, String icon) {
		this.label = label;
		this.href = href;
		this.icon = icon;
	}

	public String getLabel() {
		return label;
	}

	public String getHref() {
		return href;
	}

	public String getIcon() {
		return icon;
	}

	/** 현재 경로가 이 탭에 속하는지 (홈은 정확히 "/" 일 때만) */
	public boolean isActive(String path) {
		if (path == null) {
			return false;
		}
		if (this == HOME) {
			return path.equals("/");
		}
		return path.equals(href) || path.startsWith(href + "/");
	}
}
