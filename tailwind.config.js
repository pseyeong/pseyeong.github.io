/**
 * 자취한끼 디자인 토큰 (docs/DESIGN.md 기준)
 *
 * - 색 값은 src/main/resources/static/css/input.css 의 :root 변수에서 관리한다.
 *   여기서는 그 변수를 이름으로 연결만 한다. 색을 바꿀 땐 :root 만 고치면 된다.
 * - 글자 크기는 DESIGN.md 의 5단계만 쓰도록 기본 fontSize 를 덮어쓴다.
 *   (text-sm, text-lg 같은 기본 크기는 일부러 없앴다)
 */
const withVar = (name) =>
  `color-mix(in srgb, var(--color-${name}) calc(<alpha-value> * 100%), transparent)`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/main/resources/templates/**/*.html',
    './src/main/resources/static/js/**/*.js',
    './src/main/java/**/*.java',
  ],
  theme: {
    fontFamily: {
      sans: ['GMarketSans', 'sans-serif'],
    },
    fontSize: {
      display: ['36px', { lineHeight: '1.2' }], // 홈 배너, 상세 제목, 1인분 단가, 로그인 문구
      title: '18px', // 화면·구역 제목, 로고
      body: '16px', // 본문, 레시피 제목, 버튼
      sub: '15px', // 칩, 가격, 부가 정보
      caption: '14px', // 설명, 배지, 하단 탭 이름
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: withVar('primary'), // 주요 버튼, 선택된 칩, 배너
          soft: withVar('primary-soft'), // 단가 박스, 대체 재료 카드
          ink: withVar('primary-ink'), // "대체" 버튼 글자
        },
        'on-primary': withVar('on-primary'), // 초록 바탕 위 글자·아이콘 (흰색)
        accent: {
          DEFAULT: withVar('accent'), // 가격, 오류, 로고 "한끼"
          strong: withVar('accent-strong'), // primary-soft 바탕 위 강조 글자
        },
        ink: {
          DEFAULT: withVar('ink'), // 기본 글자
          sub: withVar('ink-sub'), // 설명글
          mute: withVar('ink-mute'), // 비활성 탭
        },
        page: withVar('page'), // 화면 바탕, 입력창·칩 바탕
        surface: withVar('surface'), // 구역 바탕
        photo: withVar('photo'), // 사진 자리
        line: {
          DEFAULT: withVar('line'), // 구역 경계
          soft: withVar('line-soft'), // 목록 줄 구분
        },
      },
      spacing: {
        gutter: 'var(--space-gutter)', // 구역 안쪽 여백 20px
        stack: 'var(--space-stack)', // 구역 사이 간격 8px
        tab: 'var(--size-tab)', // 하단 탭 높이 64px
        touch: 'var(--size-touch)', // 누를 수 있는 최소 크기 44px
        field: 'var(--size-field)', // 입력창 높이 48px
      },
      borderRadius: {
        chip: '16px', // 칩, 작은 버튼
        card: '16px', // 사진, 카드
        thumb: '14px', // 목록 썸네일
        banner: '20px', // 홈 배너, 바로가기 아이콘
        btn: '12px', // 화면 맨 아래 주요 버튼
        field: '12px', // 입력창
        pill: '24px', // 검색창
        badge: '6px',
      },
      maxWidth: {
        app: 'var(--app-max-width)', // 기기별 화면 폭 (430 / 768 / 1024)
      },
    },
  },
  plugins: [],
};
