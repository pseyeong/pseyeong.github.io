package com.pseyeong.place;

import java.io.IOException;
import java.io.Reader;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Date;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class StoreImporter implements CommandLineRunner {

    private static final int BATCH_SIZE = 1000;

    // csv.dir 폴더 안의 파일명 -> 업종(license_type). 파일이 없으면 건너뛴다.
    private static final Map<String, String> FILES = Map.of(
            "restaurants_seoul.csv", "일반음식점",
            "cafes_seoul.csv", "휴게음식점");

    // 이 컬럼이 없는 파일은 읽지 않는다 (업종마다 헤더가 조금씩 다를 수 있어서)
    private static final List<String> REQUIRED = List.of(
            "관리번호", "사업장명", "업태구분명", "영업상태명", "인허가일자", "폐업일자",
            "도로명주소", "지번주소", "좌표정보(X)", "좌표정보(Y)");

    // 같은 (업종, 관리번호)가 있으면 갱신한다. 값이 바뀐 행만 쓴다.
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

    @Value("${csv.dir}")
    private String csvDir;

    @Value("${import.enabled}")
    private boolean enabled;

    @Value("${import.limit}")
    private int limit;

    private final CoordConverter converter;
    private final AddressParser addressParser;
    private final JdbcTemplate jdbc;

    public StoreImporter(CoordConverter converter, AddressParser addressParser, JdbcTemplate jdbc) {
        this.converter = converter;
        this.addressParser = addressParser;
        this.jdbc = jdbc;
    }

    @Override
    public void run(String... args) throws Exception {
        if (!enabled) {
            return;
        }
        FILES.forEach((fileName, licenseType) -> {
            Path file = Path.of(csvDir, fileName);
            if (!Files.exists(file)) {
                System.out.println(">>> 파일 없음, 건너뜀: " + file);
                return;
            }
            try {
                importFile(file, licenseType);
            } catch (IOException e) {
                throw new IllegalStateException(e);
            }
        });
    }

    private void importFile(Path file, String licenseType) throws IOException {
        int read = 0;
        int skipped = 0;
        List<Object[]> batch = new ArrayList<>();

        try (Reader reader = Files.newBufferedReader(file, Charset.forName("MS949"));
             CSVParser parser = CSVFormat.DEFAULT.builder()
                     .setHeader().setSkipHeaderRecord(true).build().parse(reader)) {

            List<String> missing = REQUIRED.stream()
                    .filter(h -> !parser.getHeaderMap().containsKey(h)).toList();
            if (!missing.isEmpty()) {
                System.out.println(">>> 필요한 컬럼이 없어 건너뜀: " + file + " " + missing);
                return;
            }

            for (CSVRecord r : parser) {
                if (limit > 0 && read >= limit) {
                    break;
                }
                read++;

                String mgmtNo = r.get("관리번호").trim();
                String name = r.get("사업장명").trim();
                if (mgmtNo.isEmpty() || name.isEmpty()) {
                    skipped++;
                    continue;
                }

                Double lat = null;
                Double lng = null;
                String x = r.get("좌표정보(X)").trim();
                String y = r.get("좌표정보(Y)").trim();
                if (!x.isEmpty() && !y.isEmpty()) {
                    double[] ll = converter.toLatLng(Double.parseDouble(x), Double.parseDouble(y));
                    lat = ll[0];
                    lng = ll[1];
                }

                String roadAddr = cut(r.get("도로명주소").trim(), 300);
                AddressParser.Parts parts = addressParser.parse(roadAddr);

                batch.add(new Object[] {
                        licenseType,
                        cut(mgmtNo, 50),
                        cut(name, 200),
                        cut(r.get("업태구분명").trim(), 50),
                        cut(r.get("영업상태명").trim(), 20),
                        toDate(r.get("인허가일자")),
                        toDate(r.get("폐업일자")),
                        roadAddr,
                        cut(r.get("지번주소").trim(), 300),
                        lat,
                        lng,
                        parts.building(),
                        parts.floor(),
                        parts.unit()
                });

                if (batch.size() >= BATCH_SIZE) {
                    jdbc.batchUpdate(UPSERT_SQL, batch);
                    batch.clear();
                    System.out.println(">>> " + licenseType + " 진행: " + read + "건 읽음");
                }
            }
        }

        if (!batch.isEmpty()) {
            jdbc.batchUpdate(UPSERT_SQL, batch);
        }
        System.out.println(">>> " + licenseType + " 적재 완료: 읽음 " + read + ", 건너뜀 " + skipped);
    }

    private static String cut(String s, int max) {
        if (s == null || s.isEmpty()) {
            return null;
        }
        return s.length() > max ? s.substring(0, max) : s;
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
