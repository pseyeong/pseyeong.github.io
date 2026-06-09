// src/components/TopBar.tsx

export default function TopBar() {
  return (
    <header style={styles.bar}>
      <div style={styles.logo}>
        <PinIcon />
        <span>우리의 버킷리스트</span>
      </div>
      <div style={styles.right}>
        <div style={styles.avatarPair}>
          <div style={{ ...styles.avatar, background: '#F4C0D1', color: '#72243E', zIndex: 1, marginRight: -8 }}>나</div>
          <div style={{ ...styles.avatar, background: '#B5D4F4', color: '#0C447C' }}>너</div>
        </div>
        <button style={styles.iconBtn} aria-label="설정">⚙️</button>
      </div>
    </header>
  );
}

function PinIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="10" r="6" fill="#D4537E" />
      <circle cx="12" cy="10" r="3" fill="white" />
      <polygon points="12,22 8,14 16,14" fill="#D4537E" />
    </svg>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    background: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    fontFamily: 'sans-serif',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontWeight: 500,
    fontSize: 15,
    color: '#111',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  avatarPair: {
    display: 'flex',
    alignItems: 'center',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 500,
    border: '2px solid white',
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 18,
    padding: 4,
  },
};
