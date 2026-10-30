import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { markOrderPaid, sysMsg } from "@/lib/orders";
import { isPixPaid, paymentProvider, refundPix } from "@/lib/payments";

// O Asaas avisa aqui quando um Pix é pago. O token configurado no painel do Asaas
// (ASAAS_WEBHOOK_TOKEN) vem no cabeçalho asaas-access-token. Mesmo com o token certo,
// o pagamento é conferido de novo na API antes de liberar o pedido.
export async function POST(req: Request) {
  if (paymentProvider() !== "asaas") return NextResponse.json({ error: "Webhook desligado." }, { status: 501 });

  const expected = process.env.ASAAS_WEBHOOK_TOKEN ?? "";
  const got = req.headers.get("asaas-access-token") ?? "";
  if (!expected || got.length !== expected.length || !timingSafeEqual(Buffer.from(got), Buffer.from(expected))) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { event?: string; payment?: { id?: string } } | null;
  const paymentId = body?.payment?.id;
  // Qualquer evento de cobrança serve de gatilho: quem decide se está pago é a consulta à API.
  if (!paymentId || !body?.event?.startsWith("PAYMENT_")) return NextResponse.json({ ok: true });

  const order = await db.order.findFirst({ where: { paymentId } });
  if (!order || !(await isPixPaid(paymentId))) return NextResponse.json({ ok: true });

  if (order.status === "AGUARDANDO_PAGAMENTO") await markOrderPaid(order.id);

  // Pago depois de expirar, ou o anúncio esgotou: devolve o dinheiro na hora.
  const now = await db.order.findUniqueOrThrow({ where: { id: order.id } });
  if (now.status === "CANCELADO" && !now.refundedAt) {
    // Trava antes de estornar: o Asaas às vezes manda o mesmo aviso duas vezes ao mesmo tempo,
    // e sem isso os dois estornariam. Só quem marcar refundedAt primeiro segue.
    const claimed = await db.order.updateMany({ where: { id: now.id, status: "CANCELADO", refundedAt: null }, data: { refundedAt: new Date(), refundId: "processando" } });
    if (claimed.count !== 1) return NextResponse.json({ ok: true });
    try {
      const refund = await refundPix(now);
      await db.$transaction(async (tx) => {
        await tx.order.update({ where: { id: now.id }, data: { refundId: refund.id } });
        await sysMsg(tx, now.id, "O pedido já estava cancelado quando o Pix chegou. O valor foi estornado automaticamente.");
      });
    } catch (e) {
      // Estorno falhou: solta a trava para o próximo aviso do Asaas tentar de novo.
      await db.order.update({ where: { id: now.id }, data: { refundedAt: null, refundId: null } });
      throw e;
    }
  }
  return NextResponse.json({ ok: true });
}
