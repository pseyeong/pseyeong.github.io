-- place_spot 재생성: 공유주방(한 호에 지금 영업 중인 가게 3곳 이상)이 있는 층을 뺀다.
-- 주소 쪼개기는 정규식 대신 미리 저장한 building, floor 컬럼을 쓴다 (db/04).
drop materialized view place_spot;

create materialized view place_spot as
with shared as (
  select distinct building, floor
  from store
  where unit is not null and status = '영업/정상'
  group by building, floor, unit
  having count(*) >= 3
),
s as (
  select st.building as base, st.floor as fl, st.status, st.closed_at, st.lat, st.lng
  from store st
  where st.building is not null
    and st.floor is not null
    and st.road_addr !~ '백화점|쇼핑몰|아울렛|지하상가|[가-힣]몰[ ,)]|[가-힣]역[ ,)]'
    and not exists (
      select 1 from shared sh where sh.building = st.building and sh.floor = st.floor
    )
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
group by base, fl
having count(*) >= 3;

create index idx_place_spot_lat_lng on place_spot (lat, lng);

revoke all on place_spot from anon, authenticated;
