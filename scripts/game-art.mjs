// Baixa a arte oficial de cada jogo do catálogo e salva otimizada em public/games/:
//   <slug>.webp       ícone quadrado 160 px (atalhos, listas, seletor)
//   <slug>-capa.webp  capa vertical 300x400 (vitrine "Categorias populares")
// Fontes: capa vertical da Steam e ícone da App Store. Jogo só de celular ganha capa montada com o ícone.
// Uso: node scripts/game-art.mjs [slug ...]   (sem slugs = todos; pula os que já existem, a não ser com --force)
import { mkdirSync, existsSync, writeFileSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const sharp = require("sharp");

const OUT = "public/games";
mkdirSync(OUT, { recursive: true });
const MAP_FILE = "src/lib/game-art.json";
const art = existsSync(MAP_FILE) ? JSON.parse(readFileSync(MAP_FILE, "utf8")) : {};

// Catálogo: lido do arquivo TypeScript (só a lista RAW).
const src = readFileSync("src/lib/game-catalog.ts", "utf8");
const GAMES = [...src.matchAll(/\["([a-z0-9-]+)", "([^"]+)", "[^"]*", "#[0-9A-Fa-f]{6}"\]/g)].map((m) => ({ slug: m[1], name: m[2] }));

// Ajustes: termo de busca na Steam (appid ou texto; false = não procurar), na App Store, ou usar a arte de outro jogo.
const FIX = {
  roblox: { steam: false, ios: "Roblox" }, freefire: { steam: false, ios: "Free Fire" }, "free-fire-max": { steam: false, ios: "Free Fire MAX" },
  minecraft: { steam: false, ios: "Minecraft" }, steam: { steam: false, ios: "Steam Mobile" }, fortnite: { steam: false, ios: "Fortnite" },
  lol: { steam: false, ios: "League of Legends: Wild Rift" }, valorant: { steam: false, ios: false }, genshin: { steam: false, ios: "Genshin Impact" },
  cs2: { steam: 730 }, "gta-v": { steam: 271590, ios: false },  pubg: { steam: 578080, ios: false }, "pubg-mobile": { steam: false, ios: "PUBG MOBILE" },
  "cod-mobile": { steam: false, ios: "Call of Duty: Mobile" }, warzone: { steam: false, ios: "Call of Duty: Warzone" }, cod: { steam: "Call of Duty", ios: false },
  "mobile-legends": { steam: false, ios: "Mobile Legends: Bang Bang" }, "dota-2": { steam: 570, ios: false }, "wild-rift": { steam: false, ios: "League of Legends: Wild Rift" },
  tft: { steam: false, ios: "TFT: Teamfight Tactics" }, "pokemon-go": { steam: false, ios: "Pokémon GO" }, "pokemon-tcg": { steam: false, ios: "Pokémon TCG Pocket" },
  "honkai-star-rail": { steam: false, ios: "Honkai: Star Rail" }, zenless: { steam: false, ios: "Zenless Zone Zero" }, "wuthering-waves": { steam: false, ios: "Wuthering Waves" },
  apex: { steam: 1172470, ios: false }, overwatch: { steam: 2357570, ios: false }, "rainbow-six": { steam: 359550, ios: false }, "rocket-league": { steam: 252950, ios: false },
  "fall-guys": { steam: 1097150, ios: false }, "among-us": { steam: 945360 }, "stumble-guys": { steam: false, ios: "Stumble Guys" },
  "standoff-2": { steam: false, ios: "Standoff 2" }, "blood-strike": { steam: false, ios: "Blood Strike" }, "delta-force": { steam: 2507950 }, "marvel-rivals": { steam: 2767030, ios: false },
  hearthstone: { steam: false, ios: "Hearthstone" }, wow: { steam: false, ios: false, use: "battlenet" }, "diablo-4": { steam: 2344520, ios: false }, "diablo-immortal": { steam: false, ios: "Diablo Immortal" },
  "path-of-exile": { steam: 2694490, ios: false }, "lost-ark": { steam: 1599340, ios: false }, albion: { steam: 761890 }, tibia: { steam: false, ios: false },
  ragnarok: { steam: false, ios: "Ragnarok Origin" }, "mu-online": { steam: false, ios: "MU Origin 3" }, "perfect-world": { steam: false, ios: "Perfect World Mobile" },
  "lineage-2": { steam: false, ios: "Lineage 2M" }, "black-desert": { steam: 582660 }, "new-world": { steam: 1063730, ios: false }, ffxiv: { steam: 39210, ios: false },
  "guild-wars-2": { steam: 1284210, ios: false }, "eve-online": { steam: 8500, ios: false }, runescape: { steam: 1343400 }, "throne-and-liberty": { steam: 2429640, ios: false },
  "war-thunder": { steam: 236390, ios: false }, "world-of-tanks": { steam: 1407200 }, "world-of-warships": { steam: 552990, ios: false }, rust: { steam: 252490, ios: false },
  dayz: { steam: 221100, ios: false }, ark: { steam: 2399830, ios: false },  "arena-breakout": { steam: false, ios: "Arena Breakout" },
  "the-finals": { steam: 2073850, ios: false }, "destiny-2": { steam: 1085660, ios: false }, warframe: { steam: 230410, ios: false }, palworld: { steam: 1623730, ios: false },
  terraria: { steam: 105600 }, stardew: { steam: 413150 }, "the-sims-4": { steam: 1222670, ios: false }, rdr2: { steam: 1174180, ios: false }, "elden-ring": { steam: 1245620, ios: false },
  cyberpunk: { steam: 1091500, ios: false }, "helldivers-2": { steam: 553850, ios: false }, "dead-by-daylight": { steam: 381210, ios: false }, "sea-of-thieves": { steam: 1172620, ios: false },
  sf6: { steam: 1364780, ios: false }, "mortal-kombat": { steam: 1971870, ios: false }, "tekken-8": { steam: 1778820, ios: false }, efootball: { steam: 1665460, ios: "eFootball" },
   f1: { steam: "F1 25", ios: false }, forza: { steam: 1551360, ios: false }, "gran-turismo": { steam: false, ios: false, use: "playstation" },
  "the-crew": { steam: 2698940, ios: false }, "need-for-speed": { steam: 1846380, ios: false }, asphalt: { steam: false, ios: "Asphalt Legends Unite" }, "football-manager": { steam: "Football Manager 2024", ios: false },
  "dream-league": { steam: false, ios: "Dream League Soccer 2025" }, "top-eleven": { steam: false, ios: "Top Eleven" }, cartola: { steam: false, ios: "Cartola" },
  "candy-crush": { steam: false, ios: "Candy Crush Saga" }, "coin-master": { steam: false, ios: "Coin Master" }, "monopoly-go": { steam: false, ios: "MONOPOLY GO!" }, "royal-match": { steam: false, ios: "Royal Match" },
  "hay-day": { steam: false, ios: "Hay Day" }, "boom-beach": { steam: false, ios: "Boom Beach" }, "rise-of-kingdoms": { steam: false, ios: "Rise of Kingdoms" }, "whiteout-survival": { steam: false, ios: "Whiteout Survival" },
  "last-war": { steam: false, ios: "Last War:Survival Game" }, "state-of-survival": { steam: false, ios: "State of Survival" }, "lords-mobile": { steam: false, ios: "Lords Mobile" }, evony: { steam: false, ios: "Evony" },
  "afk-journey": { steam: false, ios: "AFK Journey" }, "summoners-war": { steam: false, ios: "Summoners War" }, "seven-deadly-sins": { steam: false, ios: "The Seven Deadly Sins" },
  "dragon-ball-legends": { steam: false, ios: "DRAGON BALL LEGENDS" }, dokkan: { steam: false, ios: "DRAGON BALL Z DOKKAN BATTLE" }, "one-piece-bounty": { steam: false, ios: "ONE PIECE Bounty Rush" },
  naruto: { steam: "NARUTO X BORUTO Ultimate Ninja STORM CONNECTIONS", ios: false }, "blue-lock": { steam: false, ios: "Blue Lock Project World Champion" }, fgo: { steam: false, ios: "Fate/Grand Order" },
  "blue-archive": { steam: false, ios: "Blue Archive" }, arknights: { steam: false, ios: "Arknights" }, nikke: { steam: false, ios: "GODDESS OF VICTORY: NIKKE" }, "epic-seven": { steam: false, ios: "Epic Seven" },
  "tower-of-fantasy": { steam: false, ios: "Tower of Fantasy" }, "honkai-impact": { steam: false, ios: "Honkai Impact 3rd" }, "infinity-nikki": { steam: false, ios: "Infinity Nikki" }, umamusume: { steam: false, ios: false },
  yugioh: { steam: 1449850 }, "magic-arena": { steam: 2141910 }, "legends-of-runeterra": { steam: false, ios: "Legends of Runeterra" }, "ea-fc-mobile": { steam: false, ios: "EA SPORTS FC Mobile Futebol" },
  "fifa-ultimate": { use: "fc-26" }, madden: { steam: "Madden NFL 26", ios: false }, "pokemon-unite": { steam: false, ios: "Pokémon UNITE" }, "pokemon-scarlet": { use: "pokemon-go" },
  "animal-crossing": { steam: false, ios: "Animal Crossing: Pocket Camp Complete" }, zelda: { use: "nintendo" }, "mario-kart": { steam: false, ios: "Mario Kart Tour" }, smash: { use: "nintendo" }, splatoon: { use: "nintendo" },
  growtopia: { steam: 866020 }, habbo: { steam: false, ios: "Habbo" }, "second-life": { steam: false, ios: false }, "pixel-gun": { steam: false, ios: "Pixel Gun 3D" }, "shadow-fight": { steam: false, ios: "Shadow Fight 4: Arena" },
  "mini-militia": { steam: false, ios: "Mini Militia - Doodle Army 2" }, "critical-ops": { steam: false, ios: "Critical Ops: Online PvP FPS" }, ludo: { steam: false, ios: "Ludo King" }, poker: { steam: false, ios: "PokerStars Play" },
  xadrez: { steam: false, ios: "Chess - Play and Learn" }, osu: { steam: false, ios: false }, "geometry-dash": { steam: 322170 }, "blox-fruits": { use: "roblox" }, "pet-simulator": { use: "roblox" },
  "adopt-me": { use: "roblox" }, "murder-mystery": { use: "roblox" }, "grow-a-garden": { use: "roblox" }, hypixel: { use: "minecraft" }, "csgo-skins": { use: "cs2" }, "dota-items": { use: "dota-2" },
  tf2: { steam: 440, ios: false }, "rust-skins": { use: "rust" }, deadlock: { steam: false, ios: false }, "spectre-divide": { steam: 2641470, ios: false }, strinova: { steam: 1282270, ios: false },
  "once-human": { steam: 2139460, ios: false }, dune: { steam: 1172710, ios: false }, "monster-hunter": { steam: 2246340, ios: false }, "baldurs-gate": { steam: 1086940, ios: false },
  hogwarts: { steam: 990080, ios: false }, skyrim: { steam: 489830, ios: false }, "fallout-76": { steam: 1151340, ios: false }, "star-wars": { steam: 1237950, ios: false },
  battlefield: { steam: "Battlefield 6", ios: false }, halo: { steam: 1240440, ios: false }, gears: { steam: "Gears of War: Reloaded", ios: false },
  playstation: { steam: false, ios: "PlayStation App" }, xbox: { steam: false, ios: "Xbox" }, nintendo: { steam: false, ios: "Nintendo Switch App" }, "epic-games": { steam: false, ios: "Epic Games Store" },
  battlenet: { steam: false, ios: "Battle.net" }, "ea-app": { steam: false, ios: "EA app" }, ubisoft: { steam: false, ios: "Ubisoft Connect" }, "riot-points": { steam: false, ios: "Riot Mobile" },
  "google-play": { steam: false, ios: false }, apple: { steam: false, ios: "Apple Store" }, "discord-nitro": { steam: false, ios: "Discord - Chat, Talk & Hangout" }, twitch: { steam: false, ios: "Twitch: Live Streaming" },
  spotify: { steam: false, ios: "Spotify - Music and Podcasts" },  garena: { steam: false, ios: false }, outros: { steam: false, ios: false },
  "clash-royale": { steam: false, ios: "Clash Royale" }, "clash-of-clans": { steam: false, ios: "Clash of Clans" }, "brawl-stars": { steam: false, ios: "Brawl Stars" },
  "subway-surfers": { steam: false, ios: "Subway Surfers" }, "8-ball-pool": { steam: false, ios: "8 Ball Pool" }, "marvel-snap": { steam: 1997040, ios: "MARVEL SNAP" },
   "grand-chase": { steam: 985810, ios: false }, crossfire: { steam: false, ios: false },  warface: { steam: 291480, ios: false },
  "priston-tale": { steam: false, ios: false },
  // segunda tentativa
  "fc-26": { steam: 3405690, ios: false }, "nba-2k": { steam: 3472040, ios: false }, "f1": { steam: 3059520, ios: false }, "madden": { steam: 3230400, ios: false }, "battlefield": { steam: 2807960, ios: false }, "gears": { steam: 2864580, ios: false }, "escape-from-tarkov": { steam: 3932890, ios: false }, "umamusume": { steam: 3224770, ios: "Umamusume: Pretty Derby" }, "osu": { steam: false, ios: false }, "deadlock": { steam: 1422450, ios: false }, "ubisoft": { steam: false, ios: "Ubisoft Connect" }, "garena": { steam: false, ios: "Garena" }, "crossfire": { steam: false, ios: "CrossFire: Legends" }, "metin2": { steam: false, ios: "Metin2" }, "tibia": { steam: false, ios: "TibiaME" }, "valorant": { steam: false, ios: "VALORANT" }, "point-blank": { steam: false, ios: "Point Blank" },
};

