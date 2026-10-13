package com.pseyeong.hankki.storage;

import java.io.IOException;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.pseyeong.hankki.common.web.ApiException;
import com.pseyeong.hankki.member.LoginUser;

/**
 * 레시피 사진 업로드. 로그인한 회원만 올릴 수 있다 (SecurityConfig).
 * 브라우저가 올리기 전에 용량을 줄여서 보내지만, 서버도 종류와 크기를 다시 검사한다.
 */
@RestController
@RequestMapping("/api/uploads")
public class ImageUploadController {

	private static final long MAX_BYTES = 3L * 1024 * 1024;

	private final SupabaseStorage storage;

	public ImageUploadController(SupabaseStorage storage) {
		this.storage = storage;
	}

	@PostMapping("/images")
	public Map<String, String> upload(@RequestParam("file") MultipartFile file, @AuthenticationPrincipal LoginUser user)
			throws IOException {
		if (file.isEmpty()) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "사진을 선택해 주세요.");
		}
		if (file.getSize() > MAX_BYTES) {
			throw new ApiException(HttpStatus.PAYLOAD_TOO_LARGE, "사진 용량이 너무 커요. (최대 3MB)");
		}
		byte[] data = file.getBytes();
		ImageType type = ImageType.sniff(data)
				.orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "JPG, PNG, WEBP 사진만 올릴 수 있어요."));
		String url = storage.upload(user.id(), data, type.contentType(), type.extension());
		return Map.of("url", url);
	}

	/** 파일 이름·Content-Type 이 아니라 실제 파일 내용(앞부분 바이트)으로 종류를 판단한다. */
	enum ImageType {
		JPEG("image/jpeg", "jpg"),
		PNG("image/png", "png"),
		WEBP("image/webp", "webp");

		private final String contentType;
		private final String extension;

		ImageType(String contentType, String extension) {
			this.contentType = contentType;
			this.extension = extension;
		}

		String contentType() {
			return contentType;
		}

		String extension() {
			return extension;
		}

		static Optional<ImageType> sniff(byte[] d) {
			if (d.length >= 3 && (d[0] & 0xFF) == 0xFF && (d[1] & 0xFF) == 0xD8 && (d[2] & 0xFF) == 0xFF) {
				return Optional.of(JPEG);
			}
			if (d.length >= 8 && (d[0] & 0xFF) == 0x89 && d[1] == 'P' && d[2] == 'N' && d[3] == 'G') {
				return Optional.of(PNG);
			}
			if (d.length >= 12 && d[0] == 'R' && d[1] == 'I' && d[2] == 'F' && d[3] == 'F'
					&& d[8] == 'W' && d[9] == 'E' && d[10] == 'B' && d[11] == 'P') {
				return Optional.of(WEBP);
			}
			return Optional.empty();
		}
	}
}
