// src/components/MapArea.tsx
// 지도 영역 — 지금은 플레이스홀더, 나중에 Google Maps로 교체

import type { BucketItem } from '../data/bucketList';

interface MapAreaProps {
  items: BucketItem[];
  selectedItem: BucketItem | null;
  onToggle: (id: number) => void;
  onUpdateMemo: (id: number, memo: string) => void;
}

export default function MapArea({ items, selectedItem, onToggle, onUpdateMemo }: MapAreaProps) {
  return (
    <div style={styles.container}>
      {/* ── 나중에 이 부분을 Google Maps 컴포넌트로 교체합니다 ── */}
      <MapPlaceholder items={items} />

      {/* 선택된 항목 상세 카드 */}
      {selectedItem ? (
        <DetailCard item={selectedItem} onToggle={onToggle} onUpdateMemo={onUpdateMemo} />
      ) : (
        <div style={styles.hint}>← 왼쪽 목록에서 항목을 클릭하세요</div>
      )}
    </div>
  );
}

function MapPlaceholder({ items }: { items: BucketItem[] }) {
  const pinned = items.filter((i) => i.lat !== null);

  return (
    <div style={styles.placeholder}>
      <div style={styles.placeholderInner}>
        <p style={styles.placeholderTitle}>🗺️ Google Maps 연동 예정</p>
        <p style={styles.placeholderSub}>핀이 찍힌 장소: {pinned.length}곳</p>
        <ul style={styles.pinList}>
          {pinned.map((item) => (
            <li key={item.id} style={styles.pinListItem}>
              <span>{item.done ? '✅' : '📍'}</span>
              <span style={{ color: item.done ? '#aaa' : '#374151', textDecoration: item.done ? 'line-through' : 'none' }}>
                {item.title}
              </span>
              <span style={styles.pinCoord}>
                ({item.lat?.toFixed(2)}, {item.lng?.toFixed(2)})
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

interface DetailCardProps {
  item: BucketItem;
  onToggle: (id: number) => void;
  onUpdateMemo: (id: number, memo: string) => void;
}

function DetailCard({ item, onToggle, onUpdateMemo }: DetailCardProps) {
  return (
    <div style={styles.card}>
      <p style={styles.cardEyebrow}>선택한 장소</p>
      <p style={styles.cardTitle}>{item.title}</p>
      <p style={styles.cardSub}>
        {item.category} · {item.done ? `${item.completedAt} 완료` : '미완료'}
      </p>
      <textarea
        style={styles.memo}
        placeholder="메모를 남겨보세요..."
        value={item.memo}
        onChange={(e) => onUpdateMemo(item.id, e.target.value)}
        rows={2}
      />
      <button
        style={{ ...styles.toggleBtn, background: item.done ? '#6b7280' : '#D4537E' }}
        onClick={() => onToggle(item.id)}
      >
        {item.done ? '완료 취소하기' : '✓ 완료로 표시'}
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    flex: 1,
    position: 'relative',
    background: '#e8eef4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderInner: {
    background: 'white',
    borderRadius: 12,
    padding: '24px 32px',
    textAlign: 'center',
    border: '1px solid #e5e7eb',
    maxWidth: 360,
    width: '90%',
  },
  placeholderTitle: {
    fontSize: 16,
    fontWeight: 500,
    color: '#111',
    marginBottom: 4,
  },
  placeholderSub: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 16,
  },
  pinList: {
    listStyle: 'none',
    padding: 0,
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  pinListItem: {
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  pinCoord: {
    fontSize: 11,
    color: '#9ca3af',
    marginLeft: 'auto',
  },
  hint: {
    position: 'absolute',
    bottom: 24,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0,0,0,0.55)',
    color: 'white',
    borderRadius: 99,
    padding: '6px 16px',
    fontSize: 12,
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
  },
  card: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    background: 'white',
    borderRadius: 12,
    padding: '14px 16px',
    width: 220,
    border: '1px solid #e5e7eb',
    fontFamily: 'sans-serif',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  cardEyebrow: {
    fontSize: 10,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 500,
    color: '#111',
  },
  cardSub: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
  },
  memo: {
    padding: '7px 10px',
    borderRadius: 8,
    border: '1px solid #e5e7eb',
    fontSize: 12,
    resize: 'none',
    color: '#374151',
    outline: 'none',
    fontFamily: 'sans-serif',
  },
  toggleBtn: {
    marginTop: 4,
    padding: '7px 0',
    borderRadius: 8,
    border: 'none',
    color: 'white',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
};
