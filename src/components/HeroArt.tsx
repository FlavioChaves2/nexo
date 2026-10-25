/** Asterisco 3D do hero: barras com extrusão em verde-musgo e órbitas finas. */
export function HeroArt() {
  const angles = [18, 63, 108, 153];
  const bar = (a: number, fill: string, d: number) => (
    <rect key={`${a}-${d}`} x={-17 + d} y={-140 + d} width="34" height="280" rx="3" fill={fill} transform={`rotate(${a})`} />
  );
  return (
    <div className="hero-art">
      <svg className="star" viewBox="0 0 520 400" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <linearGradient id="lima" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#D9FA7A" />
            <stop offset="1" stopColor="#9ED12C" />
          </linearGradient>
          <radialGradient id="brilho">
            <stop offset="0" stopColor="#C5F04A" stopOpacity=".28" />
            <stop offset="1" stopColor="#C5F04A" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="275" cy="200" r="170" fill="url(#brilho)" />
        <ellipse className="orbit" cx="275" cy="200" rx="185" ry="120" fill="none" stroke="#C5F04A" strokeOpacity=".22" strokeWidth="1.2" transform="rotate(-35 275 200)" />
        <ellipse className="orbit rev" cx="275" cy="200" rx="195" ry="88" fill="none" stroke="#C5F04A" strokeOpacity=".14" strokeWidth="1" transform="rotate(28 275 200)" />
        <g transform="translate(275 200)">
          <g className="float">
            {angles.map((a) => bar(a, "#3F5A17", 9))}
            {angles.map((a) => bar(a, "#5E8222", 4.5))}
            {angles.map((a) => bar(a, "url(#lima)", 0))}
          </g>
        </g>
      </svg>
      <span className="htag t1">+1 NOVA CONQUISTA</span>
      <span className="htag t2">PLAYER TO PLAYER ↗</span>
      <span className="corner c1">PLAY. TRADE. REPEAT.</span>
      <span className="corner c2">N / 001</span>
    </div>
  );
}
