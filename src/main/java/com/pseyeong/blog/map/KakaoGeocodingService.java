package com.pseyeong.blog.map;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class KakaoGeocodingService {

    private final RestClient restClient;
    private final KakaoMapProperties properties;

    public KakaoGeocodingService(KakaoMapProperties properties) {
        this.properties = properties;
        this.restClient = RestClient.builder()
                .baseUrl("https://dapi.kakao.com/v2/local")
                .build();
    }

    public String geocode(String query) {
        return restClient.get()
                .uri(uriBuilder -> uriBuilder.path("/search/address.json").queryParam("query", query).build())
                .header("Authorization", "KakaoAK " + properties.restApiKey())
                .retrieve()
                .body(String.class);
    }
}
