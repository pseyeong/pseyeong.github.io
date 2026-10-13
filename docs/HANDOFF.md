# 작업 인수인계 (다른 기기에서 이어서 작업할 때)

마지막 정리: 7단계 코드 완료. **5·6·7단계의 브라우저 확인은 아직 안 했다** (서버 쪽 동작은 자동 테스트로 확인함).
이 문서와 `docs/STEPS.md`를 읽으면 대화 기록 없이도 이어서 작업할 수 있다.

## 1. 현재 상태

| 단계 | 내용 | 상태 |
|---|---|---|
| 1 | 프로젝트 세팅, 디자인 토큰, 공통 컴포넌트, 홈 | 완료 |
| 2 | Supabase 스키마·초기 데이터 | 완료 (SQL 직접 실행 확인됨) |
| 3 | 레시피 목록·상세 | 완료 (003 SQL 실행 확인됨) |
| 4 | 재료 검색·추천·대체 재료 | 완료 (화면 확인됨) |
| 5 | 카카오·구글 로그인, 랜덤 닉네임, 저장 | **코드 완료, 브라우저에서 실제 로그인 확인 전** |
| 6 | 레시피 작성·수정·삭제, 사진 업로드 | **코드 완료. 004 SQL 실행, 저장소 키 설정, 브라우저 확인 전** |
| 7 | 마이페이지, 닉네임 수정, 로그아웃, 회원 탈퇴 | **코드 완료, 브라우저 확인 전** |
| 8~9 | 관리자, 메타·약관·배포 | 미착수 |

6단계 확인 방법: `db/migrations/004_storage_recipe_images.sql` 실행 → `.env`에 `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` 추가(아래 4번) →
로그인 후 `/recipes/new`에서 사진 올리기, 재료 자동완성(달걀→계란), 예상 단가 변화, 레시피 올리기 → 상세 확인 →
상세의 "수정" 버튼으로 수정·삭제 → 다른 계정으로는 수정 버튼이 없고 주소로 들어가도 403.

7단계 확인 방법: 로그인 후 `/my`(저장한 레시피 탭, 저장·작성 수, 아바타 글자) → "설정" → 닉네임 입력 중 실시간 검사
(규칙·금칙어·중복·대소문자 중복) → 랜덤 뽑기 → 저장(바꾸면 마이페이지에 새 닉네임) → 바로 다시 바꾸면 "30일 뒤" 안내 →
회원 탈퇴(확인 시트) 후 홈으로 이동, 내가 쓴 레시피는 남고 작성자 "익명". 닉네임 30일 제한을 다시 시험하려면 DB에서
`update profiles set nickname_changed_at = null where id = '...'`.

5단계 확인 방법: 서버를 8080 포트로 띄우고 → 비로그인으로 레시피 저장 → 카카오 로그인 → 원래 레시피로 복귀 →
홈 상단에 닉네임 표시 → 저장 후 새로고침해도 "저장됨" 유지 → `/my`에서 로그아웃 → 구글로도 반복.

## 2. 가장 중요한 결정 (docs/STEPS.md와 다른 점)

`docs/STEPS.md`는 Next.js + Supabase 기준이지만, **이 프로젝트는 Spring Boot + Thymeleaf로 구현한다.**

- 서버: Spring Boot 4.1, Java 21, Maven, Thymeleaf, Spring Security(OAuth2 Client)
- CSS: Tailwind v3 (npm CLI로 빌드, `app.css`는 git에 없음)
- DB: **Supabase는 Postgres DB로만 사용**한다. 서버가 JDBC로 직접 연결한다. (Supabase Auth·클라이언트 SDK 미사용)
- 로그인: Supabase Auth가 아니라 **Spring Security로 카카오·구글 직접 처리**. 소셜 계정은 고유 번호만 저장한다.
- 권한: 서버는 DB 소유자 권한으로 접속해 RLS를 우회한다. 작성자 본인·관리자 검사는 **서버 코드에서** 한다.
  RLS는 Supabase 공개 API(anon key)를 막는 안전망으로 모든 테이블에 켜 두었다.
- 읽기 쿼리는 `JdbcClient`(SQL 그대로), JPA는 의존성만 있고 엔티티는 아직 없다.

## 3. 새 기기에서 시작하기

필요: JDK 21 이상, Node.js 18 이상, Git

```bash
git clone https://github.com/pseyeong/pseyeong.github.io.git
cd pseyeong.github.io
npm install
cp .env.example .env     # 아래 4번 값을 채운다
npm run dev              # Tailwind 감시 + 서버 → http://localhost:8080
```

- **반드시 8080 포트**로 실행한다. 카카오·구글에 등록한 로그인 후 주소가 `http://localhost:8080/login/oauth2/code/{kakao|google}` 이다.
- `npm run dev:css`만 따로 켜도 된다. `app.css`가 없으면 화면에 스타일이 없으니 처음에 `npm run build:css`를 한 번 실행한다.
- 맥에서 `./mvnw` 실행 권한 오류가 나면 `chmod +x mvnw`.

