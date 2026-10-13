package com.pseyeong.hankki.common.web;

import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

/**
 * JSON API 의 오류를 {"message": "...", "fields": {...}} 형태로 돌려준다.
 * 예상하지 못한 오류만 500 으로 바꾸고, 요청 형식 오류·권한 오류는 Spring 기본 처리에 맡긴다.
 */
@RestControllerAdvice(annotations = RestController.class)
public class ApiExceptionHandler {

	private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

	@ExceptionHandler(ApiException.class)
	public ResponseEntity<Map<String, Object>> handleApi(ApiException e) {
		return ResponseEntity.status(e.status()).body(body(e.getMessage(), e.fields()));
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException e) {
		Map<String, String> fields = new LinkedHashMap<>();
		for (FieldError error : e.getBindingResult().getFieldErrors()) {
			fields.putIfAbsent(error.getField(), error.getDefaultMessage());
		}
		return ResponseEntity.badRequest().body(body("입력값을 확인해 주세요.", fields));
	}

	@ExceptionHandler(MaxUploadSizeExceededException.class)
	public ResponseEntity<Map<String, Object>> handleTooLarge(MaxUploadSizeExceededException e) {
		return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(body("사진 용량이 너무 커요.", Map.of()));
	}

	@ExceptionHandler(org.springframework.dao.DataAccessException.class)
	public ResponseEntity<Map<String, Object>> handleDatabase(org.springframework.dao.DataAccessException e) {
		log.error("DB 처리 중 오류", e);
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(body("처리하지 못했어요. 잠시 후 다시 시도해 주세요.", Map.of()));
	}

	private static Map<String, Object> body(String message, Map<String, String> fields) {
		Map<String, Object> body = new LinkedHashMap<>();
		body.put("message", message);
		body.put("fields", fields);
		return body;
	}
}
