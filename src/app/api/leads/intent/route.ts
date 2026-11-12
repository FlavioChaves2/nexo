import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

// Registra quem clicou em "comprar" na página do guia, para o dono poder ir atrás depois.
// Recebe só a chave do contato (k); nome e e-mail vêm do cadastro já existente.
const NOTIFY = "paraibanogames@gmail.com";
const esc = (s: string) => s.replace(/[<>&"]/g, (c) => `&#${c.charCodeAt(0)};`);

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const k = typeof body?.k === "string" ? body.k : "";
  const price = typeof body?.price === "number" ? body.price : 0;
  if (!/^[a-z0-9]{20,40}$/i.test(k)) return NextResponse.json({ ok: false }, { status: 400 });
  const lead = await db.courseLead.findUnique({ where: { id: k } });
  if (!lead || lead.product !== "curriculo-europeu") return NextResponse.json({ ok: false }, { status: 404 });

  const where = { product_email: { product: "curriculo-pro", email: lead.email } };
  const already = await db.courseLead.findUnique({ where });
  const source = `clicou em comprar (€${price.toFixed(2).replace(".", ",")})`;
  if (already) {
    await db.courseLead.update({ where, data: { source } });
  } else {
    await db.courseLead.create({
      data: { product: "curriculo-pro", name: lead.name, email: lead.email, whatsapp: lead.whatsapp, country: lead.country, source },
    });
    await sendEmail(
      NOTIFY,
      `💶 Clicou em comprar o Kit: ${lead.email}`,
      `<p><b>${esc(lead.name)}</b><br>${esc(lead.email)}<br>WhatsApp: ${esc(lead.whatsapp ?? "")}<br>País: ${esc(lead.country ?? "")}<br>${esc(source)}</p>`,
    ).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
