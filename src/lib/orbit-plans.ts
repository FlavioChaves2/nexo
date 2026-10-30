// Órbita: destaque pago do anúncio. Sem banco aqui: também é usado em componentes do navegador.

export const ORBIT_PLANS = [
  { days: 1, cents: 200, tag: "" },
  { days: 3, cents: 500, tag: "Mais escolhido" },
  { days: 7, cents: 1000, tag: "Melhor preço" },
] as const;

/** Máximo de dias de Órbita somados à frente (comprar de novo estende o período). */
export const ORBIT_MAX_DAYS = 30;

export const inOrbit = (l: { orbitUntil?: Date | string | null }) => !!l.orbitUntil && new Date(l.orbitUntil).getTime() > Date.now();
