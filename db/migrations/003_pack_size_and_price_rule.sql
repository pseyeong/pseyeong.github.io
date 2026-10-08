-- =====================================================================
-- 003_pack_size_and_price_rule.sql  (3단계: 레시피 상세 화면용)
-- 001, 002 실행 후에 실행한다. 여러 번 실행해도 된다.
--
-- 1) ingredients.pack_size : 마트에서 파는 한 포장의 크기 (기준 단위 g/ml/개)
--    "처음 장볼 때 드는 비용(남는 재료 포함)" 계산에 쓴다.
--    비어 있으면 사용량만큼만 산다고 보고 계산한다.
-- 2) 단가 계산에서 기본 양념(is_basic)을 뺀다.
--    상세 화면은 기본 양념을 금액 없이 이름만 보여주므로, 1인분 단가가
--    화면에 보이는 재료별 금액의 합과 맞아야 한다.
--
-- ※ pack_size 값은 모두 "예시 값"이다. 실제 판매 단위에 맞게 나중에 고친다.
-- =====================================================================

alter table public.ingredients
	add column if not exists pack_size numeric(10, 2) check (pack_size > 0);

update public.ingredients i
set pack_size = v.size
from (values
	('계란', 10), ('대파', 200), ('쪽파', 200), ('양파', 1000), ('감자', 1000),
	('당근', 500), ('마늘', 100), ('콩나물', 300), ('애호박', 1), ('양송이버섯', 200),
	('표고버섯', 150), ('김치', 500), ('두부', 1), ('참치캔', 1), ('햄', 200),
	('어묵', 200), ('치즈', 10), ('돼지고기', 300), ('닭가슴살', 300), ('밥', 1),
	('떡', 500), ('소금', 500), ('설탕', 1000), ('알룰로스', 700), ('올리고당', 700),
	('간장', 500), ('고추장', 500), ('고춧가루', 200), ('식용유', 900), ('참기름', 160)
) as v(name, size)
where i.name = v.name and i.pack_size is null;

-- 단가 계산: 기본 양념 제외
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
			where ri.recipe_id = r.id and ri.quantity is not null and not i.is_basic
		), 0)::int,
		is_partial_price = exists (
			select 1 from public.recipe_ingredients ri
			where ri.recipe_id = r.id and ri.ingredient_id is null
		)
	where r.id = p_recipe_id;
end;
$$;

-- 기존 레시피 전체 다시 계산
select public.recalc_recipe_price(id) from public.recipes;

-- 확인용: 기본 양념이 빠진 새 단가 (6줄)
select id, title, price_per_serving, is_partial_price from public.recipes order by id;
