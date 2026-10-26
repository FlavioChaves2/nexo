import { Nexinho3D } from "./Nexinho3D";

/** Arte do hero: Nexinho 3D sobre brilho verde e órbitas finas. */
export function HeroArt() {
  return (
    <div className="hero-art">
      <svg className="star" viewBox="0 0 520 400" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <radialGradient id="brilho">
            <stop offset="0" stopColor="#C5F04A" stopOpacity=".28" />
            <stop offset="1" stopColor="#C5F04A" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="275" cy="200" r="170" fill="url(#brilho)" />
        <ellipse className="orbit" cx="275" cy="200" rx="185" ry="120" fill="none" stroke="#C5F04A" strokeOpacity=".22" strokeWidth="1.2" transform="rotate(-35 275 200)" />
        <ellipse className="orbit rev" cx="275" cy="200" rx="195" ry="88" fill="none" stroke="#C5F04A" strokeOpacity=".14" strokeWidth="1" transform="rotate(28 275 200)" />
      </svg>
      <Nexinho3D />
      <span className="htag t1">+1 NOVA CONQUISTA</span>
      <span className="htag t2">PLAYER TO PLAYER ↗</span>
      <span className="corner c1">PLAY. TRADE. REPEAT.</span>
      <span className="corner c2">N / 001</span>
    </div>
  );
}
