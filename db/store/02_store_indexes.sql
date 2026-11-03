-- 같은 자리(건물+층)로 가게 목록을 찾는 조회(/api/places/stores)용
create index idx_store_spot on store (
    (regexp_replace(split_part(road_addr, ',', 1), '\s*\(.*$', '')),
    (substring(road_addr from '(지하\s?[0-9]+층|[0-9]+층)'))
);

-- 가게 이름 검색(/api/search)용: 3글자 이상은 부분 일치(trigram), 1~2글자는 앞부분 일치
create extension if not exists pg_trgm;
create index idx_store_name_trgm on store using gin (name gin_trgm_ops);
create index idx_store_name_prefix on store (name text_pattern_ops);
