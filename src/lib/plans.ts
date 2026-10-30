// Planos de proteção do comprador (VIP) e taxa do cartão. Usado na tela do checkout e no servidor,
// que sempre recalcula: o valor que vem do navegador nunca é confiado.
// O valor do plano fica com a Nexo; o vendedor recebe sobre o preço do anúncio, como antes.

export type PlanCode = "BASICO" | "VIP" | "PREMIUM";

export const PLANS: Record<PlanCode, { name: string; bps: number; minCents: number; extraDays: number; cashbackBps: number; perks: string[] }> = {
  BASICO: {
    name: "Básico",
    bps: 0,
    minCents: 0,
    extraDays: 0,
    cashbackBps: 0,
    perks: ["Garantia Nexo: dinheiro retido até você receber", "Disputa com mediação da equipe", "Prazo normal para conferir a entrega"],
  },
  VIP: {
    name: "VIP",
    bps: 199, // 1,99%
    minCents: 10,
    extraDays: 2,
    cashbackBps: 50, // 0,5% de volta
    perks: ["+2 dias para conferir a entrega", "Disputa na fila prioritária da equipe", "0,5% de volta em saldo Nexo ao concluir", "Selo VIP no pedido: o vendedor sabe que é cliente VIP"],
  },
  PREMIUM: {
    name: "VIP Premium",
    bps: 349, // 3,49%
    minCents: 15,
    extraDays: 5,
    cashbackBps: 100, // 1% de volta
    perks: ["+5 dias para conferir a entrega", "Prioridade máxima: sua disputa é a primeira da fila", "1% de volta em saldo Nexo ao concluir", "Vendedor avisado para entrega prioritária", "Selo Premium no pedido"],
  },
};

export const PLAN_CODES = Object.keys(PLANS) as PlanCode[];
export const isPlan = (v: unknown): v is PlanCode => typeof v === "string" && v in PLANS;

/** Valor do plano sobre o que o comprador paga pelo item (já com cupom). */
export function planFee(plan: PlanCode, baseCents: number) {
  const p = PLANS[plan];
  return p.bps ? Math.max(p.minCents, Math.round((baseCents * p.bps) / 10000)) : 0;
}

/** Cashback do plano, creditado em saldo quando o pedido é concluído. */
export const planCashback = (plan: string, baseCents: number) => (isPlan(plan) ? Math.round((baseCents * PLANS[plan].cashbackBps) / 10000) : 0);

/** Cartão desligado até existir a verificação do celular por SMS antes do pagamento (antifraude). */
export const CARD_ENABLED = false;
/** Taxa do cartão (repasse do custo do Asaas: 2,99% + R$ 0,49), paga pelo comprador. */
export const CARD_BPS = 299;
export const CARD_FIXED_CENTS = 49;
export const CARD_MIN_CENTS = 500; // o Asaas não aceita cartão abaixo de R$ 5,00
export const cardFee = (cents: number) => Math.round((cents * CARD_BPS) / 10000) + CARD_FIXED_CENTS;

export type PayMethod = "pix" | "saldo" | "cartao";

/** Quanto o comprador paga no total, separado em partes para o resumo. */
export function checkoutTotals(baseCents: number, plan: PlanCode, method: PayMethod) {
  const planCents = planFee(plan, baseCents);
  const cardFeeCents = method === "cartao" ? cardFee(baseCents + planCents) : 0;
  return { planCents, cardFeeCents, totalCents: baseCents + planCents + cardFeeCents };
}