const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url, json = true) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 NexoCatalog" } });
      if (r.status === 404) return null;
      if (!r.ok) { await sleep(1500); continue; }
      return json ? await r.json() : Buffer.from(await r.arrayBuffer());
    } catch { await sleep(1500); }
  }
  return null;
}

async function steamApp(q) {
  if (typeof q === "number") return { id: q, name: `#${q}` };
  const d = await get(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(q)}&l=portuguese&cc=BR`);
  const it = d?.items?.find((x) => norm(x.name).includes(norm(q)) || norm(q).includes(norm(x.name))) ?? null;
  return it ? { id: it.id, name: it.name } : null;
}
async function steamCover(id) {
  for (const f of ["library_600x900_2x.jpg", "library_600x900.jpg"]) {
    const b = await get(`https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${id}/${f}`, false);
    if (b && b.length > 5000) return { buf: b, wide: false };
  }
  // Jogos recentes guardam a capa vertical num endereço com código; usa o cabeçalho da loja (horizontal).
  const d = await get(`https://store.steampowered.com/api/appdetails?appids=${id}&cc=br&filters=basic`);
  const url = d?.[id]?.data?.header_image;
  const b = url ? await get(url, false) : null;
  return b ? { buf: b, wide: true } : null;
}
/** Capa vertical a partir de uma imagem horizontal: ela inteira no meio, sobre o fundo desfocado dela mesma. */
async function coverFromWide(wide) {
  const bg = await sharp(wide).resize(300, 400, { fit: "cover" }).blur(24).modulate({ brightness: 0.5, saturation: 1.2 }).toBuffer();
  const fg = await sharp(wide).resize(300, 140, { fit: "cover" }).toBuffer();
  return sharp(bg).composite([{ input: fg, top: 130, left: 0 }]).webp({ quality: 80 }).toBuffer();
}
async function iosApp(q) {
  const d = await get(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=software&country=br&limit=8`);
  const it = d?.results?.find((x) => norm(x.trackName).startsWith(norm(q).slice(0, 12))) ?? d?.results?.find((x) => norm(x.trackName).includes(norm(q).split(" ")[0])) ?? null;
  return it ? { name: it.trackName, url: it.artworkUrl512 } : null;
}

const iconFrom = (buf) => sharp(buf).resize(160, 160, { fit: "cover", position: "attention" }).webp({ quality: 82 }).toBuffer();
async function coverFromIcon(icon) {
  const bg = await sharp(icon).resize(300, 400, { fit: "cover" }).blur(28).modulate({ brightness: 0.55, saturation: 1.3 }).toBuffer();
  const mask = Buffer.from(`<svg width="190" height="190"><rect width="190" height="190" rx="42" ry="42"/></svg>`);
  const fg = await sharp(icon).resize(190, 190).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
  return sharp(bg).composite([{ input: fg, top: 95, left: 55 }]).webp({ quality: 80 }).toBuffer();
}

const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const force = process.argv.includes("--force");
const queue = GAMES.filter((g) => (only.length ? only.includes(g.slug) : true));
for (const g of queue) {
  const fx = FIX[g.slug] ?? {};
  if (fx.use) continue; // copiado no fim
  if (!force && art[g.slug] && existsSync(`${OUT}/${g.slug}.webp`)) continue;
  let cover = null, icon = null, from = [];
  if (fx.steam !== false) {
    const app = await steamApp(fx.steam ?? g.name);
    if (app) { cover = await steamCover(app.id); if (cover) from.push(`steam:${app.name}${cover.wide ? " (cabeçalho)" : ""}`); }
  }
  if (fx.ios !== false) {
    const app = await iosApp(fx.ios ?? g.name);
    if (app) { icon = await get(app.url, false); if (icon) from.push(`ios:${app.name}`); }
  }
  if (!cover && !icon) { console.log("sem arte:", g.slug); delete art[g.slug]; continue; }
  const iconBuf = await iconFrom(icon ?? cover.buf);
  const coverBuf = cover ? (cover.wide ? await coverFromWide(cover.buf) : await sharp(cover.buf).resize(300, 400, { fit: "cover" }).webp({ quality: 80 }).toBuffer()) : await coverFromIcon(icon);
  writeFileSync(`${OUT}/${g.slug}.webp`, iconBuf);
  if (fx.cover !== false) writeFileSync(`${OUT}/${g.slug}-capa.webp`, coverBuf);
  art[g.slug] = { from: from.join(" + "), cover: fx.cover !== false };
  console.log("ok", g.slug, "←", from.join(" + "));
  await sleep(250);
}
// Jogos que usam a arte de outro (ex.: jogos de Roblox, skins de CS2).
for (const g of GAMES) {
  const use = FIX[g.slug]?.use;
  if (use && art[use]) {
    writeFileSync(`${OUT}/${g.slug}.webp`, readFileSync(`${OUT}/${use}.webp`));
    if (art[use].cover) writeFileSync(`${OUT}/${g.slug}-capa.webp`, readFileSync(`${OUT}/${use}-capa.webp`));
    art[g.slug] = { from: `igual a ${use}`, cover: art[use].cover };
  }
}
writeFileSync(MAP_FILE, JSON.stringify(Object.fromEntries(Object.entries(art).sort()), null, 1) + "\n");
console.log(`Arte salva para ${Object.keys(art).length} de ${GAMES.length} jogos.`);
