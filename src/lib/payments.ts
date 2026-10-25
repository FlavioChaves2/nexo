import { randomUUID } from "node:crypto";
import { PIX_MINUTES } from "./constants";

// Camada de pagamento. Hoje só existe o provedor "mock", que simula o Pix.
// Para ligar um gateway real (Mercado Pago, Asaas, Pagar.me), implemente
// createPixCharge para ele e chame markOrderPaid a partir do webhook em
// src/app/api/webhooks/pagamento/route.ts.

export type PixCharge = {
  id: string;
  copyPaste: string;
  expiresAt: Date;
};

export function paymentProvider() {
  return process.env.PAYMENT_PROVIDER ?? "mock";
}

export const isMockPayments = () => paymentProvider() === "mock";

export async function createPixCharge(order: { code: string; totalCents: number }): Promise<PixCharge> {
  const provider = paymentProvider();
  if (provider === "mock") {
    return {
      id: `mock_${randomUUID()}`,
      copyPaste: `NEXO-PIX-TESTE|${order.code}|${order.totalCents}|${randomUUID().slice(0, 8)}`,
      expiresAt: new Date(Date.now() + PIX_MINUTES * 60_000),
    };
  }
  throw new Error(`Provedor de pagamento "${provider}" ainda não foi configurado.`);
}

/** Devolve um Pix ao comprador (disputa decidida a favor dele). */
export async function refundPix(payment: { paymentId: string | null; totalCents: number }): Promise<{ id: string }> {
  if (isMockPayments()) return { id: `mock_refund_${randomUUID()}` };
  throw new Error(`Estorno ainda não implementado para "${paymentProvider()}".`);
}

/** Envia um saque por Pix para a chave do vendedor. */
export async function payoutPix(w: { amountCents: number; pixKey: string }): Promise<{ id: string }> {
  if (isMockPayments()) return { id: `mock_payout_${randomUUID()}` };
  throw new Error(`Saque automático ainda não implementado para "${paymentProvider()}".`);
}
