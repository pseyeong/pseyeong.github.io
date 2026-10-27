package com.pseyeong.place;

import java.sql.Date;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class PlaceRepository {

    private static final String SEARCH_SQL = """
        select name, category, status, road_addr, lat, lng,
               regexp_replace(split_part(road_addr, ',', 1), '\\s*\\(.*$', '') as base,
               substring(road_addr from '(지하\\s?[0-9]+층|[0-9]+층)') as fl
        from store
        where name ilike ?
        order by (name ilike ?) desc, length(name), opened_at desc nulls last
        limit ?
        """;
    
    private static final String SEARCH_PREFIX_SQL = """
        select name, category, status, road_addr, lat, lng,
               regexp_replace(split_part(road_addr, ',', 1), '\\s*\\(.*$', '') as base,
               substring(road_addr from '(지하\\s?[0-9]+층|[0-9]+층)') as fl
        from store
        where name like ?
        order by length(name), opened_at desc nulls last
        limit ?
        """;


    private static final String SQL = """
        select id, base, fl, n, closed, open_n, last_closed_at, lat, lng
        from place_spot
        where lat between ? and ?
            and lng between ? and ?
            and n <= ?
            and open_n <= ?
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
        int maxCount, boolean vacantOnly, int limit) {
        int maxOpen = vacantOnly ? 0 : Integer.MAX_VALUE;
        return jdbc.query(SQL, (rs, i) -> {
            Date closedAt = rs.getDate("last_closed_at");
            return new PlaceSpot(
            rs.getLong("id"),
            rs.getString("base"),
            rs.getString("fl"),
            rs.getInt("n"),
            rs.getInt("closed"),
            rs.getInt("open_n"),
            closedAt == null ? null : closedAt.toLocalDate(),
            rs.getDouble("lat"),
            rs.getDouble("lng"));
        }, swLat, neLat, swLng, neLng, maxCount, maxOpen, limit);
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

    private static String escapeLike(String s) {
        return s.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }

    public List<StoreSearch> searchStores(String query, int limit) {
        String trimmed = query.trim();
        String q = escapeLike(trimmed);
        boolean prefixOnly = trimmed.length() < 3;

        String sql = prefixOnly ? SEARCH_PREFIX_SQL : SEARCH_SQL;
        Object[] args = prefixOnly
                ? new Object[] { q + "%", limit }
                : new Object[] { "%" + q + "%", q + "%", limit };

        return jdbc.query(sql, (rs, i) -> {
            double lat = rs.getDouble("lat");
            boolean noLat = rs.wasNull();
            double lng = rs.getDouble("lng");
            boolean noLng = rs.wasNull();
            return new StoreSearch(
                    rs.getString("name"),
                    rs.getString("category"),
                    rs.getString("status"),
                    rs.getString("base"),
                    rs.getString("fl"),
                    rs.getString("road_addr"),
                    noLat ? null : lat,
                    noLng ? null : lng);
        }, args);
    }


}
