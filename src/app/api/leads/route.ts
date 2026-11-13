import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

// Recebe o contato das landing pages avulsas (public/curriculo-europeu) e avisa por e-mail.
const schema = z.object({
  product: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(120),
  whatsapp: z.string().trim().max(30).optional().default(""),
  country: z.string().trim().max(40).optional().default(""),
  source: z.string().trim().max(120).optional().default(""),
  website: z.string().max(0).optional(), // campo-isca contra robôs
});

const NOTIFY = "paraibanogames@gmail.com";
const FROM = "Currículo Europeu <nao-responda@nexopoint.com.br>";
const esc = (s: string) => s.replace(/[<>&"]/g, (c) => `&#${c.charCodeAt(0)};`);

function guideEmail(name: string, link: string) {
  return `<div style="background:#f6f7fb;padding:28px 14px;font-family:Arial,sans-serif">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:14px;padding:28px;color:#0f172a">
    <h1 style="font-size:22px;margin:0 0 10px">Seu guia chegou, ${esc(name)}! 🇪🇺</h1>
    <p style="line-height:1.55;color:#334155">Aqui está o acesso ao <b>Guia do Currículo Europeu</b>: os 7 erros que derrubam o currículo brasileiro, a estrutura certa, a tabela de idiomas e um modelo pronto para copiar.</p>
    <p style="margin:24px 0"><a href="${link}" style="background:#ffcc33;color:#1a1300;font-weight:800;text-decoration:none;padding:14px 22px;border-radius:10px;display:inline-block">Abrir o guia</a></p>
    <p style="font-size:13px;color:#64748b">Guarde este e-mail para voltar ao guia quando quiser.</p>
    <div style="margin-top:22px;padding:16px 18px;background:#fffbea;border:1px solid #fde68a;border-radius:12px;line-height:1.5;color:#334155;font-size:14px">
      <b>P.S.:</b> quer o currículo já pronto, sem montar do zero? O <b>Kit Currículo Europeu Pro</b> monta o seu com textos da sua profissão (em português de Portugal ou inglês), escreve a carta de apresentação e mostra onde enviar. <b>€9,90</b> na oferta de boas-vindas, que vale por 48 horas (depois o kit custa €14,90). Garantia de 7 dias.
      <br><a href="${link}#oferta" style="color:#1d4ed8;font-weight:700">Ver o Kit Currículo Pro →</a>
    </div>
  </div></div>`;
}

// A página do guia pergunta quando a pessoa se cadastrou, para contar o prazo real da oferta de boas-vindas.
// Só devolve a data, nada de nome ou e-mail.
export async function GET(req: Request) {
  const k = new URL(req.url).searchParams.get("k") ?? "";
  if (!/^[a-z0-9]{20,40}$/i.test(k)) return NextResponse.json({ ok: false }, { status: 400 });
  const lead = await db.courseLead.findUnique({ where: { id: k }, select: { createdAt: true, product: true } });
  if (!lead || lead.product !== "curriculo-europeu") return NextResponse.json({ ok: false }, { status: 404 });
  return NextResponse.json({ ok: true, since: lead.createdAt.toISOString() }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Confira nome e e-mail." }, { status: 400 });
  const { website: _bot, ...d } = parsed.data;
  const existing = await db.courseLead.findUnique({ where: { product_email: { product: d.product, email: d.email } } });
  const lead = existing
    ? await db.courseLead.update({ where: { id: existing.id }, data: { name: d.name, whatsapp: d.whatsapp || undefined, country: d.country || undefined } })
    : await db.courseLead.create({ data: d });

  if (!existing) {
    const tasks: Promise<unknown>[] = [
      sendEmail(
        NOTIFY,
        d.product === "curriculo-pro" ? `💶 Quer comprar o Currículo Pro: ${d.email}` : `Novo contato: ${d.product}`,
        `<p><b>${esc(d.name)}</b><br>${esc(d.email)}<br>WhatsApp: ${esc(d.whatsapp)}<br>País: ${esc(d.country)}<br>Origem: ${esc(d.source)}</p>`,
      ),
    ];
    if (d.product === "curriculo-europeu") {
      const base = (process.env.APP_URL ?? "https://nexopoint.com.br").replace(/\/$/, "");
      tasks.push(sendEmail(d.email, "Seu Guia do Currículo Europeu chegou", guideEmail(d.name.split(" ")[0], `${base}/curriculo-europeu/guia?k=${lead.id}`), FROM));
    }
    await Promise.allSettled(tasks);
  }
  return NextResponse.json({ ok: true, key: lead.id });
}
