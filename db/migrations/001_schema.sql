-- =====================================================================
-- 001_schema.sql : 테이블, 제약, 인덱스, 단가 재계산 트리거, RLS
-- Supabase 대시보드 > SQL Editor 에서 통째로 실행한다. (여러 번 실행해도 되도록 작성)
--
-- 구조 메모
--  * 서버(Spring)는 DB 소유자 권한으로 직접 연결하므로 RLS를 우회한다.
--    그래서 실제 권한 검사는 서버 코드에서 하고, RLS는 "Supabase 공개 API(anon key)로
--    들어오는 접근"을 막는 안전망이다. 모든 테이블에 RLS를 켜고 정책을 둔다.
--  * profiles.id 는 auth.users 를 참조하지 않는다. 로그인을 Supabase Auth 가 아니라
--    Spring Security(카카오·구글 OAuth2)로 처리하기 때문이다. (5단계)
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. profiles
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
	id                  uuid primary key default gen_random_uuid(),
	nickname            text not null,
	role                text not null default 'user' check (role in ('user', 'admin')),
	provider            text,        -- 'kakao' | 'google' (5단계 소셜 로그인)
	provider_id         text,        -- 소셜 계정 고유 번호. 실명·프로필 사진은 저장하지 않는다.
	nickname_changed_at timestamptz, -- 닉네임 변경 후 30일 제한용
	created_at          timestamptz not null default now(),
	-- 규칙: 2~12자, 한글·영문·숫자만 (공백·특수문자 불가)
	constraint profiles_nickname_format check (nickname ~ '^[가-힣a-zA-Z0-9]{2,12}$'),
	constraint profiles_provider_key unique (provider, provider_id)
);
-- 닉네임 고유: 영문 대소문자는 같은 것으로 취급 (DB 최종 차단)
create unique index if not exists profiles_nickname_lower_key on public.profiles (lower(nickname));

-- ---------------------------------------------------------------------
-- 2. ingredients (재료 가격표)
-- ---------------------------------------------------------------------
create table if not exists public.ingredients (
	id               bigint generated always as identity primary key,
	name             text not null unique,
	aliases          text[] not null default '{}',   -- 별칭: 계란=달걀, 대파=파
	category         text,
	unit             text not null check (unit in ('g', 'ml', '개')),
	unit_price       numeric(10, 2) not null check (unit_price >= 0), -- 기준 단위 1개(1g, 1ml)당 원
	is_basic         boolean not null default false, -- 기본 양념: 재료 검색 매칭에서 제외
	price_updated_at timestamptz not null default now()
);
create index if not exists ingredients_aliases_idx on public.ingredients using gin (aliases);

-- ---------------------------------------------------------------------
-- 3. recipes
-- ---------------------------------------------------------------------
create table if not exists public.recipes (
	id                bigint generated always as identity primary key,
	-- 회원 탈퇴 시 처리(삭제/작성자 표시만 지움)는 7단계에서 결정. 일단 레시피는 남기고 작성자만 비운다.
	author_id         uuid references public.profiles (id) on delete set null,
	title             text not null,
	description       text,
	cover_image       text,
	servings          int not null default 1 check (servings > 0),
	cook_minutes      int not null check (cook_minutes > 0),
	tool              text not null check (tool in ('프라이팬', '냄비', '전자레인지', '에어프라이어', '기타')),
	price_per_serving int not null default 0,        -- 계산값: 트리거가 채운다 (필터·정렬용)
	is_partial_price  boolean not null default false, -- 기타 재료가 섞여 일부 재료 제외
	status            text not null default 'public' check (status in ('public', 'hidden')),
	source            text,                           -- 출처 표기 (공공데이터 등)
	created_at        timestamptz not null default now()
);
create index if not exists recipes_status_created_idx on public.recipes (status, created_at desc);
create index if not exists recipes_price_idx on public.recipes (price_per_serving);
create index if not exists recipes_author_idx on public.recipes (author_id);

-- ---------------------------------------------------------------------
-- 4. recipe_ingredients
-- ---------------------------------------------------------------------
create table if not exists public.recipe_ingredients (
	id             bigint generated always as identity primary key,
	recipe_id      bigint not null references public.recipes (id) on delete cascade,
	ingredient_id  bigint references public.ingredients (id) on delete restrict, -- 기타 재료면 null
	custom_name    text,               -- 기타 재료 이름
	quantity       numeric(10, 2),     -- 기준 단위(g, ml, 개) 사용량. 기타 재료는 null 가능
	display_amount text,               -- 화면에 보일 분량: "1/2대", "1큰술"
	sort_order     int not null default 0,
	constraint recipe_ingredients_one_kind check (ingredient_id is not null or custom_name is not null)
);
create index if not exists recipe_ingredients_recipe_idx on public.recipe_ingredients (recipe_id, sort_order);
create index if not exists recipe_ingredients_ingredient_idx on public.recipe_ingredients (ingredient_id);

