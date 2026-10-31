import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { db } from "@/lib/db";
import { readImage } from "@/lib/images";

// Imagem da loja para compartilhar (WhatsApp, Instagram...) e para o material de divulgação.
// Só dados reais da loja: nome, foto, número de anúncios ativos e vendas concluídas na Nexo.
export const alt = "Loja na Nexo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function StoreImage({ params }: { params: Promise<{ username: string }> }) {
  const username = decodeURIComponent((await params).username);
  const u = await db.user.findUnique({ where: { username }, select: { id: true, username: true, storeName: true, avatarId: true, completedSales: true, suspendedAt: true } });
  const font = (f: string) => readFile(join(process.cwd(), "node_modules/@fontsource", f));
  const [sora, manrope, icon] = await Promise.all([font("sora/files/sora-latin-800-normal.woff"), font("manrope/files/manrope-latin-700-normal.woff"), readFile(join(process.cwd(), "public/app/icon-192.png"))]);
  const ok = u && !u.suspendedAt;
  const listings = ok ? await db.listing.count({ where: { sellerId: u.id, status: "ATIVO", stock: { gt: 0 }, reservedForId: null } }) : 0;
  // A foto vira PNG pelo sharp (o gerador de imagem não lê WEBP).
  let avatar: string | null = null;
  if (ok && u.avatarId) {
    const img = await readImage(u.avatarId, true);
    if (img) {
      const sharp = (await import("sharp")).default;
      avatar = `data:image/png;base64,${(await sharp(Buffer.from(img.data)).resize(220, 220, { fit: "cover" }).png().toBuffer()).toString("base64")}`;
    }
  }
  const name = ok ? u.storeName || u.username : "Loja na Nexo";
  const stats = ok ? [`${listings} anúncio${listings === 1 ? "" : "s"}`, `${u.completedSales} venda${u.completedSales === 1 ? "" : "s"} concluída${u.completedSales === 1 ? "" : "s"} na Nexo`] : [];

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "60px 70px", background: "radial-gradient(70% 90% at 85% 10%, #2a3a12 0%, #111311 65%)", color: "#F1F4EC", fontFamily: "Manrope" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <img src={`data:image/png;base64,${icon.toString("base64")}`} width={56} height={56} style={{ borderRadius: 14 }} />
          <span style={{ fontFamily: "Sora", fontSize: 36, letterSpacing: 2 }}>NEXO</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          {avatar ? (
            <img src={avatar} width={200} height={200} style={{ borderRadius: 100, border: "6px solid #C5F04A" }} />
          ) : (
            <div style={{ width: 200, height: 200, borderRadius: 100, background: "#C5F04A", color: "#12160A", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Sora", fontSize: 96 }}>{name[0]?.toUpperCase()}</div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 760 }}>
            <span style={{ fontFamily: "Sora", fontSize: 64, lineHeight: 1.05 }}>{name.slice(0, 40)}</span>
            {stats.length > 0 && <span style={{ fontSize: 30, color: "#C5F04A" }}>{stats.join(" · ")}</span>}
          </div>
        </div>
        <span style={{ fontSize: 28, color: "#959C8F" }}>{ok ? `nexopoint.com.br/v/${u.username}` : "nexopoint.com.br"} · pagamento pela Garantia Nexo</span>
      </div>
    ),
    { ...size, fonts: [{ name: "Sora", data: sora, weight: 800 }, { name: "Manrope", data: manrope, weight: 700 }] },
  );
}
