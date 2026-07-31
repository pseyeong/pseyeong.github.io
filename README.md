# pseyeong.github.io backend

Spring Boot + Thymeleaf + Tailwind CSS (npm 기반). 정적 사이트 리소스(`assets/`, `index.html`)와 같은 루트에 위치합니다.

## 최초 1회

```powershell
npm install
```

## 실행

```powershell
# 1) Tailwind CSS 감시 빌드 (파일 저장 시 자동 반영)
npm run watch

# 2) 다른 터미널에서 Spring Boot 실행
.\mvnw.cmd spring-boot:run
```

http://localhost:8080 에서 확인.

## 배포 전 최종 빌드 (압축)

```powershell
npm run build
```

## 구조

- `src/main/java/com/pseyeong/blog` — 컨트롤러 등 Java 소스
- `src/main/resources/templates` — Thymeleaf 템플릿 (`.html`)
- `src/main/resources/static/css/output.css` — Tailwind 빌드 결과물 (gitignore 처리, `npm run watch`/`build` 시 생성)
- `src/main/tailwind/input.css` — Tailwind 진입점 (`@source`로 템플릿 경로 스캔)
- `package.json` — `tailwindcss`, `@tailwindcss/cli` devDependency + `watch`/`build` 스크립트