## 4. .env (저장소에 올라가지 않는다. 값은 직접 옮겨야 한다)

```
SPRING_PROFILES_ACTIVE=local
DB_URL=jdbc:postgresql://aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require
DB_USERNAME=postgres.<Supabase 프로젝트 ref>
DB_PASSWORD=<Supabase DB 비밀번호>
KAKAO_CLIENT_ID=<카카오 REST API 키>
KAKAO_CLIENT_SECRET=<카카오 클라이언트 시크릿>
GOOGLE_CLIENT_ID=<구글 클라이언트 ID>
GOOGLE_CLIENT_SECRET=<구글 클라이언트 보안 비밀번호>
SUPABASE_URL=https://<Supabase 프로젝트 ref>.supabase.co
SUPABASE_SERVICE_KEY=<Supabase 서버용 키: service_role 또는 secret key>
SUPABASE_BUCKET=recipe-images
```
- `SUPABASE_SERVICE_KEY`는 Storage에 사진을 올리는 서버 전용 키다. 브라우저·템플릿·커밋에 절대 노출하지 않는다. 없으면 사진 업로드만 막히고 나머지는 동작한다.

- 값이 없으면 서버는 뜨지만 DB를 쓰는 화면과 해당 로그인은 실패한다. 빈 값(`DB_URL=`)으로 두면 오류가 난다. 안 쓸 값은 줄 앞에 `#`.
- DB는 Session pooler 주소를 쓴다 (Direct connection은 IPv6 전용).
- 비밀 값은 채팅·커밋에 올리지 않는다. 이 문서에도 값은 적지 않았다.

## 5. 외부 서비스 설정 (이미 완료. 기기가 바뀌어도 다시 할 필요 없음)

- Supabase: 프로젝트 생성, `db/migrations/001~003.sql` 실행 완료. **004(사진 버킷·정책)는 6단계에서 실행 필요.**
  새 SQL이 생기면 SQL Editor에서 번호 순서대로 실행한다.
- 카카오 개발자: 앱 `자취한끼`, 카카오 로그인 ON, Redirect URI `http://localhost:8080/login/oauth2/code/kakao`,
  동의항목은 모두 사용 안 함, 클라이언트 시크릿 사용함.
- 구글 클라우드: 프로젝트 `hankki`, OAuth 동의 화면(외부, 테스트 상태), **테스트 사용자에 본인 이메일 등록**,
  웹 애플리케이션 클라이언트, 리디렉션 URI `http://localhost:8080/login/oauth2/code/google`.
- 배포 주소가 생기면(9단계) 카카오·구글 양쪽에 그 주소의 Redirect URI를 추가해야 한다.

## 6. 코드 구조

```
src/main/java/com/pseyeong/hankki/
├─ auth/      Spring Security 설정, 로그인 성공 처리, 로그인 후 복귀 주소(SafeRedirect)
├─ member/    회원 가입, 랜덤 닉네임, 닉네임 규칙·변경, 마이페이지, 탈퇴, LoginUser(세션에 담기는 값)
├─ recipe/    목록·상세·저장·모음 페이지, 필터·정렬, 대체 재료 차액 계산, 작성·수정·삭제(RecipeForm/WriteService/ApiController)
├─ storage/   Supabase Storage 사진 업로드(SupabaseStorage, ImageUploadController)
├─ search/    재료 검색 결과 계산 (일치순, 부족한 재료, 대체 재료 묶음)
├─ ingredient/ 재료 조회, 자동완성 API(/api/ingredients/suggest)
├─ home/      홈 화면, 바로가기
├─ page/      아직 만들지 않은 사이트맵 페이지(빈 화면). 단계마다 지워 나간다
└─ common/web/ 공통 모델 값(하단 탭, 현재 경로, 로그인 사용자)

src/main/resources/
├─ templates/{layout,fragments,home,recipe,search,auth,error,pages}
├─ static/css/input.css   색 변수(:root) + 공통 컴포넌트 클래스
├─ static/js/             자동완성, 아래에서 올라오는 시트
db/migrations/            001 스키마 · 002 초기 데이터 · 003 포장 단위·단가 규칙 · 004 사진 버킷·정책
```

디자인 토큰: 색은 `input.css`의 `:root`, 이름·글자 크기·모서리는 `tailwind.config.js`, 공통 마크업은 `templates/fragments/ui.html`.
자세한 사용법은 루트 `README.md`.

## 7. 알아 둘 규칙과 결정

- 단가: 1인분 단가 = (사용량 × 단위가격 합) ÷ 인분 수. **기본 양념(is_basic)은 단가에서 제외**한다 (003).
  DB 트리거가 재료 가격·레시피 재료·인분 수가 바뀔 때 자동으로 다시 계산한다.
