package com.pseyeong.hankki.member;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.UUID;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pseyeong.hankki.common.web.ApiException;

@Service
public class MemberService {

	private static final int MAX_ATTEMPTS = 20;

	/** @param ok 이 닉네임으로 바꿀 수 있는지 */
	public record NicknameCheck(boolean ok, String message) {
	}

	private final MemberRepository memberRepository;
	private final NicknameGenerator nicknameGenerator;
	private final NicknamePolicy nicknamePolicy;

	public MemberService(MemberRepository memberRepository, NicknameGenerator nicknameGenerator,
			NicknamePolicy nicknamePolicy) {
		this.memberRepository = memberRepository;
		this.nicknameGenerator = nicknameGenerator;
		this.nicknamePolicy = nicknamePolicy;
	}

	/**
	 * 소셜 로그인 후 회원을 찾고, 처음이면 랜덤 닉네임으로 가입시킨다.
	 * 닉네임이 겹치면(DB 고유 제약) 새로 뽑는다. 같은 계정이 동시에 가입하려 해도 한 번만 만들어진다.
	 *
	 * @param providerId 소셜 서비스가 주는 계정 고유 번호 (실명·사진·이메일은 받지도 저장하지도 않는다)
	 */
	public LoginUser findOrCreate(String provider, String providerId) {
		for (int attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
			var existing = memberRepository.findByProvider(provider, providerId);
			if (existing.isPresent()) {
				return existing.get();
			}
			try {
				return memberRepository.insert(provider, providerId, nicknameGenerator.generate());
			}
			catch (DuplicateKeyException e) {
				// 닉네임이 겹쳤거나, 같은 계정이 동시에 가입했다. 다시 조회해 보고 없으면 새 닉네임으로 재시도
			}
		}
		throw new IllegalStateException("닉네임을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.");
	}
	/** 닉네임을 다시 바꿀 수 있을 때까지 남은 일수. 바꿀 수 있으면 0 */
	public int nicknameLockDaysLeft(UUID userId) {
		return memberRepository.findNicknameState(userId)
				.map(state -> {
					if (state.changedAt() == null) {
						return 0;
					}
					Duration left = Duration.between(OffsetDateTime.now(), state.changedAt().plusDays(NicknamePolicy.COOLDOWN_DAYS));
					return left.isNegative() || left.isZero() ? 0 : (int) Math.ceil(left.toSeconds() / 86400.0);
				})
				.orElse(0);
	}

	/** 입력 중 검사와 저장 직전 검사가 같은 규칙을 쓴다: 30일 제한 → 형식·금칙어 → 현재 닉네임 → 중복 */
	public NicknameCheck checkNickname(LoginUser user, String value) {
		int lockDays = nicknameLockDaysLeft(user.id());
		if (lockDays > 0) {
			return new NicknameCheck(false, "닉네임은 " + lockDays + "일 뒤에 다시 바꿀 수 있어요");
		}
		String error = nicknamePolicy.formatError(value);
		if (error != null) {
			return new NicknameCheck(false, error);
		}
		var current = memberRepository.findNicknameState(user.id());
		if (current.isPresent() && current.get().nickname().equalsIgnoreCase(value)) {
			return new NicknameCheck(false, "지금 쓰고 있는 닉네임이에요");
		}
		if (memberRepository.isNicknameTaken(value, user.id())) {
			return new NicknameCheck(false, "이미 쓰고 있는 닉네임이에요");
		}
		return new NicknameCheck(true, "사용할 수 있는 닉네임이에요");
	}

	/** @return 바뀐 회원 정보 (세션에 다시 담아야 한다) */
	@Transactional
	public LoginUser changeNickname(LoginUser user, String value) {
		NicknameCheck check = checkNickname(user, value);
		if (!check.ok()) {
			throw new ApiException(HttpStatus.BAD_REQUEST, check.message());
		}
		try {
			memberRepository.updateNickname(user.id(), value);
		}
		catch (DuplicateKeyException e) {
			// 검사와 저장 사이에 다른 사람이 먼저 가져간 경우: DB 고유 제약이 최종으로 막는다
			throw new ApiException(HttpStatus.CONFLICT, "이미 쓰고 있는 닉네임이에요");
		}
		return new LoginUser(user.id(), value, user.role());
	}

	/** 지금 쓸 수 있는 랜덤 닉네임 (규칙·금칙어·중복 통과) */
	public String randomAvailableNickname(UUID userId) {
		for (int attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
			String candidate = nicknameGenerator.generate();
			if (nicknamePolicy.formatError(candidate) == null && !memberRepository.isNicknameTaken(candidate, userId)) {
				return candidate;
			}
		}
		throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "닉네임을 뽑지 못했어요. 잠시 후 다시 시도해 주세요.");
	}

	/**
	 * 회원 탈퇴. 저장 목록은 삭제되고, 쓴 레시피는 남고 작성자만 비워진다 (표시는 "익명").
	 * 소셜 서비스(카카오·구글)에서의 연결 해제는 사용자가 해당 서비스 설정에서 한다.
	 */
	@Transactional
	public void withdraw(UUID userId) {
		memberRepository.delete(userId);
	}
}
