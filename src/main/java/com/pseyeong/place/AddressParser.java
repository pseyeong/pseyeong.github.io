package com.pseyeong.place;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;

// 도로명주소를 건물 / 층 / 호로 쪼갠다.
@Component
public class AddressParser {

    private static final Pattern PAREN_TAIL = Pattern.compile("\\s*\\(.*$");
    private static final Pattern FLOOR = Pattern.compile("(지하\\s?[0-9]+층|[0-9]+층)");

    // 호 하나: 영문(선택) + 숫자 + (-숫자)(선택) + 영문 1자(선택). 예: 105, B104-4, FP117, B102A
    private static final String ONE = "[A-Za-z]*[0-9]+(?:-[0-9]+)?[A-Za-z]?";
    // 호 목록: "103,105호", "106~108호", "S007, 008호"
    private static final Pattern UNITS = Pattern.compile("(" + ONE + "(?:\\s*[,~]\\s*" + ONE + ")*)\\s*호");
    private static final Pattern DIGITS = Pattern.compile("[0-9]{1,6}");
    private static final int MAX_RANGE = 10; // "106~108호" 처럼 펼칠 최대 칸 수

    // unit: 대표 호(첫 번째), units: 이 가게가 쓰는 호 전체. 호가 없으면 둘 다 null.
    public record Parts(String building, String floor, String unit, List<String> units) {
    }

    public Parts parse(String roadAddr) {
        if (roadAddr == null || roadAddr.isBlank()) {
            return new Parts(null, null, null, null);
        }
        String first = roadAddr.split(",", -1)[0]; // 첫 쉼표 앞부분
        String building = PAREN_TAIL.matcher(first).replaceFirst(""); // "(" 이후 제거
        List<String> units = parseUnits(roadAddr);
        return new Parts(building, find(FLOOR, roadAddr),
                units.isEmpty() ? null : units.get(0),
                units.isEmpty() ? null : units);
    }

    // 호는 상세주소(첫 쉼표 뒤)에서만 찾는다. 건물번호가 호로 잡히지 않게.
    private static List<String> parseUnits(String roadAddr) {
        int comma = roadAddr.indexOf(',');
        String detail = comma >= 0 ? roadAddr.substring(comma + 1) : roadAddr;

        Set<String> units = new LinkedHashSet<>(); // 순서 유지 + 중복 제거
        Matcher m = UNITS.matcher(detail);
        while (m.find()) {
            for (String item : m.group(1).split(",")) {
                String[] ends = item.split("~");
                if (ends.length > 1) {
                    addRange(units, ends[0].trim(), ends[ends.length - 1].trim());
                } else {
                    add(units, item.trim());
                }
            }
        }
        return new ArrayList<>(units);
    }

    // "106~108" -> 106, 107, 108 (숫자이고 차이가 작을 때만). 아니면 양 끝만.
    private static void addRange(Set<String> units, String from, String to) {
        if (DIGITS.matcher(from).matches() && DIGITS.matcher(to).matches()) {
            int a = Integer.parseInt(from);
            int b = Integer.parseInt(to);
            if (a < b && b - a <= MAX_RANGE) {
                for (int i = a; i <= b; i++) {
                    add(units, String.format("%0" + from.length() + "d", i)); // 앞의 0 유지
                }
                return;
            }
        }
        add(units, from);
        add(units, to);
    }

    private static void add(Set<String> units, String token) {
        if (!token.isEmpty()) {
            units.add(token.toUpperCase() + "호");
        }
    }

    private static String find(Pattern p, String s) {
        Matcher m = p.matcher(s);
        return m.find() ? m.group(1) : null;
    }
}
