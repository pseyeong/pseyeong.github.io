package com.pseyeong.hankki.member;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/** 마이페이지와 설정. 모두 로그인이 필요하다 (SecurityConfig). */
@Controller
public class MyController {

	private final MyPageRepository myPageRepository;
	private final MemberService memberService;

	public MyController(MyPageRepository myPageRepository, MemberService memberService) {
		this.myPageRepository = myPageRepository;
		this.memberService = memberService;
	}

	/** /my 는 저장한 레시피 탭을 보여준다 */
	@GetMapping("/my")
	public String my() {
		return "redirect:/my/saved";
	}

	@GetMapping("/my/saved")
	public String saved(@AuthenticationPrincipal LoginUser user, Model model) {
		return list(user, model, "saved");
	}

	@GetMapping("/my/recipes")
	public String written(@AuthenticationPrincipal LoginUser user, Model model) {
		return list(user, model, "mine");
	}

	private String list(LoginUser user, Model model, String tab) {
		var saved = myPageRepository.findSaved(user.id());
		var written = myPageRepository.findWritten(user.id());
		model.addAttribute("tab", tab);
		model.addAttribute("avatar", NicknameGenerator.avatarLabel(user.nickname()));
		model.addAttribute("savedCount", saved.size());
		model.addAttribute("writtenCount", written.size());
		model.addAttribute("items", "saved".equals(tab) ? saved : written);
		return "my/index";
	}

	@GetMapping("/my/settings")
	public String settings(@AuthenticationPrincipal LoginUser user, Model model) {
		model.addAttribute("lockDays", memberService.nicknameLockDaysLeft(user.id()));
		model.addAttribute("hideTab", true);
		return "my/settings";
	}

	/** 회원 탈퇴: 쓴 레시피는 남기고 작성자만 비운다. 끝나면 로그아웃 상태로 홈으로 보낸다. */
	@PostMapping("/my/withdraw")
	public String withdraw(@AuthenticationPrincipal LoginUser user, Authentication authentication,
			HttpServletRequest request, HttpServletResponse response) {
		memberService.withdraw(user.id());
		new SecurityContextLogoutHandler().logout(request, response, authentication);
		return "redirect:/";
	}
}
