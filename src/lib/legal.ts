// Dados de quem opera a Nexo, mostrados nos termos de uso e na política de privacidade.
// Preencha razão social e CNPJ (ou nome e CPF do responsável, se for pessoa física) quando estiverem definidos.

export const LEGAL = {
  brand: "Nexo",
  site: "nexopoint.com.br",
  company: "", // ex.: "Nexo Tecnologia Ltda."
  document: "", // ex.: "CNPJ 00.000.000/0001-00"
  city: "", // ex.: "João Pessoa/PB" (foro e endereço de contato)
  updated: "31/10/2026",
};

/** "Nexo (Nexo Tecnologia Ltda., CNPJ ...)" ou só "Nexo" enquanto os dados não forem preenchidos. */
export const operator = () => [LEGAL.brand, [LEGAL.company, LEGAL.document].filter(Boolean).join(", ")].filter(Boolean).join(" · ");
