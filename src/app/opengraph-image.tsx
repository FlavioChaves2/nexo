import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Imagem que aparece quando alguém compartilha o link da Nexo (WhatsApp, Instagram, Discord…).
export const alt = "Nexo: compre e venda contas, skins, moedas e gift cards de jogos com pagamento protegido";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  const bot = await readFile(join(process.cwd(), "public/brand/nexinho-festa.png"));
  const icon = await readFile(join(process.cwd(), "public/app/icon-192.png"));
  const font = (f: string) => readFile(join(process.cwd(), "node_modules/@fontsource", f));
  const [sora, manrope] = await Promise.all([font("sora/files/sora-latin-800-normal.woff"), font("manrope/files/manrope-latin-700-normal.woff")]);
  const src = (b: Buffer) => `data:image/png;base64,${b.toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "60px 70px", background: "radial-gradient(70% 90% at 80% 50%, #2a3a12 0%, #111311 65%)", color: "#F1F4EC", fontFamily: "Manrope" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 26, maxWidth: 660 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <img src={src(icon)} width={72} height={72} style={{ borderRadius: 18 }} />
            <span style={{ fontSize: 56, fontFamily: "Sora", letterSpacing: 2 }}>NEXO</span>
          </div>
          <div style={{ fontSize: 60, fontFamily: "Sora", lineHeight: 1.08, display: "flex", flexWrap: "wrap" }}>
            Contas, skins, moedas e gift cards de jogos
          </div>
          <div style={{ fontSize: 30, color: "#C5F04A", fontWeight: 700 }}>Pagamento protegido até você receber · Pix</div>
          <div style={{ fontSize: 24, color: "#959C8F" }}>nexopoint.com.br</div>
        </div>
        <img src={src(bot)} width={277} height={440} />
      </div>
    ),
    { ...size, fonts: [{ name: "Sora", data: sora, weight: 800 }, { name: "Manrope", data: manrope, weight: 700 }] },
  );
}
