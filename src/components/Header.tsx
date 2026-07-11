interface HeaderProps {
  genaiEnabled: boolean | null;
}

/** Site header with logo, title, and the current assistant mode badge. */
export function Header({ genaiEnabled }: HeaderProps) {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <svg
          className="site-header__logo"
          viewBox="0 0 64 64"
          role="img"
          aria-label="StadiumIQ logo"
        >
          <rect width="64" height="64" rx="14" fill="var(--primary)" />
          <ellipse
            cx="32"
            cy="34"
            rx="20"
            ry="13"
            fill="none"
            stroke="#93c5fd"
            strokeWidth="3"
          />
          <line
            x1="32"
            y1="21"
            x2="32"
            y2="47"
            stroke="#93c5fd"
            strokeWidth="3"
          />
          <circle cx="32" cy="34" r="5" fill="#93c5fd" />
        </svg>
        <div>
          <h1 className="site-header__title">StadiumIQ</h1>
          <p className="site-header__tagline">
            Smart-stadium concierge &amp; operations for FIFA World Cup 2026
          </p>
        </div>
        {genaiEnabled !== null ? (
          <span className="badge-ai" title="Assistant response mode">
            {genaiEnabled ? 'GenAI: Gemini' : 'GenAI: offline fallback'}
          </span>
        ) : null}
      </div>
    </header>
  );
}