-- ---------------------------------------------------------------------
-- 5. recipe_steps
-- ---------------------------------------------------------------------
create table if not exists public.recipe_steps (
	id        bigint generated always as identity primary key,
	recipe_id bigint not null references public.recipes (id) on delete cascade,
	step_no   int not null check (step_no > 0),
	content   text not null,
	image     text,
	constraint recipe_steps_order_key unique (recipe_id, step_no)
);

-- ---------------------------------------------------------------------
-- 6. saves
-- ---------------------------------------------------------------------
create table if not exists public.saves (
	user_id    uuid not null references public.profiles (id) on delete cascade,
	recipe_id  bigint not null references public.recipes (id) on delete cascade,
	created_at timestamptz not null default now(),
	primary key (user_id, recipe_id)
);
create index if not exists saves_recipe_idx on public.saves (recipe_id);

-- ---------------------------------------------------------------------
-- 7. ingredient_substitutes ("A 대신 B", 방향 있음)
-- ---------------------------------------------------------------------
create table if not exists public.ingredient_substitutes (
	id            bigint generated always as identity primary key,
	ingredient_id bigint not null references public.ingredients (id) on delete cascade, -- 원래 재료
	substitute_id bigint not null references public.ingredients (id) on delete cascade, -- 대체 재료
	ratio         numeric(6, 2) not null default 1 check (ratio > 0), -- 원래 재료 1 : 대체 재료 ratio
	tag           text not null check (tag in ('없을 때', '더 싸게', '더 가볍게')),
	note          text,
	constraint substitutes_pair_key unique (ingredient_id, substitute_id),
	constraint substitutes_not_same check (ingredient_id <> substitute_id)
);
create index if not exists substitutes_substitute_idx on public.ingredient_substitutes (substitute_id);

-- =====================================================================
-- 단가 계산
--  1인분 단가 = (재료별 사용량 × 단위당 가격의 합) ÷ 인분 수  (원 단위 반올림)
--  기타 재료(ingredient_id 가 null)는 합계에서 빠지고 is_partial_price 가 true 가 된다.
-- =====================================================================
create or replace function public.recalc_recipe_price(p_recipe_id bigint)
returns void
language plpgsql
as $$
begin
	update public.recipes r
	set price_per_serving = coalesce((
			select round(sum(ri.quantity * i.unit_price) / r.servings)
			from public.recipe_ingredients ri
			join public.ingredients i on i.id = ri.ingredient_id
			where ri.recipe_id = r.id and ri.quantity is not null
		), 0)::int,
		is_partial_price = exists (
			select 1 from public.recipe_ingredients ri
			where ri.recipe_id = r.id and ri.ingredient_id is null
		)
	where r.id = p_recipe_id;
end;
$$;

-- 레시피 재료가 추가·수정·삭제되면 그 레시피만 다시 계산
create or replace function public.trg_recipe_ingredients_recalc()
returns trigger
language plpgsql
as $$
begin
	if tg_op in ('INSERT', 'UPDATE') then
		perform public.recalc_recipe_price(new.recipe_id);
	end if;
	if tg_op = 'DELETE' or (tg_op = 'UPDATE' and old.recipe_id <> new.recipe_id) then
		perform public.recalc_recipe_price(old.recipe_id);
	end if;
	return null;
end;
$$;

drop trigger if exists recipe_ingredients_recalc on public.recipe_ingredients;
create trigger recipe_ingredients_recalc
	after insert or update or delete on public.recipe_ingredients
	for each row execute function public.trg_recipe_ingredients_recalc();

-- 인분 수가 바뀌면 다시 계산 (recalc 는 servings 를 건드리지 않으므로 재귀하지 않는다)
create or replace function public.trg_recipes_servings_recalc()
returns trigger
language plpgsql
as $$
begin
	perform public.recalc_recipe_price(new.id);
	return null;
end;
$$;

drop trigger if exists recipes_servings_recalc on public.recipes;
create trigger recipes_servings_recalc
	after update of servings on public.recipes
	for each row when (old.servings is distinct from new.servings)
	execute function public.trg_recipes_servings_recalc();

-- 재료 단가가 바뀌면 갱신일을 찍고, 그 재료를 쓰는 레시피만 다시 계산
create or replace function public.trg_ingredients_price_touch()
returns trigger
language plpgsql
as $$
begin
	if new.unit_price is distinct from old.unit_price then
		new.price_updated_at := now();
	end if;
	return new;
end;
$$;

drop trigger if exists ingredients_price_touch on public.ingredients;
create trigger ingredients_price_touch
	before update on public.ingredients
	for each row execute function public.trg_ingredients_price_touch();

create or replace function public.trg_ingredients_price_recalc()
returns trigger
language plpgsql
as $$
declare
	rid bigint;
begin
	for rid in
		select distinct recipe_id from public.recipe_ingredients where ingredient_id = new.id
	loop
		perform public.recalc_recipe_price(rid);
	end loop;
	return null;
end;
$$;

