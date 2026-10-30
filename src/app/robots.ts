import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.APP_URL ?? "https://nexopoint.com.br").replace(/\/$/, "");
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/conta", "/pedido", "/checkout", "/api", "/notificacoes", "/quero-comprar/novo", "/vender", "/entrar", "/cadastro"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
