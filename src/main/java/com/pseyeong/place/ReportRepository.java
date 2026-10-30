package com.pseyeong.place;

import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ReportRepository {

    private static final String INSERT_SQL = """
        insert into place_report (building, floor, unit, actual_name, period_from, period_to, memo, ip_hash)
        values (?, ?, ?, ?, ?, ?, ?, ?)
        """;

    // 지도에 있는 자리인지 (아무 주소나 넣는 제보를 막는다)
    private static final String SPOT_EXISTS_SQL = """
        select exists (select 1 from store where building = ? and floor = ?)
        """;

    // 같은 사람이 같은 자리에 같은 상호를 하루 안에 다시 보냈는지
    private static final String DUPLICATE_SQL = """
        select exists (
            select 1 from place_report
            where ip_hash = ? and building = ? and floor = ? and actual_name = ?
                and created_at > now() - interval '1 day')
        """;

    private static final String APPROVED_SQL = """
        select actual_name, period_from, period_to
        from place_report
        where approved and building = ? and floor = ?
        """;

    private static final String APPROVED_ORDER = " order by period_from nulls last, created_at";

    private final JdbcTemplate jdbc;

    public ReportRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public boolean spotExists(String building, String floor) {
        return Boolean.TRUE.equals(jdbc.queryForObject(SPOT_EXISTS_SQL, Boolean.class, building, floor));
    }

    public boolean isDuplicate(String ipHash, String building, String floor, String actualName) {
        return Boolean.TRUE.equals(jdbc.queryForObject(DUPLICATE_SQL, Boolean.class, ipHash, building, floor, actualName));
    }

    public void insert(PlaceReport.Request r, String ipHash) {
        jdbc.update(INSERT_SQL, r.building(), r.floor(), r.unit(), r.actualName(),
                r.periodFrom(), r.periodTo(), r.memo(), ipHash);
    }

    // 호를 골라서 보는 중이면 그 호의 제보 + 호를 안 적은 제보
    public List<PlaceReport> findApproved(String building, String floor, String unit) {
        boolean byUnit = unit != null && !unit.isBlank();
        String sql = APPROVED_SQL + (byUnit ? " and (unit is null or unit = ?)" : "") + APPROVED_ORDER;
        Object[] args = byUnit ? new Object[] { building, floor, unit } : new Object[] { building, floor };

        return jdbc.query(sql, (rs, i) -> new PlaceReport(
                rs.getString("actual_name"),
                rs.getString("period_from"),
                rs.getString("period_to")), args);
    }
}
