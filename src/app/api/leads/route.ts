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
const esc = (s: string) => s.replace(/[<>&"]/g, (c) => `&#${c.charCodeAt(0)};`);

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Confira nome e e-mail." }, { status: 400 });
  const { website: _bot, ...d } = parsed.data;
  const lead = await db.courseLead.upsert({
    where: { product_email: { product: d.product, email: d.email } },
    create: d,
    update: { name: d.name, whatsapp: d.whatsapp || undefined, country: d.country || undefined },
  });
  const isNew = Date.now() - lead.createdAt.getTime() < 5000;
  if (isNew) {
    await sendEmail(
      NOTIFY,
      `Novo contato: ${d.product}`,
      `<p><b>${esc(d.name)}</b><br>${esc(d.email)}<br>WhatsApp: ${esc(d.whatsapp)}<br>País: ${esc(d.country)}<br>Origem: ${esc(d.source)}</p>`,
    ).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
