-- =====================================================================
-- 004_storage_recipe_images.sql  (6단계: 레시피 사진 저장소)
-- 001~003 실행 후에 Supabase SQL Editor 에서 실행한다. 여러 번 실행해도 된다.
--
-- * 버킷 recipe-images: 공개(누구나 주소로 볼 수 있음), 한 장 3MB 이하, JPG·PNG·WEBP 만
-- * 올리기·수정·삭제는 본인 폴더(recipes/{내 id}/...)에만 허용 (Supabase Auth 로 접근하는 경우의 정책)
-- * 우리 서버는 서버용 키(service_role / secret key)로 올리므로 이 정책을 우회한다.
--   그래서 "본인만 올리기"는 서버 코드(ImageUploadController)에서 로그인 회원 id 폴더로만 올려서 지킨다.
--   이 정책은 공개 API(anon key)로 몰래 올리거나 지우는 것을 막는 안전망이다.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('recipe-images', 'recipe-images', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- 누구나 보기
drop policy if exists recipe_images_read on storage.objects;
create policy recipe_images_read on storage.objects
	for select using (bucket_id = 'recipe-images');

-- 본인 폴더에만 올리기·수정·삭제  (경로: recipes/{회원 id}/{파일}  → 폴더 2번째가 회원 id)
drop policy if exists recipe_images_insert_own on storage.objects;
create policy recipe_images_insert_own on storage.objects
	for insert to authenticated
	with check (bucket_id = 'recipe-images' and (storage.foldername(name))[2] = auth.uid()::text);

drop policy if exists recipe_images_update_own on storage.objects;
create policy recipe_images_update_own on storage.objects
	for update to authenticated
	using (bucket_id = 'recipe-images' and (storage.foldername(name))[2] = auth.uid()::text);

drop policy if exists recipe_images_delete_own on storage.objects;
create policy recipe_images_delete_own on storage.objects
	for delete to authenticated
	using (bucket_id = 'recipe-images' and (storage.foldername(name))[2] = auth.uid()::text);

-- 확인용: 버킷이 만들어졌는지 (1줄, public 이 true)
select id, public, file_size_limit, allowed_mime_types from storage.buckets where id = 'recipe-images';
