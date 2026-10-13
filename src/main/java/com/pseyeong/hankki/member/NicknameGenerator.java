package com.pseyeong.hankki.member;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

import org.springframework.stereotype.Component;

/**
 * 랜덤 닉네임: "형용사 + 음식 + 숫자 4자리" (예: 배고픈감자4821)
 * 닉네임 규칙(2~12자)을 넘지 않도록 형용사·음식은 각각 4자 이하로 둔다. (4 + 4 + 숫자 4 = 최대 12자)
 */
@Component
public class NicknameGenerator {

	private static final List<String> ADJECTIVES = List.of(
			"배고픈", "졸린", "행복한", "느긋한", "바쁜", "든든한", "알뜰한", "부지런한", "수줍은", "씩씩한",
			"따뜻한", "달콤한", "고소한", "매콤한", "상큼한", "쫄깃한", "바삭한", "촉촉한", "새콤한", "짭짤한",
			"느린", "빠른", "작은", "큰", "귀여운", "용감한", "차분한", "엉뚱한", "다정한", "활발한");

	private static final List<String> FOODS = List.of(
			"감자", "두부", "계란", "대파", "양파", "당근", "마늘", "김치", "라면", "어묵",
			"참치", "햄", "치즈", "떡볶이", "김밥", "만두", "토마토", "고구마", "옥수수", "버섯",
			"애호박", "콩나물", "브로콜리", "단무지", "식빵", "우동", "볶음밥", "순두부", "멸치", "깍두기");

	/**
	 * 마이페이지 동그라미에 넣는 글자. 닉네임 끝 숫자를 뗀 뒤 음식 이름으로 끝나면 그 음식("감자"),
	 * 아니면(직접 바꾼 닉네임) 앞 두 글자.
	 */
	public static String avatarLabel(String nickname) {
		String base = nickname.replaceAll("\\d+$", "");
		return FOODS.stream()
				.filter(base::endsWith)
				.max(java.util.Comparator.comparingInt(String::length))
				.orElse(nickname.substring(0, Math.min(2, nickname.length())));
	}

	public String generate() {
		ThreadLocalRandom random = ThreadLocalRandom.current();
		return ADJECTIVES.get(random.nextInt(ADJECTIVES.size()))
				+ FOODS.get(random.nextInt(FOODS.size()))
				+ String.format("%04d", random.nextInt(10_000));
	}
}
