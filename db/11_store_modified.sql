-- 최종수정시점(LAST_MDFCN_PNT)과 상세영업상태명(DTL_SALS_STTS_NM)을 함께 저장한다.
-- 영업 중인데 인허가 한참 뒤에 수정된 가게에 "정보 변경됨" 배지를 붙이는 데 쓴다.
alter table store
  add column modified_at   timestamp,
  add column detail_status varchar(30);

-- 기존 행 채우기: 두 업종을 처음부터 다시 받도록 시작 시각을 되돌린 뒤 앱을 실행한다.
-- (alter 는 이미 실행했으면 아래 insert 만 선택해서 실행)
insert into sync_state (name, since) values
  ('general_restaurants', '19000101000000'),
  ('rest_cafes',          '19000101000000')
on conflict (name) do update set since = excluded.since, updated_at = now();
