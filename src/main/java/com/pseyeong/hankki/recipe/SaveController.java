package com.pseyeong.hankki.recipe;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

import com.pseyeong.hankki.member.LoginUser;

/**
 * 저장·저장 취소. 로그인이 필요하다 (SecurityConfig). 처리 후 상세 화면으로 돌아가서
 * 새로고침해도 상태가 유지되고 폼이 다시 제출되지 않는다.
 */
@Controller
public class SaveController {

	private final SaveRepository saveRepository;

	public SaveController(SaveRepository saveRepository) {
		this.saveRepository = saveRepository;
	}

	@PostMapping("/recipes/{id:\\d+}/save")
	public String save(@PathVariable long id, @AuthenticationPrincipal LoginUser user) {
		saveRepository.save(user.id(), id);
		return "redirect:/recipes/" + id;
	}

	@PostMapping("/recipes/{id:\\d+}/unsave")
	public String unsave(@PathVariable long id, @AuthenticationPrincipal LoginUser user) {
		saveRepository.unsave(user.id(), id);
		return "redirect:/recipes/" + id;
	}
}
