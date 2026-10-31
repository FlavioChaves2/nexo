const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export const money = (cents: number) => BRL.format(cents / 100);

/** Taxa da Nexo por venda concluída, em pontos-base (979 = 9,79%): 0,2 ponto abaixo dos 9,99% do plano mais barato da GGMax. */
export const FEE_BPS = 979;
export const feeBps = () => FEE_BPS;

export const feeFor = (totalCents: number) => Math.round((totalCents * feeBps()) / 10000);

export const pct = (n: number) => `${n.toFixed(1).replace(".", ",")}%`;

export const dateTime = (d: Date) =>
  d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

export const time = (d: Date) =>
  d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

export const monthYear = (d: Date) =>
  d.toLocaleDateString("pt-BR", { month: "short", year: "numeric", timeZone: "America/Sao_Paulo" }).replace(". de", "/").replace(" de ", "/");

/** Converte "49,90" ou "49.90" em centavos. Retorna NaN se inválido. */
export function parseReais(input: string): number {
  const clean = input.trim().replace(/\s|R\$/g, "");
  const normalized = clean.includes(",") ? clean.replace(/\./g, "").replace(",", ".") : clean;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return NaN;
  return Math.round(Number(normalized) * 100);
}
