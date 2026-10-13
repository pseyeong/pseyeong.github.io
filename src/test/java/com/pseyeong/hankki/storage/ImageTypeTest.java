package com.pseyeong.hankki.storage;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.charset.StandardCharsets;
import java.util.Optional;

import org.junit.jupiter.api.Test;

import com.pseyeong.hankki.storage.ImageUploadController.ImageType;

class ImageTypeTest {

	@Test
	void 파일_앞부분으로_사진_종류를_판단한다() {
		assertEquals(Optional.of(ImageType.JPEG), ImageType.sniff(new byte[] {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0}));
		assertEquals(Optional.of(ImageType.PNG),
				ImageType.sniff(new byte[] {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A}));
		assertEquals(Optional.of(ImageType.WEBP),
				ImageType.sniff("RIFF....WEBPVP8 ".getBytes(StandardCharsets.US_ASCII)));
	}

	@Test
	void 사진이_아닌_파일은_거부한다() {
		assertTrue(ImageType.sniff("<script>alert(1)</script>".getBytes(StandardCharsets.UTF_8)).isEmpty());
		assertTrue(ImageType.sniff("GIF89a......".getBytes(StandardCharsets.US_ASCII)).isEmpty());
		assertTrue(ImageType.sniff(new byte[0]).isEmpty());
		assertTrue(ImageType.sniff(new byte[] {(byte) 0xFF, (byte) 0xD8}).isEmpty());
	}
}
