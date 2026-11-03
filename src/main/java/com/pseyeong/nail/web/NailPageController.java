package com.pseyeong.nail.web;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

// 네일 리스트. store 패키지는 import 하지 않는다 (같이 쓸 것은 common 으로).
@Controller
public class NailPageController {

    private final String kakaoMapKey;

    public NailPageController(@Value("${kakao.map.key}") String kakaoMapKey) {
        this.kakaoMapKey = kakaoMapKey;
    }

    @GetMapping("/nail")
    public String index(Model model) {
        model.addAttribute("kakaoMapKey", kakaoMapKey);
        return "nail/index";
    }
}
