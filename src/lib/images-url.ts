/** Endereço da foto; `mini` pede a miniatura (cards, listas, avatares). */
export const imageUrl = (id: string, mini = false) => `/api/imagens/${id}${mini ? "?m" : ""}`;
