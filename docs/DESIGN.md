# 디자인 기준

`design/mobile/`의 화면 9개가 최종 디자인입니다. 아래 기준과 화면이 다르면 화면 파일의 수치를 따릅니다.

## 색

| 역할 | 값 | 쓰이는 곳 |
|---|---|---|
| 주 색상 | `#16A34A` | 주요 버튼, 선택된 칩, 홈 배너, 단계 번호, 배지, 로그인 배경, 입력창 포커스 테두리 |
| 서브 색상 | `#F0FDF4` | 단가 박스, 대체 재료 카드, 자동완성 선택 줄, "대체" 버튼 바탕 |
| 강조 | `#DC2626` | 가격, 대체 재료 차액(+, - 모두), 오류 문구, 회원 탈퇴, 로고의 "한끼" |
| 강조(연한 바탕 위) | `#B91C1C` | `#F0FDF4` 바탕 위의 가격·강조 글자 |
| 진한 초록 글자 | `#166534` | "대체" 버튼 글자 |
| 글자 | `#1C1917` | 기본 글자, 주 색상 위 글자 |
| 보조 글자 | `#57534E` | 설명글, 부가 정보 |
| 비활성 탭 | `#78716C` | 선택 안 된 하단 탭 |
| 화면 바탕 | `#F5F5F4` | 페이지 바탕, 입력창·칩 바탕 |
| 구역 바탕 | `#FFFFFF` | 내용 구역 |
| 사진 자리 | `#E7E5E4` | 사진이 없을 때 |
| 선 | `#E7E5E4`, `#F5F5F4` | 구역 경계, 목록 줄 구분 |

- 주 색상 `#16A34A` 위의 글자는 **검정(`#1C1917`)**입니다. 흰 글자는 16px에서 대비가 부족합니다.

## 글꼴

- `font-family: 'GMarketSans', sans-serif`
- 웹폰트 (굵기 3종):

```css
@font-face {
  font-family: 'GMarketSans';
  font-weight: 300;
  font-display: swap;
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/GmarketSansLight.woff') format('woff');
}
@font-face {
  font-family: 'GMarketSans';
  font-weight: 500;
  font-display: swap;
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/GmarketSansMedium.woff') format('woff');
}
@font-face {
  font-family: 'GMarketSans';
  font-weight: 700;
  font-display: swap;
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/GmarketSansBold.woff') format('woff');
}
```

### 굵기

| 쓰임 | 굵기 |
|---|---|
| 본문, 설명글, 선택 안 된 칩·탭 | Light 300 |
| 제목, 가격, 버튼, 선택된 칩·탭, 강조 | Medium 500 |
| Bold 700 | 현재 쓰지 않음 |

### 글자 크기 (이 다섯 단계만 사용)

| 단계 | 크기 | 쓰이는 곳 |
|---|---|---|
| 가장 큰 글자 | 36px | 홈 배너 문구, 레시피 상세 제목, 1인분 단가, 로그인 문구 |
| 타이틀 | 18px | 화면 제목, 구역 제목, 로고 |
| 기본 텍스트 | 16px | 본문, 레시피 제목, 버튼 |
| 서브 텍스트 | 15px | 칩, 가격, 부가 정보 |
| 추가 설명글 | 14px | 설명, 배지, 하단 탭 이름 |

## 버튼

- **칩과 작은 버튼**: `padding: 4px 12px`, `line-height: 24px`, 둥근 모서리 16px
- **화면 맨 아래 주요 버튼** (레시피 저장, 레시피 올리기, 닉네임 저장, 로그인): 가로를 꽉 채우고 `padding: 12px`, 둥근 모서리 12px
- 선택된 칩: 바탕 `#16A34A`, 굵기 500 / 선택 안 된 칩: 흰 바탕, 테두리 `#E7E5E4`, 굵기 300

## 화면 구성 규칙

- 화면 바탕은 `#F5F5F4`, 그 위에 흰 구역을 **8px 간격**으로 쌓는다. 구역 안쪽 여백은 20px.
- 테두리 선은 최소로 쓴다. 목록 줄 구분은 `1px solid #F5F5F4`.
- 둥근 모서리: 사진·카드 16px, 입력창 12px, 검색창 24px(알약 모양), 배지 6px
- 입력창: 바탕 `#F5F5F4`, 테두리 없음, 높이 48px
- 가격 표기: "약 2,150원" 형태, 색 `#DC2626`, 굵기 500. 뒤에 " · 15분"처럼 부가 정보를 `#57534E` 14px로 붙인다.
- 하단 탭: 높이 64px, 4칸(홈·검색·작성·마이), 현재 탭은 `#1C1917` 굵기 500
- 누를 수 있는 아이콘 버튼은 44px 이상
- 아이콘: 선으로 그린 SVG (stroke 2px 안팎). 이모지는 쓰지 않는다.
- 기준 화면 폭은 390px. PC에서 열면 가운데에 모바일 폭으로 보여준다 (관리자 페이지 제외).

## 관리자 화면

- `design/admin/`의 HTML은 **구성만 참고**한다. 그 파일의 초록색·글꼴은 이전 시안이라, 색과 글꼴은 이 문서 기준으로 바꿔서 구현한다.
- PC 화면 기준. 왼쪽 메뉴 + 오른쪽 내용, 표 위주. 좁은 화면에서는 메뉴가 위로 올라가고 표는 가로 스크롤.

## 화면 파일 목록

| 파일 | 화면 | 경로 |
|---|---|---|
| `mobile/D1Home.dc.html` | 홈 | `/` |
| `mobile/D2Search.dc.html` | 재료 검색 결과 | `/search` |
| `mobile/D3Recipes.dc.html` | 레시피 목록 | `/recipes` |
| `mobile/D4Detail.dc.html` | 레시피 상세 | `/recipes/[id]` |
| `mobile/D5Substitute.dc.html` | 대체 재료 시트 | 상세 화면 위 |
| `mobile/D6Write.dc.html` | 레시피 작성 | `/recipes/new` |
| `mobile/D7My.dc.html` | 마이 | `/my` |
| `mobile/D8Login.dc.html` | 로그인 | `/login` |
| `mobile/D9Nickname.dc.html` | 설정·닉네임 수정 | `/my/settings` |
| `admin/Admin.dc.html` | 관리자 요약 | `/admin` |
| `admin/AdminRecipes.dc.html` | 레시피 관리 | `/admin/recipes` |
| `admin/AdminRecipeNew.dc.html` | 레시피 등록 (PC) | `/admin/recipes/new` |
| `admin/AdminIngredients.dc.html` | 재료 가격표 | `/admin/ingredients` |
| `admin/AdminSubstitutes.dc.html` | 대체 재료 관리 | `/admin/substitutes` |
| `admin/AdminPending.dc.html` | 기타 재료 후보 | `/admin/pending` |
