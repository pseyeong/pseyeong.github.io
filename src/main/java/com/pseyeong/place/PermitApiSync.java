package com.pseyeong.place;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.scheduling.annotation.Scheduled;


// 행안부 인허가 API 에서 업종별로 "마지막으로 본 시각 이후 바뀐 서울 가게"를 받아 store 에 저장한다.
@Component
public class PermitApiSync implements CommandLineRunner {

    // API 경로 이름(sync_state 의 name 으로도 쓴다) + store 에 넣을 업종 이름
    private record Service(String path, String licenseType) {}

    private static final List<Service> SERVICES = List.of(
            new Service("general_restaurants", "일반음식점"),
            new Service("rest_cafes", "휴게음식점"));

    private static final int PAGE_SIZE = 100;     // API 한 번에 최대 100건
    private static final int MAX_PAGES = 4000;    // 안전장치: 업종당 한 번에 최대 40만 건 (서울 일반음식점 전체 약 29만)
    private static final int MAX_TRIES = 3;       // API 일시 오류(5xx, 네트워크) 때 최대 시도 횟수
    private static final int VACUUM_EVERY = 100;  // 전체 재수집 때 1만 건마다 vacuum (update 로 테이블이 부풀지 않게)

    @Value("${permit.api.base}")
    private String base;

    @Value("${permit.api.key}")
    private String key;

    @Value("${sync.enabled}")
    private boolean enabled;

    @Value("${sync.initial-since}")
    private String initialSince;

    private final StoreUpserter upserter;
    private final JdbcTemplate jdbc;

    public PermitApiSync(StoreUpserter upserter, JdbcTemplate jdbc) {
        this.upserter = upserter;
        this.jdbc = jdbc;
    }

    @Override
    public void run(String... args) {
        if (!enabled) {
            return;
        }
        syncAndRefresh();
    }

    // 정해 둔 시각에 자동 실행 (SYNC_CRON 이 "-" 이면 실행하지 않는다)
    @Scheduled(cron = "${sync.cron}", zone = "Asia/Seoul")
    public void scheduled() {
        syncAndRefresh();
    }

    private void syncAndRefresh() {
        for (Service s : SERVICES) {
            try {
                sync(s);
            } catch (RuntimeException e) {
                System.out.println(">>> sync failed [" + s.path() + "]: " + e.getMessage()); // 한 업종이 실패해도 다음 업종은 계속
            }
        }
        try {
            jdbc.execute("refresh materialized view place_spot"); // 지도 집계를 최신으로
            System.out.println(">>> place_spot refreshed");
        } catch (RuntimeException e) {
            System.out.println(">>> refresh failed: " + e.getMessage());
        }
    }

