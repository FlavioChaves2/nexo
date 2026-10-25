import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.APP_URL ?? "https://nexo-dun-sigma.vercel.app").replace(/\/$/, "");
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/conta", "/pedido", "/checkout", "/api", "/notificacoes"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
