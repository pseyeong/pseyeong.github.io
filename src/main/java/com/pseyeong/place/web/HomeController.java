package com.pseyeong.place.web;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    private final String kakaoMapKey;

    public HomeController(@Value("${kakao.map.key}") String kakaoMapKey) {
        this.kakaoMapKey = kakaoMapKey;
    }

    @GetMapping("/")
    public String index(Model model) {
        // TODO: 실제 데이터 연동 시 서비스/리포지토리로 교체. 지금은 화면 확인용 샘플.
        model.addAttribute("kakaoMapKey", kakaoMapKey);
        model.addAttribute("categories", List.of("전체", "카페", "맛집", "공원", "전시", "쇼핑"));
        model.addAttribute("places", List.of(
                new PlaceView(1L, "온기 커피 로스터스", "카페", "서울 성동구 성수이로 12", "4.7", "124"),
                new PlaceView(2L, "한강 노을 공원", "공원", "서울 영등포구 여의동로 330", "4.5", "98"),
                new PlaceView(3L, "다온 칼국수", "맛집", "서울 마포구 월드컵로 45", "4.6", "210"),
                new PlaceView(4L, "빛의 갤러리", "전시", "서울 종로구 사직로 8", "4.4", "67"),
                new PlaceView(5L, "모아 편집숍", "쇼핑", "서울 용산구 이태원로 27", "4.3", "41")));
        return "index";
    }

    public record PlaceView(Long id, String name, String category, String address, String rating, String reviews) {
    }
}
