package com.pseyeong.store.web;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class StorePageController {

    private final String kakaoMapKey;

    public StorePageController(@Value("${kakao.map.key}") String kakaoMapKey) {
        this.kakaoMapKey = kakaoMapKey;
    }

    @GetMapping("/store")
    public String index(Model model) {
        model.addAttribute("kakaoMapKey", kakaoMapKey);
        return "store/index";
    }
}
