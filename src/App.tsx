// src/App.tsx

import { useState } from 'react';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import MapArea from './components/MapArea';
import BottomNav from './components/BottomNav';
import type { TabId } from './components/BottomNav';
import { useBucketList } from './hooks/useBucketList';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('map');

  const {
    items,
    selectedId,
    selectedItem,
    stats,
    setSelectedId,
    toggleDone,
    addItem,
    updateMemo,
  } = useBucketList();

  return (
    <div style={styles.shell}>
      <TopBar />

      <div style={styles.body}>
        <Sidebar
          items={items}
          selectedId={selectedId}
          stats={stats}
          onSelect={setSelectedId}
          onToggle={toggleDone}
          onAdd={addItem}
        />

        {activeTab === 'map' && (
          <MapArea
            items={items}
            selectedItem={selectedItem}
            onToggle={toggleDone}
            onUpdateMemo={updateMemo}
          />
        )}
        {activeTab === 'list' && <ComingSoon label="목록 뷰" desc="전체 버킷리스트를 테이블로 볼 수 있는 화면이 생길 예정이에요." />}
        {activeTab === 'memory' && <ComingSoon label="추억 앨범" desc="완료한 버킷리스트의 사진과 메모를 모아보는 화면이 생길 예정이에요." />}
        {activeTab === 'us' && <ComingSoon label="우리 프로필" desc="커플 정보와 통계를 볼 수 있는 화면이 생길 예정이에요." />}
      </div>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

function ComingSoon({ label, desc }: { label: string; desc: string }) {
  return (
    <div style={styles.comingSoon}>
      <p style={styles.comingSoonTitle}>{label}</p>
      <p style={styles.comingSoonDesc}>{desc}</p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    fontFamily: 'sans-serif',
    width:'100%',
  },
  body: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  comingSoon: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    background: '#f9fafb',
    color: '#6b7280',
  },
  comingSoonTitle: {
    fontSize: 16,
    fontWeight: 500,
    color: '#374151',
  },
  comingSoonDesc: {
    fontSize: 13,
    maxWidth: 300,
    textAlign: 'center',
    lineHeight: 1.6,
  },
};
