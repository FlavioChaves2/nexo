import { useId } from "react";
import Link from "next/link";

/**
 * Símbolo: bloco lima com extrusão verde-musgo (o mesmo 3D do asterisco do hero),
 * um N recortado em escuro e uma faísca no canto: a "conexão" que acende.
 */
export function NexoSymbol({ size = 40 }: { size?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg className="nexo-symbol" width={size} height={size} viewBox="0 0 36 36" aria-hidden="true">
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E4FF8F" />
          <stop offset="0.55" stopColor="#C5F04A" />
          <stop offset="1" stopColor="#8CC21F" />
        </linearGradient>
        <linearGradient id={`s${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity=".55" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`c${id}`}>
          <rect x="1" y="1" width="30" height="30" rx="9" />
        </clipPath>
      </defs>
      <rect x="5" y="5" width="30" height="30" rx="9" fill="#2F4512" />
      <rect x="3" y="3" width="30" height="30" rx="9" fill="#557A1C" />
      <g clipPath={`url(#c${id})`}>
        <rect x="1" y="1" width="30" height="30" rx="9" fill={`url(#g${id})`} />
        <rect className="glint" x="-30" y="-4" width="14" height="40" fill={`url(#s${id})`} transform="rotate(20 16 16)" />
      </g>
      <g fill="#12160A">
        <rect x="9" y="9" width="4.4" height="14" rx="1" />
        <rect x="18.6" y="9" width="4.4" height="14" rx="1" />
        <polygon points="9,9 13.6,9 23,23 18.4,23" />
      </g>
      <path className="spark" d="M30 1.5c.3 2 1.1 2.9 3 3.3-1.9.4-2.7 1.3-3 3.3-.3-2-1.1-2.9-3-3.3 1.9-.4 2.7-1.3 3-3.3z" fill="#FFFFFF" />
    </svg>
  );
}

/** Palavra NEXO geométrica, com a diagonal do N em lima. */
export function LogoMark({ ink = "currentColor", lima = "var(--accent)" }: { ink?: string; lima?: string }) {
  return (
    <svg className="nexo-word" viewBox="0 0 106 28" aria-hidden="true">
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
      <NexoSymbol />
      <LogoMark />
    </Link>
  );
}
