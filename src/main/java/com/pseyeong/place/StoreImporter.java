package com.pseyeong.place;

import java.io.Reader;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Date;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

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

    private static final String INSERT_SQL = """
            insert into store (mgmt_no, name, category, status, opened_at, closed_at,
                               road_addr, jibun_addr, lat, lng)
            values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            on conflict (mgmt_no) do nothing
            """;

    @Value("${csv.path}")
    private String csvPath;

    @Value("${import.enabled}")
    private boolean enabled;

    @Value("${import.limit}")
    private int limit;

    private final CoordConverter converter;
    private final JdbcTemplate jdbc;

    public StoreImporter(CoordConverter converter, JdbcTemplate jdbc) {
        this.converter = converter;
        this.jdbc = jdbc;
    }

    @Override
    public void run(String... args) throws Exception {
        if (!enabled) {
            return;
        }

        int read = 0;
        int skipped = 0;
        List<Object[]> batch = new ArrayList<>();

        try (Reader reader = Files.newBufferedReader(Path.of(csvPath), Charset.forName("MS949"));
             CSVParser parser = CSVFormat.DEFAULT.builder()
                     .setHeader().setSkipHeaderRecord(true).build().parse(reader)) {

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

                batch.add(new Object[] {
                        cut(mgmtNo, 50),
                        cut(name, 200),
                        cut(r.get("업태구분명").trim(), 50),
                        cut(r.get("영업상태명").trim(), 20),
                        toDate(r.get("인허가일자")),
                        toDate(r.get("폐업일자")),
                        cut(r.get("도로명주소").trim(), 300),
                        cut(r.get("지번주소").trim(), 300),
                        lat,
                        lng
                });

                if (batch.size() >= BATCH_SIZE) {
                    jdbc.batchUpdate(INSERT_SQL, batch);
                    batch.clear();
                    System.out.println(">>> 진행: " + read + "건 읽음");
                }
            }
        }

        if (!batch.isEmpty()) {
            jdbc.batchUpdate(INSERT_SQL, batch);
        }
        System.out.println(">>> 적재 완료: 읽음 " + read + ", 건너뜀 " + skipped);
    }

    private static String cut(String s, int max) {
        if (s == null || s.isEmpty()) {
            return null;
        }
        return s.length() > max ? s.substring(0, max) : s;
    }

    private static Date toDate(String s) {
        if (s == null || s.trim().isEmpty()) {
            return null;
        }
        try {
            return Date.valueOf(LocalDate.parse(s.trim()));
        } catch (Exception e) {
            return null;
        }
    }
}
