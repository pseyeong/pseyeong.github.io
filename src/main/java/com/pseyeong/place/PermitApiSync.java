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


// 행안부 일반음식점 API 에서 "마지막으로 본 시각 이후 바뀐 서울 가게"를 받아 store 에 저장한다.
@Component
public class PermitApiSync implements CommandLineRunner {

    private static final String NAME = "general_restaurants";
    private static final String LICENSE_TYPE = "일반음식점";
    private static final int PAGE_SIZE = 100;   // API 한 번에 최대 100건
    private static final int MAX_PAGES = 200;   // 안전장치: 한 번에 최대 2만 건

    @Value("${permit.api.url}")
    private String url;

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
        try {
            sync();
            jdbc.execute("refresh materialized view place_spot"); // 지도 집계를 최신으로
            System.out.println(">>> place_spot refreshed");
        } catch (RuntimeException e) {
            System.out.println(">>> sync failed: " + e.getMessage());
        }
    }

    public void sync() {
        String since = loadSince();
        String maxSeen = since;
        int total = 0;
        Map<String, Integer> kinds = new TreeMap<>(); // DAT_UPDT_SE 값별 건수 (I, U, D ...)

        for (int page = 1; page <= MAX_PAGES; page++) {
            List<Map<String, Object>> items = fetch(page, since);
            if (items.isEmpty()) {
                break;
            }

            List<Object[]> rows = new ArrayList<>();
            for (Map<String, Object> it : items) {
                kinds.merge(str(it, "DAT_UPDT_SE"), 1, Integer::sum);

                String updated = str(it, "DAT_UPDT_PNT").replaceAll("[^0-9]", ""); // 숫자만: YYYYMMDDHHMMSS
                if (updated.compareTo(maxSeen) > 0) {
                    maxSeen = updated;
                }

                Object[] row = upserter.toRow(LICENSE_TYPE,
                        str(it, "MNG_NO"), str(it, "BPLC_NM"), str(it, "BZSTAT_SE_NM"), str(it, "SALS_STTS_NM"),
                        str(it, "LCPMT_YMD"), str(it, "CLSBIZ_YMD"),
                        str(it, "ROAD_NM_ADDR"), str(it, "LOTNO_ADDR"),
                        str(it, "CRD_INFO_X"), str(it, "CRD_INFO_Y"));
                if (row != null) {
                    rows.add(row);
                }
            }
            upserter.upsert(rows);
            total += items.size();
            System.out.println(">>> sync page " + page + ": " + items.size() + " rows");

            if (items.size() < PAGE_SIZE) {
                break;
            }
        }

        saveSince(maxSeen);
        System.out.println(">>> sync done: " + total + " rows, kinds=" + kinds + ", since=" + maxSeen);
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> fetch(int page, String since) {
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

        Map<String, Object> res;
        try {
            res = RestClient.create().get().uri(URI.create(url + "?" + query))
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve().body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (RestClientResponseException e) {
            throw new IllegalStateException("API HTTP " + e.getStatusCode() + " " + e.getResponseBodyAsString());
        } catch (Exception e) {
            // 예외 메시지에 키가 든 주소가 섞일 수 있어 클래스 이름만 남긴다
            throw new IllegalStateException("API call failed: " + e.getClass().getSimpleName());
        }

        if (res == null || !(res.get("response") instanceof Map<?, ?> response)
                || !(response.get("body") instanceof Map<?, ?> body)) {
            throw new IllegalStateException("unexpected response: " + (res == null ? "null" : res.keySet()));
        }
        System.out.println(">>> totalCount=" + body.get("totalCount") + " page=" + body.get("pageNo"));

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

    private String loadSince() {
        String last = jdbc.query("select since from sync_state where name = ?",
                rs -> rs.next() ? rs.getString(1) : null, NAME);
        return last != null ? last : initialSince;
    }

    private void saveSince(String since) {
        jdbc.update("""
                insert into sync_state (name, since) values (?, ?)
                on conflict (name) do update set since = excluded.since, updated_at = now()
                """, NAME, since);
    }

    private static String str(Map<String, Object> m, String k) {
        Object v = m.get(k);
        return v == null ? "" : v.toString().trim();
    }

    private static String enc(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8);
    }
}
