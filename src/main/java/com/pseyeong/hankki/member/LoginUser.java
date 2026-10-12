package com.pseyeong.hankki.member;

import java.io.Serializable;
import java.util.UUID;

/**
 * 로그인한 회원 (세션에 담기는 값). 소셜 계정의 실명·프로필 사진·이메일은 들어 있지 않다.
 * 컨트롤러에서는 {@code @AuthenticationPrincipal LoginUser user} 로 받는다. 비로그인이면 null.
 */
public record LoginUser(UUID id, String nickname, String role) implements Serializable {

	public boolean isAdmin() {
		return "admin".equals(role);
	}
}
