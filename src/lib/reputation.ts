// Níveis de vendedor: sobem com vendas concluídas e nota média.

export type SellerRep = {
  completedSales: number;
  ratingSum: number;
  ratingCount: number;
  verification?: string;
  titles?: { title: { name: string; emoji: string; color: string; description: string } }[];
};

const LEVELS = [
  { name: "Diamante", cls: "diamante", sales: 500, avg: 4.8 },
  { name: "Ouro", cls: "ouro", sales: 100, avg: 4.7 },
  { name: "Prata", cls: "prata", sales: 25, avg: 4.5 },
  { name: "Bronze", cls: "bronze", sales: 5, avg: 0 },
  { name: "Novato", cls: "novato", sales: 0, avg: 0 },
] as const;

export const avgRating = (r: SellerRep) => (r.ratingCount ? r.ratingSum / r.ratingCount : 0);

export function sellerLevel(r: SellerRep) {
  const avg = avgRating(r);
  return LEVELS.find((l) => r.completedSales >= l.sales && (l.avg === 0 || avg >= l.avg)) ?? LEVELS[LEVELS.length - 1];
}

/** Próximo nível e o que falta, para mostrar ao vendedor. */
export function nextLevel(r: SellerRep) {
  const i = LEVELS.findIndex((l) => l.name === sellerLevel(r).name);
  if (i <= 0) return null;
  const next = LEVELS[i - 1];
  return { name: next.name, salesLeft: Math.max(0, next.sales - r.completedSales), avg: next.avg };
}

export const LEVEL_TABLE = [...LEVELS].reverse();
