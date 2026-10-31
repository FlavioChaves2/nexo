import { db } from "./db";
import { OrderError, type Tx } from "./orders";
import { activePolicy, bpsLabel, linkModeActive } from "./attribution";
import { money } from "./format";
import { REFERRAL_BPS } from "./referrals";
import { checkoutTotals, planCashback, type PlanCode } from "./plans";

// Ações do admin para lojas, comissões, verificação externa e programa de primeiros vendedores.
// Tudo fica no histórico de ações da equipe (AdminAction).

export class GrowthError extends OrderError {}

export const logAction = (tx: Tx, adminId: string, kind: string, targetId: string, label: string, note = "") =>
  tx.adminAction.create({ data: { adminId, kind, targetId, label, note: note.slice(0, 1000) } });

const pctToBps = (v: string, field: string) => {
  const n = Number(v.trim().replace(",", "."));
  if (!Number.isFinite(n) || n < 0 || n > 30) throw new GrowthError(`${field}: use um número entre 0 e 30 (%).`);
  return Math.round(n * 100);
};
const centsOf = (v: string, field: string) => {
  const n = Number((v.trim() || "0").replace(",", "."));
  if (!Number.isFinite(n) || n < 0 || n > 100) throw new GrowthError(`${field}: valor entre R$ 0 e R$ 100.`);
  return Math.round(n * 100);
};

export type PolicyInput = { standardPct: string; linkPct: string; linkEnabled: boolean; windowHours: string; pixCost: string; pixCostPct: string; otherCost: string; note: string };

/** Salva uma nova versão da política. A anterior continua no histórico e nos pedidos que a usaram. */
export async function savePolicy(adminId: string, input: PolicyInput) {
  const note = input.note.trim();
  if (note.length < 10) throw new GrowthError("Explique o motivo da mudança em pelo menos 10 caracteres (fica no histórico).");
  const standardFeeBps = pctToBps(input.standardPct, "Comissão normal");
  const linkFeeBps = input.linkPct.trim() ? pctToBps(input.linkPct, "Comissão do link do vendedor") : null;
  const windowHours = input.windowHours.trim() ? Number(input.windowHours) : 0;
  if (!Number.isInteger(windowHours) || windowHours < 0 || windowHours > 24 * 90) throw new GrowthError("Janela: número inteiro de horas, até 2160 (90 dias).");
  if (linkFeeBps !== null && linkFeeBps > standardFeeBps) throw new GrowthError("A comissão do link não pode ser maior que a normal.");
  if (input.linkEnabled && (linkFeeBps === null || windowHours < 1)) throw new GrowthError("Para ligar a comissão reduzida, defina a taxa do link e a janela de atribuição.");
  const pixCostBps = input.pixCostPct.trim() ? pctToBps(input.pixCostPct, "Custo do Pix (%)") : 0;
  const data = { standardFeeBps, linkFeeBps, linkEnabled: input.linkEnabled, windowHours, pixCostCents: centsOf(input.pixCost, "Custo fixo do Pix"), pixCostBps, otherCostCents: centsOf(input.otherCost, "Outros custos por pedido"), note: note.slice(0, 500) };
  return db.$transaction(async (tx) => {
    const p = await tx.commissionPolicy.create({ data: { ...data, createdById: adminId } });
    const summary = `normal ${bpsLabel(standardFeeBps)} · link ${linkFeeBps === null ? "—" : bpsLabel(linkFeeBps)} ${input.linkEnabled ? "LIGADA" : "desligada"} · janela ${windowHours}h`;
    await logAction(tx, adminId, "POLITICA_COMISSAO", p.id, summary, note);
    return p;
  });
}

export type SimInput = { priceCents: number; origin: "MARKETPLACE" | "LINK_VENDEDOR"; nexoCouponCents: number; storeCouponCents: number; plan: PlanCode; method: "pix" | "saldo" | "cartao"; referred: number };

/**
 * Simulação de um pedido com a política informada. É uma ESTIMATIVA de margem por pedido:
 * não inclui impostos, estornos, chargebacks, custos fixos (servidores, equipe) nem inadimplência.
 */
export function simulate(policy: Awaited<ReturnType<typeof activePolicy>>, s: SimInput) {
  const gross = Math.max(0, s.priceCents);
  const storeDisc = Math.min(s.storeCouponCents, Math.max(0, gross - 100));
  const itemAfterStore = gross - storeDisc;
  const nexoDisc = Math.min(s.nexoCouponCents, Math.max(0, itemAfterStore - 100));
  const feeBps = linkModeActive(policy) && s.origin === "LINK_VENDEDOR" ? policy.linkFeeBps! : policy.standardFeeBps;
  const commission = Math.round((itemAfterStore * feeBps) / 10000);
  // Mesmo cálculo do checkout real (plano VIP e taxa do cartão sobre o que o comprador paga pelo item).
  const { planCents, cardFeeCents: card, totalCents: buyerPays } = checkoutTotals(itemAfterStore - nexoDisc, s.plan, s.method);
  const sellerNet = itemAfterStore - commission;
  const payCost = s.method === "pix" ? policy.pixCostCents + Math.round((buyerPays * policy.pixCostBps) / 10000) : 0;
  const cashback = planCashback(s.plan, itemAfterStore - nexoDisc);
  const referral = Math.round((gross * REFERRAL_BPS) / 10000) * Math.max(0, Math.min(2, s.referred));
  const revenue = commission + planCents + card;
  const costs = nexoDisc + payCost + cashback + referral + policy.otherCostCents;
  return { feeBps, buyerPays, sellerNet, commission, planCents, card, storeDisc, nexoDisc, payCost, cashback, referral, other: policy.otherCostCents, revenue, costs, margin: revenue - costs };
}

/** Números registrados nos pedidos concluídos (dados reais, mas ainda não é lucro). */
export async function recordedTotals(days: number) {
  const since = new Date(Date.now() - days * 86_400_000);
  const [byOrigin, referral] = await Promise.all([
    db.order.groupBy({ by: ["origin"], where: { status: "CONCLUIDO", completedAt: { gte: since } }, _count: true, _sum: { feeCents: true, discountCents: true, planCents: true, cardFeeCents: true, cashbackCents: true, storeDiscountCents: true } }),
    db.referralEarning.aggregate({ where: { createdAt: { gte: since } }, _sum: { amountCents: true } }),
  ]);
  return { byOrigin, referralCents: referral._sum.amountCents ?? 0 };
}

export const describePolicy = (p: Awaited<ReturnType<typeof activePolicy>>) =>
  `Normal ${bpsLabel(p.standardFeeBps)} · link do vendedor ${p.linkFeeBps === null ? "não definida" : bpsLabel(p.linkFeeBps)} (${linkModeActive(p) ? "ligada" : "desligada"}) · janela ${p.windowHours ? `${p.windowHours} h` : "não definida"} · Pix ${money(p.pixCostCents)}${p.pixCostBps ? ` + ${bpsLabel(p.pixCostBps)}` : ""} · outros ${money(p.otherCostCents)}`;
