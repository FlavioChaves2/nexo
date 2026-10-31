import ART from "./game-art.json";

// Arte oficial dos jogos, salva em public/games/ pelo script scripts/game-art.mjs.
// Jogo sem arte (ou criado depois pelo admin) usa a arte gerada com a letra e as cores do jogo.

const art = ART as Record<string, { from: string; cover: boolean }>;

/** Ícone quadrado (160 px) do jogo, ou null. */
export const gameIcon = (slug: string) => (art[slug] ? `/games/${slug}.webp` : null);

/** Capa vertical (300x400) do jogo, ou null. */
export const gameCover = (slug: string) => (art[slug]?.cover ? `/games/${slug}-capa.webp` : null);

/** "Mais buscados": atalhos logo abaixo do topo da página inicial. */
export const MOST_SEARCHED = ["roblox", "freefire", "valorant", "fortnite", "minecraft", "gta-v", "clash-royale", "steam"];
