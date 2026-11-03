package com.pseyeong.common.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

// 루트(/)는 기존 서비스인 store 로 넘긴다. 예전 주소로 들어오는 사람과 UptimeRobot 이 그대로 동작하게.
@Controller
public class RootController {

    @GetMapping("/")
    public String root() {
        return "redirect:/store";
    }
}
