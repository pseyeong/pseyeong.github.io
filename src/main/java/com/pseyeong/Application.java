package com.pseyeong;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

// 앱 하나에 프로젝트 여러 개를 패키지로 나눠 둔다.
// - com.pseyeong.store : 이 자리, 몇 번째 가게? (/store)
// - com.pseyeong.nail  : 네일 리스트 (/nail)
// - com.pseyeong.common: 둘이 같이 쓰는 것만. store 와 nail 은 서로 import 하지 않는다.
@SpringBootApplication
@EnableScheduling
public class Application {

	public static void main(String[] args) {
		SpringApplication.run(Application.class, args);
	}

}
