import type { CSSProperties } from "react";

type GameLike = { name: string; c1: string; c2: string; glyph: string };

/** Miniatura gerada: brilho na cor do jogo, losango e o texto inclinado. */
export function Art({ game, glyph, showName = true }: { game: GameLike; glyph?: string | null; showName?: boolean }) {
  return (
    <div className="art" style={{ "--c1": game.c1, "--c2": game.c2 } as CSSProperties}>
      <span className="glyph">{glyph || game.glyph}</span>
      {showName && <span className="gname">{game.name}</span>}
    </div>
  );
}
