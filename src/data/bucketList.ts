// src/data/bucketList.ts
// 버킷리스트 타입 정의 + 샘플 데이터

export type Category = '국내' | '해외';

export interface BucketItem {
  id: number;
  title: string;
  category: Category;
  done: boolean;
  completedAt: string | null;
  lat: number | null;
  lng: number | null;
  memo: string;
}

export const CATEGORIES = {
  DOMESTIC: '국내' as Category,
  OVERSEAS: '해외' as Category,
};

export const initialBucketList: BucketItem[] = [
  {
    id: 1,
    title: '제주도 한달살기',
    category: CATEGORIES.DOMESTIC,
    done: true,
    completedAt: '2024년 5월',
    lat: 33.4996,
    lng: 126.5312,
    memo: '협재 해변 근처 숙소 최고였다 🌊',
  },
  {
    id: 2,
    title: '경복궁 야간 개장',
    category: CATEGORIES.DOMESTIC,
    done: true,
    completedAt: '2024년 10월',
    lat: 37.5796,
    lng: 126.977,
    memo: '',
  },
  {
    id: 3,
    title: '부산 해운대 일출 보기',
    category: CATEGORIES.DOMESTIC,
    done: false,
    completedAt: null,
    lat: null,
    lng: null,
    memo: '',
  },
  {
    id: 4,
    title: '오사카 도톤보리 야경',
    category: CATEGORIES.OVERSEAS,
    done: true,
    completedAt: '2024년 11월',
    lat: 34.6687,
    lng: 135.5013,
    memo: '타코야키 10개 먹음 🐙',
  },
  {
    id: 5,
    title: '파리 에펠탑 야경 보기',
    category: CATEGORIES.OVERSEAS,
    done: false,
    completedAt: null,
    lat: 48.8584,
    lng: 2.2945,
    memo: '',
  },
  {
    id: 6,
    title: '발리 우붓 라이스테라스',
    category: CATEGORIES.OVERSEAS,
    done: false,
    completedAt: null,
    lat: -8.5069,
    lng: 115.2625,
    memo: '',
  },
  {
    id: 7,
    title: '산토리니 선셋 크루즈',
    category: CATEGORIES.OVERSEAS,
    done: false,
    completedAt: null,
    lat: 36.4618,
    lng: 25.3753,
    memo: '',
  },
  {
    id: 8,
    title: '뉴욕 타임스퀘어 새해',
    category: CATEGORIES.OVERSEAS,
    done: false,
    completedAt: null,
    lat: null,
    lng: null,
    memo: '',
  },
];
