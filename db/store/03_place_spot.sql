-- 지도에 점으로 찍는 "자리" 집계 뷰: 건물+층별로 가게가 3곳 이상 거쳐간 곳
create materialized view place_spot as
with s as (
  select
    regexp_replace(split_part(road_addr, ',', 1), '\s*\(.*$', '') as base,
    substring(road_addr from '(지하\s?[0-9]+층|[0-9]+층)') as fl,
    status, closed_at, lat, lng
  from store
  where road_addr is not null
    and road_addr !~ '백화점|쇼핑몰|아울렛|지하상가|[가-힣]몰[ ,)]|[가-힣]역[ ,)]'
)
select
  row_number() over (order by base, fl) as id,
  base,
  fl,
  count(*) as n,
  count(*) filter (where status = '폐업') as closed,
  count(*) filter (where status = '영업/정상') as open_n,
  max(closed_at) as last_closed_at,
  avg(lat) as lat,
  avg(lng) as lng
from s
where fl is not null
group by base, fl
having count(*) >= 3;

create index idx_place_spot_lat_lng on place_spot (lat, lng);

revoke all on place_spot from anon, authenticated;

-- 데이터를 다시 적재한 뒤에는 집계를 갱신한다.
-- refresh materialized view place_spot;
