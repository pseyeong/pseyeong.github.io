-- 같은 인허가(관리번호)의 상호가 바뀌면 자동으로 기록한다.
-- 인허가 데이터에는 최종 상호만 남기 때문에, 오늘 이후의 변경은 여기서만 알 수 있다.
create table store_name_log (
  id         bigint generated always as identity primary key,
  store_id   bigint not null references store (id) on delete cascade,
  old_name   varchar(200),
  new_name   varchar(200),
  changed_at timestamp not null   -- 최종수정시점(없으면 기록한 시각, 한국 시간)
);
create index idx_store_name_log_store on store_name_log (store_id);
alter table store_name_log enable row level security;

create or replace function log_store_name_change() returns trigger
language plpgsql
set search_path = public
as $$
begin
  insert into store_name_log (store_id, old_name, new_name, changed_at)
  values (old.id, old.name, new.name, coalesce(new.modified_at, now() at time zone 'Asia/Seoul'));
  return new;
end;
$$;

-- name 이 실제로 달라진 update 에서만 실행 (upsert 의 update 도 여기에 걸린다)
create trigger trg_store_name_change
after update of name on store
for each row
when (old.name is distinct from new.name)
execute function log_store_name_change();
