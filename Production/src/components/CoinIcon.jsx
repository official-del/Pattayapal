export function CoinIcon({ size = 20, style = {} }) {
  const pixel = Math.max(2, Math.round(Number(size) * 0.13));

  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        verticalAlign: 'middle',
        flexShrink: 0,
        border: `${pixel}px solid #0a0a0a`,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #fff4a8 0%, #facc15 32%, #f97316 100%)',
        boxShadow: `inset ${pixel}px ${pixel}px 0 rgba(255,255,255,0.55), ${pixel}px ${pixel}px 0 #0a0a0a`,
        color: '#0a0a0a',
        fontFamily: "'Outfit', 'Inter', sans-serif",
        fontWeight: 900,
        fontSize: Math.max(8, Math.round(Number(size) * 0.52)),
        lineHeight: 1,
        ...style
      }}
    >
      P
    </span>
  );
}

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
      fontFamily: "'Outfit', 'Inter', sans-serif",
    }}>
      {showIcon && <CoinIcon size={s.icon} />}
      {Number(amount).toLocaleString('th-TH')}
    </span>
  );
}

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
