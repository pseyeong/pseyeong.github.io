-- 사용자 제보: 자리(건물+층+호)의 실제 상호와 대략적인 기간. 승인된 것만 화면에 나간다.
create table place_report (
  id          bigint generated always as identity primary key,
  building    varchar(300) not null,
  floor       varchar(20)  not null,
  unit        varchar(20),                         -- 호실을 골라서 본 경우만
  actual_name varchar(100) not null,
  period_from varchar(7),                          -- 'YYYY-MM'
  period_to   varchar(7),                          -- 'YYYY-MM', 비우면 지금까지
  memo        varchar(500),
  ip_hash     varchar(64)  not null,               -- IP 원본 대신 해시만 (중복/스팸 확인용)
  approved    boolean      not null default false, -- Table Editor 에서 체크하면 노출
  created_at  timestamptz  not null default now()
);

-- 상세 조회 때 자리별 승인 제보를 찾는 용도
create index idx_place_report_spot on place_report (building, floor) where approved;

-- 외부(Supabase REST API) 접근 차단. 우리 서버(postgres 계정)는 그대로 사용 가능
alter table place_report enable row level security;
