// Marcadores de anúncio (Meta). Vazio = desligado: nada é carregado no site.
// Para ligar, cole o ID do Pixel (Gerenciador de Eventos da Meta → Fontes de dados), só números.
export const META_PIXEL_ID = "1380892450588060";

type Fbq = (cmd: "track" | "trackCustom", event: string, params?: Record<string, unknown>) => void;

/** Envia um evento ao Pixel da Meta, se ele estiver ligado e carregado. Nunca quebra a página. */
export function metaTrack(event: string, params?: Record<string, unknown>, custom = false) {
  try {
    const fbq = (window as unknown as { fbq?: Fbq }).fbq;
    fbq?.(custom ? "trackCustom" : "track", event, params);
  } catch { /* bloqueador de anúncio ou Pixel desligado */ }
}