drop trigger if exists ingredients_price_recalc on public.ingredients;
create trigger ingredients_price_recalc
	after update of unit_price on public.ingredients
	for each row when (old.unit_price is distinct from new.unit_price)
	execute function public.trg_ingredients_price_recalc();

-- =====================================================================
-- RLS (모든 테이블에 켠다)
--  정책은 Supabase Auth 를 쓰는 경우(auth.uid())를 기준으로 쓴다.
--  Spring 서버는 RLS 를 우회하고, 공개 API(anon)는 아래 정책 범위만 접근한다.
-- =====================================================================
alter table public.profiles               enable row level security;
alter table public.ingredients            enable row level security;
alter table public.recipes                enable row level security;
alter table public.recipe_ingredients     enable row level security;
alter table public.recipe_steps           enable row level security;
alter table public.saves                  enable row level security;
alter table public.ingredient_substitutes enable row level security;

-- 관리자 여부 (정책 안에서 profiles 를 다시 조회하며 생기는 재귀를 피하려고 security definer)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
	select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- profiles: 닉네임은 누구나 읽기, 수정은 본인만, role 은 본인이 바꿀 수 없음
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select using (true);
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update
	using (id = auth.uid()) with check (id = auth.uid());
-- 컬럼 권한: 공개 API 로는 id·nickname·created_at 만 읽고, 닉네임 관련 컬럼만 수정 가능
-- (provider_id, role 은 공개 API 로 읽거나 바꿀 수 없다)
revoke all on public.profiles from anon, authenticated;
grant select (id, nickname, created_at) on public.profiles to anon, authenticated;
grant update (nickname, nickname_changed_at) on public.profiles to authenticated;

-- ingredients, ingredient_substitutes: 누구나 읽기, 쓰기는 관리자만
drop policy if exists ingredients_select on public.ingredients;
create policy ingredients_select on public.ingredients for select using (true);
drop policy if exists ingredients_admin_write on public.ingredients;
create policy ingredients_admin_write on public.ingredients for all
	using (public.is_admin()) with check (public.is_admin());

drop policy if exists substitutes_select on public.ingredient_substitutes;
create policy substitutes_select on public.ingredient_substitutes for select using (true);
drop policy if exists substitutes_admin_write on public.ingredient_substitutes;
create policy substitutes_admin_write on public.ingredient_substitutes for all
	using (public.is_admin()) with check (public.is_admin());

-- recipes: 공개 레시피는 누구나 읽기(숨김은 작성자·관리자만), 쓰기는 본인 것 + 관리자
drop policy if exists recipes_select on public.recipes;
create policy recipes_select on public.recipes for select
	using (status = 'public' or author_id = auth.uid() or public.is_admin());
drop policy if exists recipes_insert on public.recipes;
create policy recipes_insert on public.recipes for insert
	with check (author_id = auth.uid() or public.is_admin());
drop policy if exists recipes_update on public.recipes;
create policy recipes_update on public.recipes for update
	using (author_id = auth.uid() or public.is_admin())
	with check (author_id = auth.uid() or public.is_admin());
drop policy if exists recipes_delete on public.recipes;
create policy recipes_delete on public.recipes for delete
	using (author_id = auth.uid() or public.is_admin());

-- recipe_ingredients, recipe_steps: 부모 레시피를 볼 수 있으면 읽기, 본인 레시피만 쓰기(+관리자)
drop policy if exists recipe_ingredients_select on public.recipe_ingredients;
create policy recipe_ingredients_select on public.recipe_ingredients for select
	using (exists (select 1 from public.recipes r where r.id = recipe_id
		and (r.status = 'public' or r.author_id = auth.uid() or public.is_admin())));
drop policy if exists recipe_ingredients_write on public.recipe_ingredients;
create policy recipe_ingredients_write on public.recipe_ingredients for all
	using (exists (select 1 from public.recipes r where r.id = recipe_id
		and (r.author_id = auth.uid() or public.is_admin())))
	with check (exists (select 1 from public.recipes r where r.id = recipe_id
		and (r.author_id = auth.uid() or public.is_admin())));

drop policy if exists recipe_steps_select on public.recipe_steps;
create policy recipe_steps_select on public.recipe_steps for select
	using (exists (select 1 from public.recipes r where r.id = recipe_id
		and (r.status = 'public' or r.author_id = auth.uid() or public.is_admin())));
drop policy if exists recipe_steps_write on public.recipe_steps;
create policy recipe_steps_write on public.recipe_steps for all
	using (exists (select 1 from public.recipes r where r.id = recipe_id
		and (r.author_id = auth.uid() or public.is_admin())))
	with check (exists (select 1 from public.recipes r where r.id = recipe_id
		and (r.author_id = auth.uid() or public.is_admin())));

-- saves: 본인 것만 읽기·쓰기
drop policy if exists saves_own on public.saves;
create policy saves_own on public.saves for all
	using (user_id = auth.uid()) with check (user_id = auth.uid());
