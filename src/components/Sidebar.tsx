// src/components/Sidebar.tsx

import { useState } from 'react';
import type { BucketItem, Category } from '../data/bucketList';
import { CATEGORIES } from '../data/bucketList';

interface SidebarProps {
  items: BucketItem[];
  selectedId: number | null;
  stats: { total: number; done: number; percent: number };
  onSelect: (id: number) => void;
  onToggle: (id: number) => void;
  onAdd: (title: string, category: Category) => void;
}

export default function Sidebar({ items, selectedId, stats, onSelect, onToggle, onAdd }: SidebarProps) {
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<Category>(CATEGORIES.DOMESTIC);

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    onAdd(newTitle.trim(), newCategory);
    setNewTitle('');
    setNewCategory(CATEGORIES.DOMESTIC);
    setShowForm(false);
  };

  const domestic = items.filter((i) => i.category === CATEGORIES.DOMESTIC);
  const overseas = items.filter((i) => i.category === CATEGORIES.OVERSEAS);

  return (
    <aside style={styles.sidebar}>
      {/* 진행률 */}
      <div style={styles.header}>
        <p style={styles.sectionLabel}>진행 현황</p>
        <div style={styles.progressBg}>
          <div style={{ ...styles.progressFill, width: `${stats.percent}%` }} />
        </div>
        <div style={styles.progressMeta}>
          <span>{stats.done} / {stats.total} 완료</span>
          <span>{stats.percent}%</span>
        </div>
      </div>

      {/* 추가 폼 */}
      {showForm ? (
        <div style={styles.addForm}>
          <input
            style={styles.input}
            placeholder="버킷리스트 항목"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            autoFocus
          />
          <select
            style={styles.select}
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as Category)}
          >
            <option value={CATEGORIES.DOMESTIC}>국내</option>
            <option value={CATEGORIES.OVERSEAS}>해외</option>
          </select>
          <div style={styles.addActions}>
            <button style={styles.cancelBtn} onClick={() => setShowForm(false)}>취소</button>
            <button style={styles.confirmBtn} onClick={handleAdd}>추가</button>
          </div>
        </div>
      ) : (
        <button style={styles.addBtn} onClick={() => setShowForm(true)}>
          + 새 항목 추가
        </button>
      )}

      {/* 목록 */}
      <div style={styles.list}>
        <CategorySection label="국내" items={domestic} selectedId={selectedId} onSelect={onSelect} onToggle={onToggle} />
        <CategorySection label="해외" items={overseas} selectedId={selectedId} onSelect={onSelect} onToggle={onToggle} />
      </div>
    </aside>
  );
}

interface CategorySectionProps {
  label: string;
  items: BucketItem[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onToggle: (id: number) => void;
}

function CategorySection({ label, items, selectedId, onSelect, onToggle }: CategorySectionProps) {
  return (
    <>
      <p style={styles.categoryLabel}>{label}</p>
      {items.map((item) => (
        <BucketItemRow
          key={item.id}
          item={item}
          isSelected={item.id === selectedId}
          onSelect={onSelect}
          onToggle={onToggle}
        />
      ))}
    </>
  );
}

interface BucketItemRowProps {
  item: BucketItem;
  isSelected: boolean;
  onSelect: (id: number) => void;
  onToggle: (id: number) => void;
}

function BucketItemRow({ item, isSelected, onSelect, onToggle }: BucketItemRowProps) {
  return (
    <div
      style={{
        ...styles.item,
        background: isSelected ? '#fdf2f6' : 'transparent',
        borderLeft: isSelected ? '3px solid #D4537E' : '3px solid transparent',
      }}
      onClick={() => onSelect(item.id)}
    >
      <button
        style={{
          ...styles.checkBox,
          background: item.done ? '#D4537E' : 'transparent',
          borderColor: item.done ? '#D4537E' : '#ccc',
        }}
        onClick={(e) => { e.stopPropagation(); onToggle(item.id); }}
        aria-label={item.done ? '완료 취소' : '완료 표시'}
      >
        {item.done && <span style={{ color: 'white', fontSize: 10 }}>✓</span>}
      </button>

      <div style={styles.itemBody}>
        <p style={{
          ...styles.itemTitle,
          textDecoration: item.done ? 'line-through' : 'none',
          color: item.done ? '#aaa' : '#111',
        }}>
          {item.title}
        </p>
        <p style={styles.itemMeta}>
          {item.done ? `${item.completedAt} 완료` : item.lat ? '지도에 핀 있음' : '지도에 핀 없음'}
        </p>
      </div>

      {item.lat && <span style={styles.pinBadge}>📍</span>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 260,
    background: '#ffffff',
    borderRight: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'sans-serif',
    overflowY: 'auto',
  },
  header: {
    padding: '16px 16px 12px',
    borderBottom: '1px solid #e5e7eb',
  },
  sectionLabel: {
    fontSize: 11,
    color: '#9ca3af',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  progressBg: {
    background: '#f3f4f6',
    borderRadius: 99,
    height: 6,
    overflow: 'hidden',
  },
  progressFill: {
    background: '#D4537E',
    height: '100%',
    borderRadius: 99,
    transition: 'width 0.4s ease',
  },
  progressMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
  },
  addBtn: {
    margin: '12px 16px',
    padding: '8px 14px',
    borderRadius: 8,
    border: '1.5px dashed #d1d5db',
    background: 'transparent',
    color: '#6b7280',
    fontSize: 13,
    cursor: 'pointer',
    textAlign: 'left',
  },
  addForm: {
    margin: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  input: {
    padding: '7px 10px',
    borderRadius: 8,
    border: '1px solid #d1d5db',
    fontSize: 13,
    outline: 'none',
  },
  select: {
    padding: '7px 10px',
    borderRadius: 8,
    border: '1px solid #d1d5db',
    fontSize: 13,
    background: 'white',
  },
  addActions: {
    display: 'flex',
    gap: 6,
  },
  cancelBtn: {
    flex: 1,
    padding: '6px 0',
    borderRadius: 8,
    border: '1px solid #d1d5db',
    background: 'white',
    fontSize: 12,
    cursor: 'pointer',
    color: '#6b7280',
  },
  confirmBtn: {
    flex: 1,
    padding: '6px 0',
    borderRadius: 8,
    border: 'none',
    background: '#D4537E',
    fontSize: 12,
    cursor: 'pointer',
    color: 'white',
    fontWeight: 500,
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '4px 0',
  },
  categoryLabel: {
    padding: '10px 16px 4px',
    fontSize: 11,
    color: '#9ca3af',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  item: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '9px 16px',
    cursor: 'pointer',
  },
  checkBox: {
    width: 18,
    height: 18,
    borderRadius: '50%',
    border: '1.5px solid',
    flexShrink: 0,
    marginTop: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  itemBody: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    fontSize: 13,
    lineHeight: 1.4,
  },
  itemMeta: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  pinBadge: {
    fontSize: 12,
    flexShrink: 0,
  },
};
