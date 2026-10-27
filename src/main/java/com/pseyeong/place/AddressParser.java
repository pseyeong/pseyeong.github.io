package com.pseyeong.place;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;

// 도로명주소를 건물 / 층 / 호로 쪼갠다. db/04 의 SQL 식과 같은 규칙이다.
@Component
public class AddressParser {

    private static final Pattern PAREN_TAIL = Pattern.compile("\\s*\\(.*$");
    private static final Pattern FLOOR = Pattern.compile("(지하\\s?[0-9]+층|[0-9]+층)");
    private static final Pattern UNIT = Pattern.compile("([0-9]+호)");

    public record Parts(String building, String floor, String unit) {
    }

    public Parts parse(String roadAddr) {
        if (roadAddr == null || roadAddr.isBlank()) {
            return new Parts(null, null, null);
        }
        String first = roadAddr.split(",", -1)[0]; // 첫 쉼표 앞부분
        String building = PAREN_TAIL.matcher(first).replaceFirst(""); // "(" 이후 제거
        return new Parts(building, find(FLOOR, roadAddr), find(UNIT, roadAddr));
    }

    private static String find(Pattern p, String s) {
        Matcher m = p.matcher(s);
        return m.find() ? m.group(1) : null;
    }
}
