// src/components/BottomNav.tsx

type TabId = 'map' | 'list' | 'memory' | 'us';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: 'map',    label: '지도',  icon: '🗺️' },
  { id: 'list',   label: '목록',  icon: '📋' },
  { id: 'memory', label: '추억',  icon: '❤️' },
  { id: 'us',     label: '우리',  icon: '👫' },
];

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav style={styles.nav}>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          style={{
            ...styles.tab,
            color: activeTab === tab.id ? '#D4537E' : '#9ca3af',
            borderTop: activeTab === tab.id ? '2px solid #D4537E' : '2px solid transparent',
          }}
          onClick={() => onTabChange(tab.id)}
          aria-label={tab.label}
          aria-current={activeTab === tab.id ? 'page' : undefined}
        >
          <span style={styles.icon}>{tab.icon}</span>
          <span style={styles.label}>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

// TabId를 외부에서도 쓸 수 있도록 export
export type { TabId };

const styles: Record<string, React.CSSProperties> = {
  nav: {
    display: 'flex',
    background: '#ffffff',
    borderTop: '1px solid #e5e7eb',
    padding: '0 20px',
  },
  tab: {
    flex: 1,
    padding: '10px 0 8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    background: 'none',
    border: 'none',
    borderTop: '2px solid transparent',
    cursor: 'pointer',
    transition: 'color 0.15s, border-color 0.15s',
  },
  icon: { fontSize: 18 },
  label: { fontSize: 11 },
};
