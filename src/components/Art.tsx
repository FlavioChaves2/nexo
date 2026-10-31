import type { CSSProperties } from "react";
import { gameCover } from "@/lib/game-art";

type GameLike = { slug?: string; name: string; c1: string; c2: string; glyph: string };

/** Miniatura do anúncio sem foto: a capa oficial do jogo; sem capa, o brilho na cor do jogo com o texto inclinado. */
export function Art({ game, glyph, showName = true }: { game: GameLike; glyph?: string | null; showName?: boolean }) {
  const cover = game.slug ? gameCover(game.slug) : null;
  return (
    <div className={`art${cover ? " has-cover" : ""}`} style={{ "--c1": game.c1, "--c2": game.c2 } as CSSProperties}>
      {cover ? <img className="art-cover" src={cover} alt="" loading="lazy" decoding="async" /> : <span className="glyph">{glyph || game.glyph}</span>}
      {showName && <span className="gname">{game.name}</span>}
    </div>
  );
}
