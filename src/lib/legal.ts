// Dados de quem opera a Nexo, mostrados nos termos de uso, na política de privacidade e no rodapé.
// Por escolha do dono, aparece o nome fantasia em vez da razão social do MEI; CNPJ e cidade conforme a Receita Federal.

export const LEGAL = {
  brand: "Nexo Marketplace",
  site: "nexopoint.com.br",
  document: "CNPJ 64.162.695/0001-90",
  city: "Barra de Santa Rosa/PB", // foro e endereço de contato
  updated: "31/10/2026",
};

/** "Nexo Marketplace (CNPJ ...)" ou só a marca enquanto o CNPJ não for preenchido. */
export const operator = () => (LEGAL.document ? `${LEGAL.brand} (${LEGAL.document})` : LEGAL.brand);
