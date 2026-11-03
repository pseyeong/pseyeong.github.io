-- 세부 업종 -> 칩 그룹. 여기에 없는 업종(기타, null, 새 값 등)은 'other' 로 본다.
-- 'exclude' 는 시설 안 매대나 이동 영업이라 지도 자리 집계에서 뺀다.
create table category_group (
  category varchar(100) primary key,
  grp      varchar(20)  not null
);
alter table category_group enable row level security;

insert into category_group (category, grp) values
  ('커피숍', 'cafe'), ('까페', 'cafe'), ('다방', 'cafe'), ('전통찻집', 'cafe'),
  ('떡카페', 'cafe'), ('아이스크림', 'cafe'), ('과자점', 'cafe'), ('제과점영업', 'cafe'),

  ('한식', 'korean'), ('식육(숯불구이)', 'korean'), ('냉면집', 'korean'),
  ('탕류(보신용)', 'korean'), ('횟집', 'korean'), ('복어취급', 'korean'),

  ('분식', 'snack'), ('김밥(도시락)', 'snack'), ('일반조리판매', 'snack'),

  ('일식', 'japanese'),
  ('중국식', 'chinese'),

  ('경양식', 'western'), ('외국음식전문점(인도,태국등)', 'western'),
  ('패밀리레스트랑', 'western'), ('뷔페식', 'western'),

  ('호프/통닭', 'chicken'), ('통닭(치킨)', 'chicken'),

  ('정종/대포집/소주방', 'bar'), ('감성주점', 'bar'), ('라이브카페', 'bar'),

  ('패스트푸드', 'fastfood'),

  ('백화점', 'exclude'), ('철도역구내', 'exclude'), ('공항', 'exclude'), ('고속도로', 'exclude'),
  ('극장', 'exclude'), ('관광호텔', 'exclude'), ('유원지', 'exclude'),
  ('푸드트럭', 'exclude'), ('출장조리', 'exclude'), ('이동조리', 'exclude'),
  ('식품등 수입판매업', 'exclude');


-- place_spot 다시 만들기: 08 과 같고, 업종 조인 + exclude 제외 + 마지막 가게의 grp 컬럼만 추가
drop materialized view place_spot;
create materialized view place_spot as
with shared as (
  select distinct st.building, st.floor from store st
  cross join lateral unnest(st.units) as u(unit)
  where st.status = '영업/정상'
  group by st.building, st.floor, u.unit having count(*) >= 3
),
s as (
  select st.building as base, st.floor as fl, st.status, st.opened_at, st.closed_at, st.lat, st.lng,
         coalesce(cg.grp, 'other') as grp
  from store st
  left join category_group cg on cg.category = st.category
  where st.building is not null and st.floor is not null
    and st.road_addr !~ '백화점|쇼핑몰|아울렛|지하상가|[가-힣]몰[ ,)]|[가-힣]역[ ,)]'
    and coalesce(cg.grp, 'other') <> 'exclude'
    and not exists (select 1 from shared sh where sh.building = st.building and sh.floor = st.floor)
)
select row_number() over (order by base, fl) as id, base, fl, count(*) as n,
  count(*) filter (where status = '폐업') as closed,
  count(*) filter (where status = '영업/정상') as open_n,
  max(closed_at) as last_closed_at, avg(lat) as lat, avg(lng) as lng,
  -- 마지막 가게 = 개업일이 가장 늦은 가게 (같으면 아직 영업 중인 쪽)
  (array_agg(grp order by opened_at desc nulls last, closed_at desc nulls first))[1] as grp
from s group by base, fl having count(*) >= 3;

create index idx_place_spot_lat_lng on place_spot (lat, lng);
revoke all on place_spot from anon, authenticated;
