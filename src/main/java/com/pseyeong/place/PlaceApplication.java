package com.pseyeong.place;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling

public class PlaceApplication {

	public static void main(String[] args) {
		SpringApplication.run(PlaceApplication.class, args);
	}

}
