package com.pseyeong.hankki.member;

import java.util.Map;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pseyeong.hankki.auth.LoginSession;
import com.pseyeong.hankki.member.MemberService.NicknameCheck;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/** 닉네임 입력 검사, 랜덤 뽑기, 변경. 로그인이 필요하다 (SecurityConfig). */
@RestController
@RequestMapping("/api/me/nickname")
public class NicknameApiController {

	public record ChangeRequest(String nickname) {
	}

	private final MemberService memberService;
	private final LoginSession loginSession;

	public NicknameApiController(MemberService memberService, LoginSession loginSession) {
		this.memberService = memberService;
		this.loginSession = loginSession;
	}

	/** 입력하는 동안 규칙·금칙어·중복을 바로 알려준다 */
	@GetMapping("/check")
	public NicknameCheck check(@RequestParam(defaultValue = "") String value, @AuthenticationPrincipal LoginUser user) {
		return memberService.checkNickname(user, value);
	}

	@GetMapping("/random")
	public Map<String, String> random(@AuthenticationPrincipal LoginUser user) {
		return Map.of("nickname", memberService.randomAvailableNickname(user.id()));
	}

	/** 저장. 서버가 모든 규칙을 다시 검사하고, 마지막으로 DB 고유 제약이 중복을 막는다. */
	@PutMapping
	public Map<String, String> change(@RequestBody ChangeRequest request, @AuthenticationPrincipal LoginUser user,
			HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
		LoginUser changed = memberService.changeNickname(user, request.nickname() == null ? "" : request.nickname());
		loginSession.establish(httpRequest, httpResponse, changed); // 세션의 닉네임도 새 값으로
		return Map.of("nickname", changed.nickname());
	}
}
