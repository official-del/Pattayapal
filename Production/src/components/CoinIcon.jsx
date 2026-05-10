import palCoinImg from '../assets/pal-coin.png';

export function CoinIcon({ size = 20, style = {} }) {
  return (
    <img
      src={palCoinImg}
      alt="Coin"
      style={{
        width: size,
        height: size,
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        objectFit: 'contain',
        ...style
      }}
    />
  );
}

// 💰 CoinBadge - แสดงยอด Coin พร้อม icon ใช้สำหรับ balance display
export function CoinBadge({ amount = 0, size = 'md', color = '#F59E0B', showIcon = true }) {
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
      {showIcon && <CoinIcon size={s.icon} />}
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