    public void sync(Service s) {
        String since = loadSince(s);
        String maxSeen = since;
        int total = 0;
        boolean finished = false;
        Map<String, Integer> kinds = new TreeMap<>(); // DAT_UPDT_SE 값별 건수 (I, U, D ...)

        for (int page = 1; page <= MAX_PAGES; page++) {
            List<Map<String, Object>> items = fetch(s, page, since);
            if (items.isEmpty()) {
                finished = true;
                break;
            }

            List<Object[]> rows = new ArrayList<>();
            for (Map<String, Object> it : items) {
                kinds.merge(str(it, "DAT_UPDT_SE"), 1, Integer::sum);

                String updated = str(it, "DAT_UPDT_PNT").replaceAll("[^0-9]", ""); // 숫자만: YYYYMMDDHHMMSS
                if (updated.compareTo(maxSeen) > 0) {
                    maxSeen = updated;
                }

                Object[] row = upserter.toRow(s.licenseType(),
                        str(it, "MNG_NO"), str(it, "BPLC_NM"), str(it, "BZSTAT_SE_NM"), str(it, "SALS_STTS_NM"),
                        str(it, "LCPMT_YMD"), str(it, "CLSBIZ_YMD"),
                        str(it, "ROAD_NM_ADDR"), str(it, "LOTNO_ADDR"),
                        str(it, "CRD_INFO_X"), str(it, "CRD_INFO_Y"),
                        str(it, "LAST_MDFCN_PNT"), str(it, "DTL_SALS_STTS_NM"));
                if (row != null) {
                    rows.add(row);
                }
            }
            upserter.upsert(rows);
            total += items.size();
            System.out.println(">>> sync [" + s.path() + "] page " + page + ": " + items.size() + " rows");

            if (page % VACUUM_EVERY == 0) {
                vacuum();
            }

            if (items.size() < PAGE_SIZE) {
                finished = true;
                break;
            }
        }

        // 중간에 멈췄으면 못 받은 행이 있으니 since 를 그대로 둔다 (다음 실행에서 처음부터 다시)
        if (finished) {
            saveSince(s, maxSeen);
        } else {
            System.out.println(">>> sync [" + s.path() + "] stopped at MAX_PAGES, since not saved");
        }
        System.out.println(">>> sync [" + s.path() + "] done: " + total + " rows, kinds=" + kinds + ", since=" + maxSeen);
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> fetch(Service s, int page, String since) {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("serviceKey", key);
        params.put("pageNo", String.valueOf(page));
        params.put("numOfRows", String.valueOf(PAGE_SIZE));
        params.put("returnType", "json");
        params.put("cond[ROAD_NM_ADDR::LIKE]", "서울특별시");
        params.put("cond[DAT_UPDT_PNT::GTE]", since);

        String query = params.entrySet().stream()
                .map(e -> enc(e.getKey()) + "=" + enc(e.getValue()))
                .collect(Collectors.joining("&"));

        Map<String, Object> res = null;
        for (int attempt = 1; res == null; attempt++) {
            try {
                res = RestClient.create().get().uri(URI.create(base + "/" + s.path() + "/info?" + query))
                        .accept(MediaType.APPLICATION_JSON)
                        .retrieve().body(new ParameterizedTypeReference<Map<String, Object>>() {});
                if (res == null) {
                    throw new IllegalStateException("unexpected response: null");
                }
            } catch (RestClientResponseException e) {
                // 503 SERVICETIMEOUT 처럼 서버 쪽 일시 오류는 잠깐 쉬었다가 다시 시도한다
                if (e.getStatusCode().is5xxServerError() && attempt < MAX_TRIES) {
                    retryWait(page, attempt, "HTTP " + e.getStatusCode().value());
                    continue;
                }
                throw new IllegalStateException("API HTTP " + e.getStatusCode() + " " + e.getResponseBodyAsString());
            } catch (IllegalStateException e) {
                throw e;
            } catch (Exception e) {
                // 예외 메시지에 키가 든 주소가 섞일 수 있어 클래스 이름만 남긴다
                if (attempt < MAX_TRIES) {
                    retryWait(page, attempt, e.getClass().getSimpleName());
                    continue;
                }
                throw new IllegalStateException("API call failed: " + e.getClass().getSimpleName());
            }
        }

        if (res == null || !(res.get("response") instanceof Map<?, ?> response)
                || !(response.get("body") instanceof Map<?, ?> body)) {
            throw new IllegalStateException("unexpected response: " + (res == null ? "null" : res.keySet()));
        }
        if (page == 1) {
            System.out.println(">>> [" + s.path() + "] totalCount=" + body.get("totalCount"));
        }

        if (!(body.get("items") instanceof Map<?, ?> items)) {
            return List.of(); // 결과가 없으면 items 가 빈 문자열로 올 수 있다
        }
        Object item = items.get("item");
        if (item instanceof List<?> list) {
            return (List<Map<String, Object>>) list;
        }
        if (item instanceof Map<?, ?> one) {
            return List.of((Map<String, Object>) one); // 한 건이면 배열이 아니라 객체로 올 수 있다
        }
        return List.of();
    }

    // 재시도 전 대기: 5초, 10초 ... 처럼 점점 길게
    private static void retryWait(int page, int attempt, String reason) {
        System.out.println(">>> retry page " + page + " (" + reason + "), attempt " + (attempt + 1) + "/" + MAX_TRIES);
        try {
            Thread.sleep(5000L * attempt);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("interrupted");
        }
    }

    // update 는 새 버전의 행을 쓰고 옛 행을 죽은 행으로 남긴다. vacuum 으로 그 자리를 바로 재사용하게 한다.
    private void vacuum() {
        try {
            jdbc.execute("vacuum store");
            System.out.println(">>> vacuum store");
        } catch (RuntimeException e) {
            System.out.println(">>> vacuum failed: " + e.getMessage()); // 실패해도 수집은 계속
        }
    }

    private String loadSince(Service s) {
        String last = jdbc.query("select since from sync_state where name = ?",
                rs -> rs.next() ? rs.getString(1) : null, s.path());
        return last != null ? last : initialSince;
    }

    private void saveSince(Service s, String since) {
        jdbc.update("""
                insert into sync_state (name, since) values (?, ?)
                on conflict (name) do update set since = excluded.since, updated_at = now()
                """, s.path(), since);
    }

    private static String str(Map<String, Object> m, String k) {
        Object v = m.get(k);
        return v == null ? "" : v.toString().trim();
    }

    private static String enc(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8);
    }
}
