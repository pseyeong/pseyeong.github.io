package com.pseyeong.place;

import java.sql.Date;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

// store 에 한 줄을 만들어 넣는 공용 클래스. API 동기화가 사용한다.
@Component
public class StoreUpserter {

    private static final String UPSERT_SQL = """
            insert into store (license_type, mgmt_no, name, category, status, opened_at, closed_at,
                               road_addr, jibun_addr, lat, lng, building, floor, unit)
            values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                unit = excluded.unit
            where (store.name, store.category, store.status, store.opened_at, store.closed_at, store.road_addr)
                  is distinct from
                  (excluded.name, excluded.category, excluded.status, excluded.opened_at, excluded.closed_at, excluded.road_addr)
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
    public Object[] toRow(String licenseType, String mgmtNo, String name, String category, String status,
                          String openedAt, String closedAt, String roadAddr, String jibunAddr,
                          String x, String y) {
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
                parts.unit()
        };
    }

    public void upsert(List<Object[]> rows) {
        if (!rows.isEmpty()) {
            jdbc.batchUpdate(UPSERT_SQL, rows);
        }
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
}
