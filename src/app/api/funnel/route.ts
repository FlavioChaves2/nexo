import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

// Conta os passos do funil do guia sem identificar ninguém (sem nome, e-mail ou IP).
const EVENTS = new Set([
  "abriu-guia", "viu-oferta", "clicou-comprar", "deu-email", "viu-atalho", "clicou-atalho",
  "assistiu-video", "video-metade", "video-fim",
  "abriu-venda", "viu-oferta-venda", "clicou-comprar-venda",
]);

// Avisa o dono por e-mail quando alguém começa ou termina o vídeo do kit (no máximo 20 por hora).
const NOTIFY = "paraibanogames@gmail.com";
const ALERTS: Record<string, string> = {
  "assistiu-video": "▶ Alguém começou a ver o vídeo do Kit",
  "video-fim": "✅ Alguém assistiu o vídeo do Kit até o fim",
};

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const name = typeof body?.e === "string" ? body.e : "";
  const source = typeof body?.s === "string" ? body.s.slice(0, 60).replace(/[^\w.-]/g, "") : "";
  if (!EVENTS.has(name)) return NextResponse.json({ ok: false }, { status: 400 });
  await db.funnelEvent.create({ data: { name, source } });

  if (ALERTS[name] && !/^teste/.test(source)) {
    const since = new Date(Date.now() - 3_600_000);
    const recent = await db.funnelEvent.count({ where: { name: { in: Object.keys(ALERTS) }, createdAt: { gte: since } } });
    if (recent <= 20) {
      const [plays, ends] = await Promise.all([
        db.funnelEvent.count({ where: { name: "assistiu-video" } }),
        db.funnelEvent.count({ where: { name: "video-fim" } }),
      ]);
      await sendEmail(
        NOTIFY,
        ALERTS[name],
        `<p>${ALERTS[name]}.<br>Origem: ${source || "desconhecida"}<br><br>Total até agora: ${plays} deram play, ${ends} viram até o fim.</p>`,
      ).catch(() => {});
    }
  }
  return NextResponse.json({ ok: true });
}
