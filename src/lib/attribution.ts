import { cookies } from "next/headers";
import type { CommissionPolicy } from "@prisma/client";
import { db } from "./db";
import { FEE_BPS } from "./format";

// Origem da venda e comissão. Regras completas em docs/lojas-vendedor.md ("Política de atribuição").
// Resumo: o primeiro contato com o vendedor dentro da janela decide; sem dados, é marketplace.

export const VISITOR_COOKIE = "nexo_vid";
export type Origin = "MARKETPLACE" | "LINK_VENDEDOR";
export const ORIGIN_LABEL: Record<string, string> = { MARKETPLACE: "Marketplace da Nexo", LINK_VENDEDOR: "Link do vendedor" };

/** Sem janela definida pelo admin, a origem ainda é calculada só para relatório (não muda a comissão). */
const REPORT_WINDOW_HOURS = 30 * 24;
const DEDUPE_MS = 60 * 60_000;

export type ActivePolicy = Pick<CommissionPolicy, "standardFeeBps" | "linkFeeBps" | "linkEnabled" | "windowHours" | "pixCostCents" | "pixCostBps" | "otherCostCents"> & { id: string | null; createdAt: Date | null };

/** Política vigente: a versão mais recente salva pelo admin, ou a cobrança atual (9,79%, sem modalidade reduzida). */
export async function activePolicy(): Promise<ActivePolicy> {
  const p = await db.commissionPolicy.findFirst({ orderBy: { createdAt: "desc" } });
  if (p) return p;
  return { id: null, createdAt: null, standardFeeBps: FEE_BPS, linkFeeBps: null, linkEnabled: false, windowHours: 0, pixCostCents: 0, pixCostBps: 0, otherCostCents: 0 };
}

/** A modalidade reduzida só vale com taxa e janela definidas e ligada pelo admin. */
export const linkModeActive = (p: ActivePolicy) => p.linkEnabled && p.linkFeeBps !== null && p.windowHours > 0;

export async function visitorId() {
  try {
    const v = (await cookies()).get(VISITOR_COOKIE)?.value;
    return v && /^[a-f0-9-]{36}$/.test(v) ? v : null;
  } catch {
    return null; // fora de uma requisição
  }
}

/** Grava um ponto de contato com o vendedor. Repetições na mesma hora são ignoradas. */
export async function recordTouch(t: { sellerId: string; source: Origin; userId?: string | null; listingId?: string | null; visitorId?: string | null }) {
  const vid = t.visitorId === undefined ? await visitorId() : t.visitorId;
  if (!vid && !t.userId) return;
  if (t.userId === t.sellerId) return; // o próprio vendedor navegando na loja
  const who = [vid ? { visitorId: vid } : null, t.userId ? { userId: t.userId } : null].filter(Boolean) as object[];
  const recent = await db.attributionTouch.findFirst({
    where: { sellerId: t.sellerId, source: t.source, createdAt: { gte: new Date(Date.now() - DEDUPE_MS) }, OR: who },
    select: { id: true, userId: true },
  });
  if (recent) {
    // Repetição: só liga a conta ao contato feito antes de entrar (mesmo navegador), sem mudar a data.
    if (t.userId && !recent.userId) await db.attributionTouch.update({ where: { id: recent.id }, data: { userId: t.userId } });
    return;
  }
  await db.attributionTouch.create({ data: { sellerId: t.sellerId, source: t.source, userId: t.userId ?? null, visitorId: vid ?? "", listingId: t.listingId ?? null } });
}

/**
 * Decide a origem e a comissão de um pedido, no servidor, na hora de criar o pedido.
 * Primeiro contato dentro da janela vence; nenhum contato = marketplace.
 */
export async function decideOrigin(input: { buyerId: string; sellerId: string; visitorId?: string | null }) {
  const policy = await activePolicy();
  const active = linkModeActive(policy);
  const hours = policy.windowHours > 0 ? policy.windowHours : REPORT_WINDOW_HOURS;
  const vid = input.visitorId === undefined ? await visitorId() : input.visitorId;
  const who = [{ userId: input.buyerId }, ...(vid ? [{ visitorId: vid }] : [])];
  const first = await db.attributionTouch.findFirst({
    where: { sellerId: input.sellerId, createdAt: { gte: new Date(Date.now() - hours * 3_600_000) }, OR: who },
    orderBy: { createdAt: "asc" },
    select: { source: true },
  });
  const origin: Origin = first?.source === "LINK_VENDEDOR" ? "LINK_VENDEDOR" : "MARKETPLACE";
  const feeBps = active && origin === "LINK_VENDEDOR" ? policy.linkFeeBps! : policy.standardFeeBps;
  return { origin, feeBps, policyId: policy.id, policy };
}

export const feeForBps = (cents: number, bps: number) => Math.round((cents * bps) / 10000);

export const bpsLabel = (bps: number) => `${(bps / 100).toFixed(2).replace(/\.?0+$/, "").replace(".", ",")}%`;
