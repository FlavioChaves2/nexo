import Link from "next/link";

/** N com a diagonal em lima (a conexão), E, X e O geométricos. */
export function LogoMark({ ink = "currentColor", lima = "var(--accent)" }: { ink?: string; lima?: string }) {
  return (
    <svg viewBox="0 0 106 28" aria-hidden="true">
      <rect x="0" y="0" width="6" height="28" fill={ink} />
      <rect x="18" y="0" width="6" height="28" fill={ink} />
      <polygon points="0,0 6.6,0 24,28 17.4,28" fill={lima} />
      <rect x="30" y="0" width="6" height="28" fill={ink} />
      <rect x="30" y="0" width="18" height="6" fill={ink} />
      <rect x="30" y="11" width="15" height="6" fill={ink} />
      <rect x="30" y="22" width="18" height="6" fill={ink} />
      <polygon points="52,0 59,0 75,28 68,28" fill={ink} />
      <polygon points="75,0 68,0 52,28 59,28" fill={ink} />
      <rect x="82" y="3" width="21" height="22" rx="10" fill="none" stroke={ink} strokeWidth="6" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link className="logo" href="/" aria-label="Nexo, página inicial">
      <LogoMark />
      <sup>®</sup>
    </Link>
  );
}
