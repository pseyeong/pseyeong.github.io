package com.pseyeong.place;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Component;

// 제보 횟수 제한: 같은 사람(IP 해시)은 10분에 3건, 하루 20건까지.
// 서버 메모리에서 세기 때문에 재시작하면 초기화된다 (이 규모에선 충분).
@Component
public class ReportLimiter {

    private static final long TEN_MINUTES = 10 * 60 * 1000L;
    private static final long ONE_DAY = 24 * 60 * 60 * 1000L;
    private static final int MAX_PER_TEN_MINUTES = 3;
    private static final int MAX_PER_DAY = 20;
    private static final int CLEANUP_SIZE = 10_000; // 기록된 사람이 이만큼 쌓이면 오래된 것 정리

    private final Map<String, Deque<Long>> hits = new HashMap<>(); // 사람별 보낸 시각들 (오래된 것이 앞)

    public synchronized boolean tryAcquire(String key) {
        long now = System.currentTimeMillis();
        if (hits.size() > CLEANUP_SIZE) {
            hits.values().removeIf(q -> q.isEmpty() || now - q.peekLast() > ONE_DAY);
        }

        Deque<Long> times = hits.computeIfAbsent(key, k -> new ArrayDeque<>());
        while (!times.isEmpty() && now - times.peekFirst() > ONE_DAY) {
            times.pollFirst();
        }
        long recent = times.stream().filter(t -> now - t <= TEN_MINUTES).count();
        if (recent >= MAX_PER_TEN_MINUTES || times.size() >= MAX_PER_DAY) {
            return false;
        }
        times.addLast(now);
        return true;
    }
}
