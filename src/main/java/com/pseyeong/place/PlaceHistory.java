package com.pseyeong.place;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

// 한 자리(건물+층, 필요하면 호)의 변천사: 가게 목록 + 가게 사이의 빈 기간 + 승인된 사용자 제보.
public record PlaceHistory(String building, String floor, String unit, List<Item> records, List<Gap> gaps,
                           List<PlaceReport> reports) {

    private static final String OPEN = "영업/정상";
    private static final int GAP_MIN_DAYS = 30;       // 이 이상 비어 있으면 공백으로 본다
    private static final int OWNER_CHANGE_DAYS = 60;  // 폐업과 재인허가가 이 안이면 영업자 변경 추정
    private static final int MODIFIED_MIN_DAYS = 30;  // 인허가 직후 수정은 보여 주지 않는다

    // DB 에서 읽은 그대로의 한 줄
    public record Row(String name, String licenseType, String category, String status,
        String unit, List<String> units, LocalDate openedAt, LocalDate closedAt,
        LocalDate modifiedAt, List<String> nameChanges) {
    }

    // 응답용 한 줄: Row + 영업 기간(개월) + 영업자 변경 추정 여부
    // modifiedAt 은 영업 중이고 인허가 뒤 한참 지나 수정된 경우에만 (폐업 건은 폐업 처리일로 덮여서 뺀다)
    public record Item(String name, String licenseType, String category, String status,
                String unit, List<String> units, LocalDate openedAt, LocalDate closedAt,
                Integer months, boolean ownerChanged, LocalDate modifiedAt, List<String> nameChanges) {
    }



    // 가게 사이의 빈 기간
    public record Gap(LocalDate from, LocalDate to, int months) {
    }

    // rows 는 개업일 순(없으면 맨 뒤)으로 정렬되어 있어야 한다.
    public static PlaceHistory of(String building, String floor, String unit, List<Row> rows, List<PlaceReport> reports) {
        LocalDate today = LocalDate.now();
        List<Item> items = new ArrayList<>();
        List<Gap> gaps = new ArrayList<>();
        LocalDate coveredUntil = null; // 지금까지의 가게들이 영업한 마지막 날
        Row prev = null;

        for (Row r : rows) {
            boolean isOpen = OPEN.equals(r.status());

            // 영업 기간(개월): 영업 중이면 오늘까지, 폐업이면 폐업일까지
            LocalDate end = isOpen ? today : r.closedAt();
            Integer months = (r.openedAt() == null || end == null)
                    ? null
                    : (int) Math.max(0, ChronoUnit.MONTHS.between(r.openedAt(), end));

            // 영업자 변경 추정
            boolean ownerChanged = prev != null
                    && prev.closedAt() != null && r.openedAt() != null
                    && Objects.equals(prev.name(), r.name())
                    && Objects.equals(prev.category(), r.category())
                    && Math.abs(ChronoUnit.DAYS.between(prev.closedAt(), r.openedAt())) <= OWNER_CHANGE_DAYS;

            // 공백: 앞 가게들이 끝난 뒤 한참 있다가 열렸으면
            if (r.openedAt() != null) {
                if (coveredUntil != null && ChronoUnit.DAYS.between(coveredUntil, r.openedAt()) >= GAP_MIN_DAYS) {
                    gaps.add(new Gap(coveredUntil, r.openedAt(),
                            (int) ChronoUnit.MONTHS.between(coveredUntil, r.openedAt())));
                }
                // 영업 끝난 날을 모르는 폐업 건은 개업일까지만 영업한 것으로 본다
                LocalDate covered = isOpen ? today : (r.closedAt() != null ? r.closedAt() : r.openedAt());
                if (coveredUntil == null || covered.isAfter(coveredUntil)) {
                    coveredUntil = covered;
                }
            }

            boolean showModified = isOpen && r.modifiedAt() != null && r.openedAt() != null
                    && ChronoUnit.DAYS.between(r.openedAt(), r.modifiedAt()) >= MODIFIED_MIN_DAYS;

            items.add(new Item(r.name(), r.licenseType(), r.category(), r.status(), r.unit(), r.units(),
            r.openedAt(), r.closedAt(), months, ownerChanged,
            showModified ? r.modifiedAt() : null, r.nameChanges()));


            prev = r;
        }
        return new PlaceHistory(building, floor, unit, items, gaps, reports);
    }
}
