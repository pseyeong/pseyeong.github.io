package com.pseyeong.place;

// 승인된 사용자 제보 (화면에 내보내는 값만). 기간은 'YYYY-MM', 끝이 없으면 지금까지.
public record PlaceReport(String actualName, String periodFrom, String periodTo) {

    // 제보 폼에서 받는 값. website 는 사람 눈에 안 보이는 칸(허니팟)이라 채워져 있으면 봇이다.
    public record Request(String building, String floor, String unit,
                          String actualName, String periodFrom, String periodTo, String memo,
                          String website) {

        // 앞뒤 공백을 지우고 빈 문자열은 null 로
        public Request trimmed() {
            return new Request(clean(building), clean(floor), clean(unit),
                    clean(actualName), clean(periodFrom), clean(periodTo), clean(memo), clean(website));
        }

        private static String clean(String s) {
            return s == null || s.isBlank() ? null : s.trim();
        }
    }
}
