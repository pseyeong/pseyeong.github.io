package com.pseyeong.hankki.common.web;

import java.util.Map;

import org.springframework.http.HttpStatus;

/** API(JSON) 요청의 오류. message 는 사용자에게 그대로 보여줘도 되는 문장이다. */
public class ApiException extends RuntimeException {

	private final HttpStatus status;
	private final Map<String, String> fields;

	public ApiException(HttpStatus status, String message) {
		this(status, message, Map.of());
	}

	/** @param fields 입력 항목별 오류 (예: "title" → "제목을 입력해 주세요.") */
	public ApiException(HttpStatus status, String message, Map<String, String> fields) {
		super(message);
		this.status = status;
		this.fields = fields;
	}

	public HttpStatus status() {
		return status;
	}

	public Map<String, String> fields() {
		return fields;
	}
}
