export const LISTING_TYPES = ["CONTA", "MOEDA", "ITEM", "GIFT", "SERVICO"] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

export const TYPE_LABEL: Record<string, string> = {
  CONTA: "Conta",
  MOEDA: "Moeda",
  ITEM: "Item",
  GIFT: "Gift card",
  SERVICO: "Serviço",
};

export const TYPE_PLURAL: Record<string, string> = {
  CONTA: "Contas",
  MOEDA: "Moedas",
  ITEM: "Itens",
  GIFT: "Gift cards",
  SERVICO: "Serviços",
};

export const ORDER_STATUS = {
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  PAGO: "Aguardando entrega",
  ENTREGUE: "Entregue",
  CONCLUIDO: "Concluído",
  DISPUTA: "Em disputa",
  REEMBOLSADO: "Reembolsado",
  CANCELADO: "Cancelado",
} as const;
export type OrderStatus = keyof typeof ORDER_STATUS;

/** Dias até a confirmação automática depois da entrega, por tipo de anúncio.
 *  Conta tem prazo maior por causa do risco de recuperação pelo antigo dono; código e recarga são conferidos na hora. */
export const AUTO_CONFIRM_DAYS: Record<string, number> = { CONTA: 7, SERVICO: 3, ITEM: 3, MOEDA: 1, GIFT: 1 };
export const confirmDays = (type: string) => AUTO_CONFIRM_DAYS[type] ?? 3;
export const daysLabel = (n: number) => (n === 1 ? "1 dia" : `${n} dias`);
/** Minutos de validade do Pix. */
export const PIX_MINUTES = 30;
/** Minutos para pagar no cartão (página do Asaas) antes de o pedido ser cancelado. */
export const CARD_MINUTES = 120;

export const WHAT_YOU_GET: Record<string, string[]> = {
  CONTA: [
    "Login e senha da conta no quadro de entrega do pedido",
    "E-mail original para você trocar e assumir a conta",
    "Garantia de 7 dias contra recuperação pelo antigo dono",
  ],
  MOEDA: ["Crédito direto no seu ID ou código de resgate", "Comprovante da recarga no pedido"],
  GIFT: ["Código digital exibido no pedido", "Instruções de resgate da plataforma"],
  ITEM: ["Oferta de troca enviada para sua conta", "Item com as mesmas características do anúncio"],
  SERVICO: ["Execução combinada pelo chat do pedido", "Valor liberado ao vendedor só quando você confirmar a conclusão"],
};
