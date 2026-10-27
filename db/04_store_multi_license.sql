-- 1) 업종이 달라도 관리번호가 겹칠 수 있어 (업종, 관리번호)를 고유키로 쓴다.
alter table store drop constraint store_mgmt_no_key;
alter table store add constraint store_license_mgmt_key unique (license_type, mgmt_no);

-- 2) 주소를 미리 쪼개 저장할 컬럼 (조회 때마다 정규식을 돌리지 않으려고)
alter table store
    add column building varchar(300),   -- 건물 주소 (도로명, 첫 쉼표 앞 · 괄호 이전)
    add column floor    varchar(20),    -- 층 ('1층', '지하1층' 등)
    add column unit     varchar(20);    -- 호 ('101호'), 없으면 null

-- 3) 기존 행 채우기: building, floor는 지금 쿼리와 같은 식이라 결과가 달라지지 않는다.
update store set
    building = regexp_replace(split_part(road_addr, ',', 1), '\s*\(.*$', ''),
    floor    = substring(road_addr from '(지하\s?[0-9]+층|[0-9]+층)'),
    unit     = substring(road_addr from '([0-9]+호)')
where road_addr is not null;

-- 4) 건물+층 조회용 인덱스
create index idx_store_building_floor on store (building, floor);
