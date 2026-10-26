package com.pseyeong.place;

import java.sql.Date;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class PlaceRepository {

    private static final String SQL = """
            select id, base, fl, n, closed, last_closed_at, lat, lng
            from place_spot
            where lat between ? and ?
              and lng between ? and ?
              and n <= ?
            order by n desc, last_closed_at desc nulls last
            limit ?
            """;

    private static final String STORES_SQL = """
        select name, category, status, opened_at, closed_at
        from store
        where regexp_replace(split_part(road_addr, ',', 1), '\\s*\\(.*$', '') = ?
            and substring(road_addr from '(지하\\s?[0-9]+층|[0-9]+층)') = ?
        order by opened_at nulls last
        """;
    

    private final JdbcTemplate jdbc;

    public PlaceRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<PlaceSpot> findInBounds(double swLat, double swLng, double neLat, double neLng,
                                        int maxCount, int limit) {
        return jdbc.query(SQL, (rs, i) -> {
            Date closedAt = rs.getDate("last_closed_at");
            return new PlaceSpot(
                    rs.getLong("id"),
                    rs.getString("base"),
                    rs.getString("fl"),
                    rs.getInt("n"),
                    rs.getInt("closed"),
                    closedAt == null ? null : closedAt.toLocalDate(),
                    rs.getDouble("lat"),
                    rs.getDouble("lng"));
        }, swLat, neLat, swLng, neLng, maxCount, limit);
    }

    public List<StoreView> findStores(String address, String floor) {
        return jdbc.query(STORES_SQL, (rs, i) -> {
            Date openedAt = rs.getDate("opened_at");
            Date closedAt = rs.getDate("closed_at");
            return new StoreView(
                    rs.getString("name"),
                    rs.getString("category"),
                    rs.getString("status"),
                    openedAt == null ? null : openedAt.toLocalDate(),
                    closedAt == null ? null : closedAt.toLocalDate());
        }, address, floor);
    }

}
