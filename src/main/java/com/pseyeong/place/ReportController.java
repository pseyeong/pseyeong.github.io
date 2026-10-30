package com.pseyeong.place;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Map;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;

// 사용자 제보 받기. 저장만 하고, 승인(approved)은 Supabase Table Editor 에서 한다.
@RestController
public class ReportController {

    private static final Pattern MONTH = Pattern.compile("\\d{4}-(0[1-9]|1[0-2])"); // YYYY-MM

    @Value("${report.salt}")
    private String salt; // IP 해시에 섞는 비밀값 (.env 의 REPORT_SALT)

    private final ReportRepository repository;
    private final ReportLimiter limiter;

    public ReportController(ReportRepository repository, ReportLimiter limiter) {
        this.repository = repository;
        this.limiter = limiter;
    }

    @PostMapping("/api/reports")
    public ResponseEntity<Map<String, String>> create(@RequestBody PlaceReport.Request body, HttpServletRequest http) {
        if (salt == null || salt.isBlank()) {
            return error(503, "제보 기능을 준비 중이에요.");
        }
        PlaceReport.Request r = body.trimmed();

        // 허니팟이 채워졌으면 봇: 저장하지 않고 성공한 척만 한다
        if (r.website() != null) {
            return ok();
        }

        String invalid = validate(r);
        if (invalid != null) {
            return error(400, invalid);
        }

        String ipHash = hash(clientIp(http));
        if (!limiter.tryAcquire(ipHash)) {
            return error(429, "잠시 후 다시 보내 주세요.");
        }
        if (!repository.spotExists(r.building(), r.floor())) {
            return error(400, "지도에 없는 자리예요.");
        }
        // 하루 안에 같은 내용을 또 보낸 건 조용히 무시
        if (!repository.isDuplicate(ipHash, r.building(), r.floor(), r.actualName())) {
            repository.insert(r, ipHash);
        }
        return ok();
    }

    // 문제가 있으면 사용자에게 보여 줄 문구, 없으면 null
    private static String validate(PlaceReport.Request r) {
        if (r.building() == null || r.floor() == null) {
            return "자리 정보가 없어요.";
        }
        if (r.actualName() == null) {
            return "실제 상호를 적어 주세요.";
        }
        if (r.actualName().length() > 100) {
            return "상호는 100자까지 적을 수 있어요.";
        }
        if (r.memo() != null && r.memo().length() > 500) {
            return "메모는 500자까지 적을 수 있어요.";
        }
        if ((r.periodFrom() != null && !MONTH.matcher(r.periodFrom()).matches())
                || (r.periodTo() != null && !MONTH.matcher(r.periodTo()).matches())) {
            return "기간은 YYYY-MM 형식으로 적어 주세요.";
        }
        if (r.periodFrom() != null && r.periodTo() != null && r.periodFrom().compareTo(r.periodTo()) > 0) {
            return "시작이 끝보다 늦어요.";
        }
        if (r.building().length() > 300 || r.floor().length() > 20 || (r.unit() != null && r.unit().length() > 20)) {
            return "자리 정보가 올바르지 않아요.";
        }
        return null;
    }

    // 프록시(Render) 뒤에서는 원래 IP 가 X-Forwarded-For 의 첫 값으로 온다
    private static String clientIp(HttpServletRequest http) {
        String forwarded = http.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return http.getRemoteAddr();
    }

    // IP 원본은 저장하지 않고 salt 를 섞은 SHA-256 값만 쓴다 (같은 사람인지 비교만 가능)
    private String hash(String ip) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest((salt + ":" + ip).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private static ResponseEntity<Map<String, String>> ok() {
        return ResponseEntity.ok(Map.of("result", "ok"));
    }

    private static ResponseEntity<Map<String, String>> error(int status, String message) {
        return ResponseEntity.status(status).body(Map.of("error", message));
    }
}
