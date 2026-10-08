# 자취한끼 (가칭)

가진 재료로 만들 수 있는 요리를 찾고, 1인분에 얼마 드는지까지 보여주는 자취생 레시피 서비스.
기획·디자인 문서는 [docs/](docs/README.md)에 있습니다.

## 기술 스택

- Spring Boot 4.1 (Java 21, Maven) + Thymeleaf
- Tailwind CSS v3 (npm CLI로 빌드)
- 2단계부터: DB, 5단계부터: 소셜 로그인

> docs의 STEPS.md는 Next.js + Supabase 기준으로 쓰여 있지만, 이 프로젝트는 Spring Boot + Thymeleaf로 구현합니다.

## 처음 실행

필요한 것: JDK 21 이상, Node.js 18 이상

```bash
npm install          # Tailwind 모듈 설치 (처음 한 번)
cp .env.example .env # 환경 변수 파일 (처음 한 번)
npm run dev          # CSS 감시 + 서버 실행을 함께
```

브라우저에서 http://localhost:8080 을 엽니다.

따로 실행하려면 터미널 두 개에서:

```bash
npm run dev:css      # Tailwind 감시 (input.css → app.css)
mvnw spring-boot:run # 서버 (맥/리눅스: ./mvnw spring-boot:run)
```

`local` 프로필에서는 템플릿과 CSS를 `src` 폴더에서 바로 읽어서, HTML·CSS를 고치면 **새로고침만으로** 반영됩니다.
Java 코드를 고치면 devtools가 서버를 자동으로 다시 띄웁니다.

## 배포용 빌드

```bash
npm run build        # CSS 압축 빌드 + jar 생성 (target/hankki-0.0.1-SNAPSHOT.jar)
```

`app.css`는 빌드 결과물이라 저장소에 올리지 않습니다. jar를 만들기 전에 꼭 `npm run build:css`를 실행해야 합니다.

## 폴더 구조

```
src/main/java/com/pseyeong/hankki/
├─ common/web/      모든 화면 공통 (하단 탭, 공통 모델 값)
├─ home/            홈
├─ recipe/          레시피 (서비스, DTO) — 단계마다 기능별 패키지를 추가
└─ page/            아직 만들지 않은 페이지 (단계마다 지워 나감)

src/main/resources/
├─ templates/
│  ├─ layout/base.html     공통 레이아웃 (모바일 폭 가운데 정렬 + 하단 탭)
│  ├─ fragments/ui.html    공통 UI 조각 (아이콘, 칩, 가격, 사진 자리, 레시피 카드 등)
│  ├─ home.html
│  └─ pages/placeholder.html
├─ static/css/input.css    Tailwind 입력 + 색 변수(:root) + 공통 컴포넌트 클래스
├─ application.properties
└─ application-local.properties   로컬 개발용 설정
```

## 디자인 토큰 고치는 곳

| 무엇 | 어디 |
|---|---|
| 색 값 | `static/css/input.css`의 `:root` (`--color-*`) |
| 색 이름·글자 크기·모서리·여백 이름 | `tailwind.config.js` |
| 버튼·칩·구역 같은 공통 클래스 | `static/css/input.css`의 `@layer components` |
| 반복되는 마크업 | `templates/fragments/ui.html` |

색 클래스: `bg-primary`, `bg-primary-soft`, `text-primary-ink`, `text-accent`, `text-accent-strong`,
`text-ink`, `text-ink-sub`, `text-ink-mute`, `bg-page`, `bg-surface`, `bg-photo`, `border-line`, `border-line-soft`

글자 크기는 DESIGN.md의 5단계만 있습니다: `text-display`(36) `text-title`(18) `text-body`(16) `text-sub`(15) `text-caption`(14)

공통 클래스: `.section`(흰 구역) `.btn-primary`(하단 주요 버튼) `.bottom-action`(주요 버튼 고정 바) `.chip` `.chip-active`
`.btn-sm` `.btn-icon` `.input` `.search-bar` `.price` `.price-meta` `.badge` `.photo` `.list-row`
