import { NextResponse } from "next/server";
import { paymentProvider } from "@/lib/payments";

// Ponto de entrada para o gateway avisar que um Pix foi pago.
// Ao conectar o gateway: valide a assinatura do webhook, consulte o pagamento
// na API do gateway pelo id recebido, ache o pedido por Order.paymentId e
// chame markOrderPaid(order.id) de src/lib/orders.ts. Nunca confie só no corpo da requisição.
export async function POST() {
  return NextResponse.json(
    { error: `Webhook ainda não implementado para o provedor "${paymentProvider()}".` },
    { status: 501 },
  );
}
