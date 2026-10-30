import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Há um package-lock.json solto na pasta do usuário; fixa a raiz neste projeto.
  outputFileTracingRoot: __dirname,
  // Permite testar por um link temporário do Cloudflare Tunnel.
  allowedDevOrigins: ["*.trycloudflare.com"],
  // Proteções básicas do navegador: o site não abre dentro de outro (golpe de clique escondido),
  // não vaza o endereço completo para outros sites e não pede câmera/microfone.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      // O service worker precisa vir sempre fresco, senão o app demora a pegar as atualizações.
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache" }] },
    ];
  },
  experimental: {
    serverActions: { allowedOrigins: ["*.trycloudflare.com"], bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
