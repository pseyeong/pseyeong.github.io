package com.pseyeong.place;

import java.io.IOException;
import java.io.Reader;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
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

    @Value("${csv.dir}")
    private String csvDir;

    @Value("${import.enabled}")
    private boolean enabled;

    @Value("${import.limit}")
    private int limit;

    private final StoreUpserter upserter;

    public StoreImporter(StoreUpserter upserter) {
        this.upserter = upserter;
    }

    @Override
    public void run(String... args) throws Exception {
        if (!enabled) {
            return;
        }
        FILES.forEach((fileName, licenseType) -> {
            Path file = Path.of(csvDir, fileName);
            if (!Files.exists(file)) {
                System.out.println(">>> file not found, skip: " + file);
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
                System.out.println(">>> missing columns, skip: " + file + " " + missing);
                return;
            }

            for (CSVRecord r : parser) {
                if (limit > 0 && read >= limit) {
                    break;
                }
                read++;

                Object[] row = upserter.toRow(licenseType,
                        r.get("관리번호"), r.get("사업장명"), r.get("업태구분명"), r.get("영업상태명"),
                        r.get("인허가일자"), r.get("폐업일자"),
                        r.get("도로명주소"), r.get("지번주소"),
                        r.get("좌표정보(X)"), r.get("좌표정보(Y)"),
                        opt(r, "최종수정시점"), opt(r, "상세영업상태명"));
                if (row == null) {
                    skipped++;
                    continue;
                }
                batch.add(row);

                if (batch.size() >= BATCH_SIZE) {
                    upserter.upsert(batch);
                    batch.clear();
                    System.out.println(">>> " + file.getFileName() + " read " + read);
                }
            }
        }

        upserter.upsert(batch);
        System.out.println(">>> " + file.getFileName() + " done: read " + read + ", skipped " + skipped);
    }

    // 필수가 아닌 컬럼: 파일에 없으면 null
    private static String opt(CSVRecord r, String column) {
        return r.isMapped(column) ? r.get(column) : null;
    }
}
