import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Há um package-lock.json solto na pasta do usuário; fixa a raiz neste projeto.
  outputFileTracingRoot: __dirname,
  // A imagem de cada loja é gerada na hora e lê as fontes e o ícone do disco: inclui esses arquivos na função.
  outputFileTracingIncludes: {
    "/loja/[username]/opengraph-image": [
      "./node_modules/@fontsource/sora/files/sora-latin-800-normal.woff",
      "./node_modules/@fontsource/manrope/files/manrope-latin-700-normal.woff",
      "./public/app/icon-192.png",
    ],
  },
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
      // Material dos divulgadores: só abre com o link, e o Google não guarda.
      { source: "/divulgadores-oyikbtkx/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }] },
      { source: "/divulgadores-oyikbtkx", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }] },
    ];
  },
  async rewrites() {
    return [{ source: "/divulgadores-oyikbtkx", destination: "/divulgadores-oyikbtkx/index.html" }];
  },
  experimental: {
    serverActions: { allowedOrigins: ["*.trycloudflare.com"], bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
