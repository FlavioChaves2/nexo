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

/** Dias até a confirmação automática depois da entrega. */
export const AUTO_CONFIRM_DAYS = 3;
/** Minutos de validade do Pix. */
export const PIX_MINUTES = 30;

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
