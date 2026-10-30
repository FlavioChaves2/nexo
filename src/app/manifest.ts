import type { MetadataRoute } from "next";

// Faz o site virar app instalável (Android, PC e iPhone pela "Tela de Início").
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Nexo: contas, skins e gift cards de jogos",
    short_name: "Nexo",
    description: "Compre e venda itens de jogos com o pagamento protegido até a entrega.",
    lang: "pt-BR",
    start_url: "/?app=1",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#111311",
    theme_color: "#111311",
    categories: ["games", "shopping"],
    icons: [
      { src: "/app/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/app/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/app/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Quero comprar", url: "/quero-comprar", icons: [{ src: "/app/icon-192.png", sizes: "192x192" }] },
      { name: "Meus pedidos", url: "/conta?aba=compras", icons: [{ src: "/app/icon-192.png", sizes: "192x192" }] },
      { name: "Vender", url: "/vender", icons: [{ src: "/app/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
