// Dados de quem opera a Nexo, mostrados nos termos de uso e na política de privacidade.
// Razão social, CNPJ e cidade conforme o cadastro na Receita Federal.

export const LEGAL = {
  brand: "Nexo",
  site: "nexopoint.com.br",
  company: "64.162.695 PEDRO FLAVIO SILVA CHAVES BATISTA", // razão social oficial do MEI
  document: "CNPJ 64.162.695/0001-90",
  city: "Barra de Santa Rosa/PB",
  updated: "31/10/2026",
};

/** "Nexo (Nexo Tecnologia Ltda., CNPJ ...)" ou só "Nexo" enquanto os dados não forem preenchidos. */
export const operator = () => [LEGAL.brand, [LEGAL.company, LEGAL.document].filter(Boolean).join(", ")].filter(Boolean).join(" · ");
