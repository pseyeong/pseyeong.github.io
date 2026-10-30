package com.pseyeong.place;

import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

// store 에 한 줄을 만들어 넣는 공용 클래스. CSV 적재와 API 동기화가 함께 쓴다.
@Component
public class StoreUpserter {

    private static final String UPSERT_SQL = """
            insert into store (license_type, mgmt_no, name, category, status, opened_at, closed_at,
                               road_addr, jibun_addr, lat, lng, building, floor, unit, units,
                               modified_at, detail_status)
            values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?::text[], ?, ?)
            on conflict (license_type, mgmt_no) do update set
                name = excluded.name,
                category = excluded.category,
                status = excluded.status,
                opened_at = excluded.opened_at,
                closed_at = excluded.closed_at,
                road_addr = excluded.road_addr,
                jibun_addr = excluded.jibun_addr,
                lat = excluded.lat,
                lng = excluded.lng,
                building = excluded.building,
                floor = excluded.floor,
                unit = excluded.unit,
                units = excluded.units,
                modified_at = excluded.modified_at,
                detail_status = excluded.detail_status
            where (store.name, store.category, store.status, store.opened_at, store.closed_at, store.road_addr,
                   store.modified_at, store.detail_status)
                  is distinct from
                  (excluded.name, excluded.category, excluded.status, excluded.opened_at, excluded.closed_at, excluded.road_addr,
                   excluded.modified_at, excluded.detail_status)
            """;

    private final CoordConverter converter;
    private final AddressParser addressParser;
    private final JdbcTemplate jdbc;

    public StoreUpserter(CoordConverter converter, AddressParser addressParser, JdbcTemplate jdbc) {
        this.converter = converter;
        this.addressParser = addressParser;
        this.jdbc = jdbc;
    }

    // 관리번호나 이름이 없으면 null (건너뛴다). 좌표 x, y 는 TM(EPSG:5174) 문자열.
    // modifiedAt 은 최종수정시점(LAST_MDFCN_PNT), detailStatus 는 상세영업상태명(DTL_SALS_STTS_NM).
    public Object[] toRow(String licenseType, String mgmtNo, String name, String category, String status,
                          String openedAt, String closedAt, String roadAddr, String jibunAddr,
                          String x, String y, String modifiedAt, String detailStatus) {
        if (mgmtNo == null || mgmtNo.isBlank() || name == null || name.isBlank()) {
            return null;
        }

        Double lat = null;
        Double lng = null;
        try {
            if (x != null && y != null && !x.isBlank() && !y.isBlank()) {
                double[] ll = converter.toLatLng(Double.parseDouble(x.trim()), Double.parseDouble(y.trim()));
                lat = ll[0];
                lng = ll[1];
            }
        } catch (NumberFormatException e) {
            // 좌표가 이상하면 좌표 없이 저장
        }

        String road = cut(roadAddr, 300);
        AddressParser.Parts parts = addressParser.parse(road);

        return new Object[] {
                licenseType,
                cut(mgmtNo, 50),
                cut(name, 200),
                cut(category, 50),
                cut(status, 20),
                toDate(openedAt),
                toDate(closedAt),
                road,
                cut(jibunAddr, 300),
                lat,
                lng,
                parts.building(),
                parts.floor(),
                parts.unit(),
                toArray(parts.units()),
                toTimestamp(modifiedAt),
                cut(detailStatus, 30)
        };
    }

    public void upsert(List<Object[]> rows) {
        if (!rows.isEmpty()) {
            jdbc.batchUpdate(UPSERT_SQL, rows);
        }
    }

    // List -> String[] (Postgres text[] 로 들어간다). 없으면 null.
    static String[] toArray(List<String> list) {
        return list == null ? null : list.toArray(String[]::new);
    }

    private static String cut(String s, int max) {
        if (s == null || s.trim().isEmpty()) {
            return null;
        }
        String t = s.trim();
        return t.length() > max ? t.substring(0, max) : t;
    }

    // "2018-04-13", "2018-04-13 00:00:00", "20180413" 모두 처리. 못 읽으면 null.
    private static Date toDate(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        try {
            if (t.length() >= 10 && t.charAt(4) == '-') {
                return Date.valueOf(LocalDate.parse(t.substring(0, 10)));
            }
            if (t.length() >= 8 && t.substring(0, 8).chars().allMatch(Character::isDigit)) {
                return Date.valueOf(LocalDate.parse(t.substring(0, 8), DateTimeFormatter.BASIC_ISO_DATE));
            }
        } catch (Exception e) {
            // 형식이 다르면 아래에서 null
        }
        return null;
    }

    // "2026-10-27 11:52:04", "20261027115204" 처리 (숫자만 남겨 읽는다). 날짜만 있으면 0시. 못 읽으면 null.
    private static Timestamp toTimestamp(String s) {
        if (s == null) {
            return null;
        }
        String d = s.replaceAll("[^0-9]", "");
        try {
            if (d.length() >= 14) {
                return Timestamp.valueOf(LocalDateTime.parse(d.substring(0, 14), DateTimeFormatter.ofPattern("yyyyMMddHHmmss")));
            }
            if (d.length() >= 8) {
                return Timestamp.valueOf(LocalDate.parse(d.substring(0, 8), DateTimeFormatter.BASIC_ISO_DATE).atStartOfDay());
            }
        } catch (Exception e) {
            // 형식이 다르면 아래에서 null
        }
        return null;
    }
}
