package com.pseyeong.hankki.member;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

@Service
public class MemberService {

	private static final int MAX_ATTEMPTS = 20;

	private final MemberRepository memberRepository;
	private final NicknameGenerator nicknameGenerator;

	public MemberService(MemberRepository memberRepository, NicknameGenerator nicknameGenerator) {
		this.memberRepository = memberRepository;
		this.nicknameGenerator = nicknameGenerator;
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
}
