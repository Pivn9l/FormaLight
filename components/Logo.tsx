const RAYS = [-64, -42, -20, 2, 24, 46, 68];

export function LogoMark({ size = 44 }: { size?: number }) {
  const cx = 31;
  const cy = 32;

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="logo-mark">
      <path d="M33 4 A28 28 0 0 0 33 60" fill="none" stroke="var(--navy)" strokeWidth="2.4" />
      <path d="M33 10 A22 22 0 0 0 33 54" fill="none" stroke="var(--navy)" strokeWidth="2.4" />
      <path d="M33 4 V10 M33 54 V60" stroke="var(--navy)" strokeWidth="2.4" />
      <path
        d="M29 17 A15 15 0 0 0 17 28"
        fill="none"
        stroke="var(--gold)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {RAYS.map((deg) => {
        const r = (deg * Math.PI) / 180;
        const inner = deg === 2 ? 11 : 9;
        return (
          <line
            key={deg}
            x1={(cx + inner * Math.cos(r)).toFixed(2)}
            y1={(cy + inner * Math.sin(r)).toFixed(2)}
            x2={(cx + 22 * Math.cos(r)).toFixed(2)}
            y2={(cy + 22 * Math.sin(r)).toFixed(2)}
            stroke="var(--gold)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

export function Logo() {
  return (
    <a href="/" className="logo" aria-label="Forma & Light — на главную">
      <LogoMark />
      <span className="logo-text">
        <span className="logo-name">
          FORMA <em>&amp;</em> LIGHT
        </span>
        <span className="logo-sub">Designer mirrors</span>
      </span>
    </a>
  );
}
