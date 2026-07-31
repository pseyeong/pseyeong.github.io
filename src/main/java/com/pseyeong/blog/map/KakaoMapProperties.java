package com.pseyeong.blog.map;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "kakao.map")
public record KakaoMapProperties(String jsKey, String restApiKey) {
}
