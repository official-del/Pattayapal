// 🪙 CoinIcon - Premium Gold Coin SVG Icon
// ใช้แทน $ หรือ text ทุกที่ในระบบ

export function CoinIcon({ size = 20, style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    >
      {/* Outer ring */}
      <circle cx="16" cy="16" r="15" fill="#D97706" />
      {/* Main coin body */}
      <circle cx="16" cy="16" r="13" fill="#F59E0B" />
      {/* Inner shine */}
      <circle cx="16" cy="16" r="10" fill="#FCD34D" />
      {/* ฿ Symbol */}
      <text
        x="16"
        y="21"
        textAnchor="middle"
        fontSize="12"
        fontWeight="900"
        fontFamily="'Segoe UI', Arial, sans-serif"
        fill="#92400E"
      >
        P
      </text>
      {/* Shine highlight */}
      <ellipse cx="12" cy="11" rx="3" ry="2" fill="rgba(255,255,255,0.35)" transform="rotate(-30 12 11)" />
    </svg>
  );
}

// 💰 CoinBadge - แสดงยอด Coin พร้อม icon ใช้สำหรับ balance display
export function CoinBadge({ amount = 0, size = 'md', color = '#F59E0B' }) {
  const sizes = {
    sm: { icon: 14, font: '0.8rem', gap: '4px' },
    md: { icon: 20, font: '1rem', gap: '6px' },
    lg: { icon: 28, font: '1.4rem', gap: '8px' },
    xl: { icon: 40, font: '2rem', gap: '10px' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: s.gap,
      fontWeight: '700',
      fontSize: s.font,
      color,
      fontFamily: "'Outfit', 'Segoe UI', sans-serif",
    }}>
      <CoinIcon size={s.icon} />
      {Number(amount).toLocaleString('th-TH')}
    </span>
  );
}

// 🏷️ CoinTag - เล็กๆ สำหรับใส่ใน card / badge
export function CoinTag({ amount, positive = true }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      background: positive ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
      color: positive ? '#22c55e' : '#ef4444',
      borderRadius: '20px',
      padding: '3px 10px',
      fontWeight: '800',
      fontSize: '0.85rem',
    }}>
      <CoinIcon size={13} />
      {positive ? '+' : '-'}{Number(amount).toLocaleString('th-TH')}
    </span>
  );
}

export default CoinIcon;
