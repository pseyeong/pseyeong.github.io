export const currentTrip = {
  id: 'trip-01',
  title: '제주 3박 4일 로드트립',
  period: '2026.07.10 - 2026.07.13',
  badge: 'Day 2',
  summary: '한라산 등반, 제주 감귤 카페, 협재 해변 산책',
  days: [
    { id: 'day-1', label: 'Day 1', place: '한라산', time: '09:00', status: '완료' },
    { id: 'day-2', label: 'Day 2', place: '감귤 카페', time: '11:30', status: '오늘' },
    { id: 'day-3', label: 'Day 3', place: '협재 해변', time: '14:00', status: '예정' },
  ],
};

export const trips = [
  {
    id: 'trip-01',
    title: '제주 3박 4일 로드트립',
    dates: '2026.07.10 - 2026.07.13',
    daysCount: 4,
    summary: '한라산 등반, 감귤 카페, 협재 해변',
  },
  {
    id: 'trip-02',
    title: '강릉 2박 3일 바다 여행',
    dates: '2026.08.05 - 2026.08.07',
    daysCount: 3,
    summary: '경포대 일출, 커피 거리, 주문진 수산시장',
  },
];

export const calendarEvents = [
  { id: 'event-01', date: '2026-07-11', time: '09:30', title: '제주 함덕 해변 산책', type: '여행 일정', tripId: 'trip-01' },
  { id: 'event-02', date: '2026-07-11', time: '12:00', title: '감귤 마을 점심', type: '여행 일정', tripId: 'trip-01' },
  { id: 'event-03', date: '2026-07-11', time: '16:00', title: '개인 미팅', type: '일반 일정' },
];

export const diaryEntries = [
  {
    id: 'diary-01',
    date: '2026-07-11',
    mood: '😊',
    tags: ['감성', '제주', '바다'],
    text: '감귤 카페에서 따뜻한 오후를 보냈어요. 바다 향기가 함께 느껴지는 하루.',
    shared: true,
  },
];

export const companion = {
  name: '유진',
  daysTogether: 42,
  shareScope: '전체 공유',
  inviteCode: 'TRP-93B2',
};
