package com.pseyeong.blog.map;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class GeocodeController {

    private final KakaoGeocodingService geocodingService;

    public GeocodeController(KakaoGeocodingService geocodingService) {
        this.geocodingService = geocodingService;
    }

    @GetMapping(value = "/api/geocode", produces = MediaType.APPLICATION_JSON_VALUE)
    public String geocode(@RequestParam String query) {
        return geocodingService.geocode(query);
    }
}
