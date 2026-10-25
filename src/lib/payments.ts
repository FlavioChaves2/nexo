import { randomUUID } from "node:crypto";
import { PIX_MINUTES } from "./constants";
import { validCpf } from "./trust";

// Camada de pagamento. Provedores:
// - "mock": simula o Pix (modo de teste, sem dinheiro real).
// - "asaas": Pix real pelo Asaas (https://docs.asaas.com). Use ASAAS_API_KEY;
//   ASAAS_ENV=production aponta para a conta real, qualquer outro valor usa o sandbox.
// O Asaas avisa os pagamentos em src/app/api/webhooks/pagamento/route.ts.

export type PixCharge = {
  id: string;
  copyPaste: string;
  expiresAt: Date;
};

export type Payer = { name: string; cpf: string; email: string };

export function paymentProvider() {
  return process.env.PAYMENT_PROVIDER ?? "mock";
}

export const isMockPayments = () => paymentProvider() === "mock";

/** O Asaas só gera cobrança com nome e CPF de quem paga. */
export const needsPayerDocument = () => paymentProvider() === "asaas";

export async function createPixCharge(order: { code: string; totalCents: number }, payer?: Payer): Promise<PixCharge> {
  const provider = paymentProvider();
  if (provider === "mock") {
    return {
      id: `mock_${randomUUID()}`,
      copyPaste: `NEXO-PIX-TESTE|${order.code}|${order.totalCents}|${randomUUID().slice(0, 8)}`,
      expiresAt: new Date(Date.now() + PIX_MINUTES * 60_000),
    };
  }
  if (provider === "asaas") {
    if (!payer) throw new Error("Informe nome e CPF de quem paga.");
    const customer = await asaasCustomer(payer);
    const payment = await asaas<{ id: string }>("POST", "/payments", {
      customer,
      billingType: "PIX",
      value: order.totalCents / 100,
      dueDate: new Date().toISOString().slice(0, 10),
      description: `Nexo · pedido ${order.code}`,
      externalReference: order.code,
    });
    const qr = await asaas<{ payload: string }>("GET", `/payments/${payment.id}/pixQrCode`);
    return { id: payment.id, copyPaste: qr.payload, expiresAt: new Date(Date.now() + PIX_MINUTES * 60_000) };
  }
  throw new Error(`Provedor de pagamento "${provider}" ainda não foi configurado.`);
}

/** Confere no gateway se o pagamento foi mesmo recebido (nunca confie só no webhook). */
export async function isPixPaid(paymentId: string) {
  if (isMockPayments()) return false;
  const p = await asaas<{ status: string }>("GET", `/payments/${paymentId}`);
  return p.status === "RECEIVED" || p.status === "CONFIRMED";
}

/** Devolve um Pix ao comprador (disputa decidida a favor dele). */
export async function refundPix(payment: { paymentId: string | null; totalCents: number }): Promise<{ id: string }> {
  if (isMockPayments()) return { id: `mock_refund_${randomUUID()}` };
  if (paymentProvider() === "asaas") {
    if (!payment.paymentId) throw new Error("Pedido sem pagamento para estornar.");
    await asaas("POST", `/payments/${payment.paymentId}/refund`, { value: payment.totalCents / 100 });
    return { id: `refund_${payment.paymentId}` };
  }
  throw new Error(`Estorno ainda não implementado para "${paymentProvider()}".`);
}

/** Envia um saque por Pix para a chave do vendedor. */
export async function payoutPix(w: { id?: string; amountCents: number; pixKey: string }): Promise<{ id: string }> {
  if (isMockPayments()) return { id: `mock_payout_${randomUUID()}` };
  if (paymentProvider() === "asaas") {
    const key = pixKeyFor(w.pixKey);
    const t = await asaas<{ id: string }>("POST", "/transfers", {
      value: w.amountCents / 100,
      operationType: "PIX",
      pixAddressKey: key.value,
      pixAddressKeyType: key.type,
      description: "Saque Nexo",
      externalReference: w.id,
    });
    return { id: t.id };
  }
  throw new Error(`Saque automático ainda não implementado para "${paymentProvider()}".`);
}

/** Descobre o tipo da chave Pix digitada pelo vendedor. */
export function pixKeyFor(raw: string): { type: "CPF" | "CNPJ" | "EMAIL" | "PHONE" | "EVP"; value: string } {
  const key = raw.trim();
  if (key.includes("@")) return { type: "EMAIL", value: key.toLowerCase() };
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key)) return { type: "EVP", value: key.toLowerCase() };
  const digits = key.replace(/\D/g, "");
  if (digits.length === 14 && !key.startsWith("+")) return { type: "CNPJ", value: digits };
  // 11 dígitos pode ser CPF ou celular com DDD: o dígito verificador desempata.
  if (digits.length === 11 && !key.startsWith("+") && validCpf(digits)) return { type: "CPF", value: digits };
  const phone = digits.startsWith("55") && digits.length >= 12 ? digits : `55${digits}`;
  return { type: "PHONE", value: `+${phone}` };
}

async function asaasCustomer(payer: Payer) {
  const cpf = payer.cpf.replace(/\D/g, "");
  const found = await asaas<{ data: { id: string }[] }>("GET", `/customers?cpfCnpj=${cpf}`);
  if (found.data[0]) return found.data[0].id;
  const c = await asaas<{ id: string }>("POST", "/customers", { name: payer.name, cpfCnpj: cpf, email: payer.email, notificationDisabled: true });
  return c.id;
}

async function asaas<T = unknown>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  const key = process.env.ASAAS_API_KEY;
  if (!key) throw new Error("ASAAS_API_KEY não configurada.");
  const base = process.env.ASAAS_ENV === "production" ? "https://api.asaas.com/v3" : "https://api-sandbox.asaas.com/v3";
  const res = await fetch(base + path, {
    method,
    headers: { access_token: key, "Content-Type": "application/json", "User-Agent": "Nexo" },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as { errors?: { description: string }[] }).errors?.map((e) => e.description).join(" ") || `HTTP ${res.status}`;
    throw new Error(`Asaas: ${msg}`);
  }
  return data as T;
}
