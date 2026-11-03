-- 가게 원본 테이블: 공공데이터 CSV를 Java(StoreImporter)로 적재한다.
create table store (
    id            bigint generated always as identity primary key,
    mgmt_no       varchar(50)  not null unique,   -- 원본 관리번호 (중복 적재 방지)
    license_type  varchar(20)  not null default '일반음식점', -- 데이터셋 구분
    name          varchar(200) not null,          -- 사업장명
    category      varchar(50),                    -- 업태구분명 (한식, 일식 ...)
    status        varchar(20)  not null,          -- 영업상태명 (영업/정상, 폐업)
    opened_at     date,                           -- 인허가일자
    closed_at     date,                           -- 폐업일자
    road_addr     varchar(300),                   -- 도로명주소
    jibun_addr    varchar(300),                   -- 지번주소
    lat           double precision,               -- 위도 (TM에서 변환)
    lng           double precision                -- 경도 (TM에서 변환)
);

create index idx_store_jibun on store (jibun_addr);
create index idx_store_lat_lng on store (lat, lng);

alter table store enable row level security;
