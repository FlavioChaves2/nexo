// Regras do "Quero comprar".

/** Dias que um pedido fica aberto recebendo ofertas. */
export const WANTED_DAYS = 7;
/** Pedidos abertos ao mesmo tempo por pessoa (evita spam). */
export const WANTED_MAX_OPEN = 5;

/** Filtro de pedido aberto: o vencimento é conferido na hora, sem precisar de rotina agendada. */
export const openWanted = () => ({ status: "ABERTO", expiresAt: { gt: new Date() } });