- 장보기 비용은 `ingredients.pack_size`(예시 값) 단위로 올림해서 계산한다. 가격·포장 값은 모두 예시이므로 운영 전 실제 값으로 교체.
- 초록 배경 위 글자·아이콘은 **흰색**(`text-on-primary`). DESIGN.md의 "검정" 규칙과 다르게 사용자가 정했다.
- 색 토큰은 사용자가 hex 형식으로 직접 바꿨다 (`input.css`의 `--color-*`, `primary-soft`는 `#E5E7EB`).
- 화면 폭은 기기별로 달라진다 (폰 430 / 태블릿 768 / PC 1024, `--app-max-width`). 사용자가 추가했다.
- 홈의 "만원 3끼" 바로가기와 배너는 `/recipes?price=3000`으로 연결했다 (필터에 "만원 3끼"가 없어서).
- "대체로 가능" 묶음은 부족한 재료를 **전부** 대체 재료로 메울 수 있을 때만 만든다.
- 목록은 페이지 나누기가 없다 (수십 개 수준 가정).
- 사진: 브라우저가 긴 변 1280px JPEG로 줄여 `/api/uploads/images`로 올리고, 서버가 파일 내용(매직 바이트)으로 종류를 검사해
  Supabase Storage(`recipes/{회원id}/{uuid}.jpg`)에 올린다. DB에는 공개 주소만 저장한다.
  저장 시 사진 주소는 "우리 저장소에 내가 올린 것(또는 이 레시피가 원래 쓰던 것)"만 허용하고, 수정·삭제로 빠진 사진은 다른 레시피가 쓰지 않을 때만 지운다.
- 작성·수정은 화면의 JS가 JSON으로 `/api/recipes`에 보낸다 (CSRF 토큰은 meta 태그). `/api/**` 비로그인은 401, 화면은 `/login` 이동.
- 작성 중 임시저장은 새 레시피에서만 localStorage(`hankki:recipe-draft:new`)에 한다.
- **회원 탈퇴(사용자가 정함)**: 레시피는 남기고 작성자만 비운다 (`on delete set null`, 화면에는 "익명"). 저장 목록은 함께 삭제된다.
  카카오·구글 쪽 연결 해제는 하지 않는다 (사용자가 각 서비스 설정에서 해제). 같은 계정으로 다시 가입하면 새 회원·새 닉네임이다.
  작성자가 비워진 레시피는 관리자만 수정할 수 있다.
- `/admin/**`은 5단계에서 이미 관리자만 접근하도록 막아 두었다. 관리자 역할은 DB `profiles.role`을 직접 바꿔 지정한다 (8단계).
- `/my`는 `/my/saved`로 이동한다 (저장한 레시피 탭 / `/my/recipes`는 내가 쓴 레시피 탭, 숨김 레시피 포함).
- 닉네임: DB 규칙(2~12자 한글·영문·숫자, 대소문자 무시 고유) + `NicknamePolicy`의 금칙어(욕설, "관리자·운영자·공식·자취한끼" 같은 운영 사칭).
  처음 받은 랜덤 닉네임은 "변경"이 아니라서 바로 한 번 바꿀 수 있고, 바꾸면 30일 동안 다시 못 바꾼다 (`nickname_changed_at`).
  입력 중 검사(`/api/me/nickname/check`)와 저장(PUT)이 같은 규칙을 쓰고, 마지막은 DB 고유 제약이 막는다. 바꾸면 세션의 닉네임도 같이 갱신한다 (`LoginSession`).

## 8. 남은 일

- 5단계 확인 후: 막히면 터미널 로그의 OAuth 오류 줄을 확인한다 (키는 가려서 공유).
- 6단계 확인 후: 사진 올리기를 브라우저에서 확인한다 (사진 업로드는 아직 실제 Supabase 저장소로 시험하지 못했다. 작성·수정·삭제·권한·검증은 자동 테스트로 확인함).
  아직 안 한 것: 새 회원이 쓴 레시피 수 제한·업로드 횟수 제한(남용 방지), 임시저장 중 올린 사진이 버려질 때의 정리.
- 8단계 관리자, 9단계 메타·sitemap·약관·배포.
- 배포: 저장소 이름이 `pseyeong.github.io`이지만 GitHub Pages는 정적 파일만 올릴 수 있어 Spring Boot 서버를 띄울 수 없다.
  서버 호스팅(Railway, Render, Fly.io 등)을 9단계 전에 정해야 한다.
- 웹훅(카카오 연결 해제 알림)은 지금 불필요. 배포 후 필요 여부를 다시 본다.

## 9. 새 대화를 시작할 때 처음 입력할 말

```
docs/HANDOFF.md와 docs/STEPS.md를 읽고 현재 상태를 파악해줘.
5·6·7단계 확인 결과는 [여기에 결과]야. 이어서 8단계를 진행해줘.
앞에서 하던 것처럼 직접 해야 하는 일은 하나씩 안내해주면서 같이 진행하자.
```
