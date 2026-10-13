package com.pseyeong.hankki.storage;

import java.net.URI;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.pseyeong.hankki.common.web.ApiException;

/**
 * 레시피 사진을 Supabase Storage 에 올리고 지운다.
 * - 서버가 서버용 키(service_role / secret key)로 올린다. 이 키는 브라우저에 절대 내려가지 않는다.
 * - 올라간 파일은 공개 버킷이라 누구나 주소로 볼 수 있고, DB 에는 그 공개 주소만 저장한다.
 * - 경로: recipes/{올린 회원 id}/{파일 id}.{jpg|png|webp}
 */
@Component
public class SupabaseStorage {

	private static final Logger log = LoggerFactory.getLogger(SupabaseStorage.class);

	/** 우리가 올린 파일의 버킷 안 경로. 이 모양이 아니면 우리 사진이 아니다. */
	private static final Pattern OBJECT_PATH = Pattern.compile(
			"^recipes/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/[0-9a-f-]{36}\\.(jpg|png|webp)$");

	private final String baseUrl;
	private final String serviceKey;
	private final String bucket;
	private final RestClient restClient = RestClient.create();

	public SupabaseStorage(
			@Value("${app.storage.url:}") String baseUrl,
			@Value("${app.storage.service-key:}") String serviceKey,
			@Value("${app.storage.bucket:recipe-images}") String bucket) {
		this.baseUrl = baseUrl.trim().replaceAll("/+$", "");
		this.serviceKey = serviceKey.trim();
		this.bucket = bucket.trim();
	}

	public boolean isConfigured() {
		return !baseUrl.isBlank() && !serviceKey.isBlank();
	}

	/** @return 누구나 볼 수 있는 공개 주소 */
	public String upload(UUID userId, byte[] data, String contentType, String extension) {
		if (!isConfigured()) {
			throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "사진 저장소가 아직 설정되지 않았어요.");
		}
		String path = "recipes/" + userId + "/" + UUID.randomUUID() + "." + extension;
		try {
			restClient.post()
					.uri(URI.create(baseUrl + "/storage/v1/object/" + bucket + "/" + path))
					.headers(this::authorize)
					.header(HttpHeaders.CONTENT_TYPE, contentType)
					.header("x-upsert", "false")
					.body(data)
					.retrieve()
					.toBodilessEntity();
		}
		catch (RuntimeException e) {
			log.error("사진 업로드 실패: {}", e.getMessage());
			throw new ApiException(HttpStatus.BAD_GATEWAY, "사진을 올리지 못했어요. 잠시 후 다시 시도해 주세요.");
		}
		return publicPrefix() + path;
	}

	/** 우리 저장소의 사진 주소면 그 사진을 올린 회원 id(폴더 이름). 아니면 비어 있다. */
	public Optional<UUID> ownerOf(String url) {
		if (url == null || !isConfigured() || !url.startsWith(publicPrefix())) {
			return Optional.empty();
		}
		Matcher matcher = OBJECT_PATH.matcher(url.substring(publicPrefix().length()));
		return matcher.matches() ? Optional.of(UUID.fromString(matcher.group(1))) : Optional.empty();
	}

	/** 사진 삭제. 실패해도 작업을 막지 않는다 (고아 파일이 남을 뿐). */
	public void deleteQuietly(String url) {
		if (ownerOf(url).isEmpty()) {
			return;
		}
		String path = url.substring(publicPrefix().length());
		try {
			restClient.delete()
					.uri(URI.create(baseUrl + "/storage/v1/object/" + bucket + "/" + path))
					.headers(this::authorize)
					.retrieve()
					.toBodilessEntity();
		}
		catch (RuntimeException e) {
			log.warn("사진 삭제 실패(무시): {}", e.getMessage());
		}
	}

	private String publicPrefix() {
		return baseUrl + "/storage/v1/object/public/" + bucket + "/";
	}

	/** 새 형식 키(sb_secret_...)는 JWT 가 아니라 apikey 헤더로만, 예전 JWT 형식 키는 Authorization 에도 보낸다. */
	private void authorize(HttpHeaders headers) {
		headers.set("apikey", serviceKey);
		if (!serviceKey.startsWith("sb_")) {
			headers.setBearerAuth(serviceKey);
		}
	}
}
