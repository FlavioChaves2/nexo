import type { CSSProperties } from "react";
import { Nexinho3D } from "./Nexinho3D";

/** Escurece uma cor #RRGGBB (f < 1) para a parte de sombra do Nexinho. */
const shade = (hex: string, f: number) =>
  "#" + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * f).toString(16).padStart(2, "0")).join("");

/** Faixa do jogo na busca, com o Nexinho vestido nas cores do jogo. */
export function GameBanner({ game, count }: { game: { name: string; c1: string; c2: string; letter: string }; count: number }) {
  return (
    <div className="game-banner" style={{ "--c1": game.c1, "--c2": game.c2 } as CSSProperties}>
      <div className="gb-copy">
        <span className="gb-letter" aria-hidden="true">{game.letter}</span>
        <span className="eyebrow">Universo</span>
        <h1>{game.name}</h1>
        <p className="muted">{count} {count === 1 ? "anúncio" : "anúncios"} com pagamento protegido pela Garantia Nexo.</p>
      </div>
      <Nexinho3D className="gb-bot" main={game.c1} dark={shade(game.c1, 0.7)} decor={false} zoom={9} label={`Nexinho com as cores de ${game.name}`} />
    </div>
  );
}
