package com.pseyeong.blog.map;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class MapController {

    private final KakaoMapProperties properties;

    public MapController(KakaoMapProperties properties) {
        this.properties = properties;
    }

    @GetMapping("/map")
    public String map(Model model) {
        model.addAttribute("kakaoJsKey", properties.jsKey());
        return "map";
    }
}
