// Taxa zero de boas-vindas: pedidos criados nas primeiras 72 horas da conta do vendedor
// não pagam comissão à Nexo. Vale para todo vendedor novo, uma vez (conta nova, prazo novo,
// mas o cadastro barra e-mail descartável e o mesmo IP em série).
// A comissão do pedido é fixada na criação (decideOrigin): o que vale é a data do pedido, não a da conclusão.

export const WELCOME_FEE_HOURS = 72;

export const welcomeFeeUntil = (createdAt: Date) => new Date(createdAt.getTime() + WELCOME_FEE_HOURS * 3_600_000);

export const inWelcomeFee = (createdAt: Date, now = new Date()) => now < welcomeFeeUntil(createdAt);

/** "sexta, 08/11 às 16:34" */
export const welcomeFeeLabel = (createdAt: Date) =>
  welcomeFeeUntil(createdAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).replace(",", "").replace(" ", ", ").replace(/, (\d{2}:\d{2})$/, " às $1");
