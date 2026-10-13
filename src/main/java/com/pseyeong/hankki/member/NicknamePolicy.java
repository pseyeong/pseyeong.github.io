package com.pseyeong.hankki.member;

import java.util.List;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;

/**
 * 닉네임 규칙 (docs/PLAN.md 4-5): 2~12자, 한글·영문·숫자만, 공백·특수문자 불가.
 * 금칙어(욕설, 운영 사칭)는 여기서 거른다. 중복(대소문자 무시)은 DB 고유 제약이 최종으로 막는다.
 * 화면의 입력 검사와 저장 요청 모두 이 규칙을 쓴다.
 */
@Component
public class NicknamePolicy {

	public static final int MIN_LENGTH = 2;
	public static final int MAX_LENGTH = 12;
	/** 변경 후 이 기간 동안은 다시 바꿀 수 없다 */
	public static final int COOLDOWN_DAYS = 30;

	private static final Pattern FORMAT = Pattern.compile("^[가-힣a-zA-Z0-9]+$");

	/** 욕설·음란 표현. 필요하면 추가한다. */
	private static final List<String> BANNED_WORDS = List.of(
			"시발", "씨발", "씨팔", "씨빨", "병신", "븅신", "지랄", "좆", "개새끼", "개새", "니미", "느금",
			"앰창", "애미", "애비", "존나", "미친놈", "미친년", "걸레", "창녀", "보지", "자지",
			"야동", "포르노", "섹스", "성인물", "음란", "야설", "자위", "정액", "성매매", "몰카",
			"fuck", "shit", "bitch", "asshole", "bastard", "porn", "pussy");

	/** 운영자·공식 계정으로 오해하게 만드는 표현 */
	private static final List<String> RESERVED_WORDS = List.of(
			"관리자", "운영자", "운영진", "운영팀", "공식", "고객센터", "자취한끼",
			"admin", "administrator", "manager", "staff", "system", "hankki");

	/** 규칙에 어긋나면 사용자에게 보여줄 문장, 괜찮으면 null */
	public String formatError(String value) {
		if (value == null || value.length() < MIN_LENGTH) {
			return "2자 이상 입력해 주세요";
		}
		if (value.length() > MAX_LENGTH) {
			return "12자 이하로 입력해 주세요";
		}
		if (!FORMAT.matcher(value).matches()) {
			return "한글·영문·숫자만 쓸 수 있어요";
		}
		String lower = value.toLowerCase();
		if (BANNED_WORDS.stream().anyMatch(lower::contains)) {
			return "사용할 수 없는 표현이 들어 있어요";
		}
		if (RESERVED_WORDS.stream().anyMatch(lower::contains)) {
			return "운영과 헷갈릴 수 있는 닉네임은 쓸 수 없어요";
		}
		return null;
	}
}
