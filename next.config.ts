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
      { source: "/cv-pro-ba56bcbef8/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }] },
      { source: "/cv-pro-ba56bcbef8", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }] },
    ];
  },
  async rewrites() {
    return [
      { source: "/divulgadores-oyikbtkx", destination: "/divulgadores-oyikbtkx/index.html" },
      // Teste de 15/11: quem clica no anúncio já abre o guia (a página de entrada antiga foi renomeada para entrada.html, senão a Vercel a serve no lugar do guia).
      { source: "/curriculo-europeu", destination: "/curriculo-europeu/guia.html" },
      { source: "/curriculo-europeu/guia", destination: "/curriculo-europeu/guia.html" },
      { source: "/curriculo-europeu/pro", destination: "/curriculo-europeu/pro.html" },
      { source: "/cv-pro-ba56bcbef8", destination: "/cv-pro-ba56bcbef8/index.html" },
      { source: "/ceia-natal", destination: "/ceia-natal/index.html" },
      { source: "/ceia-natal/janeiro", destination: "/ceia-natal/janeiro.html" },
      { source: "/ceia-natal/listas-janeiro", destination: "/ceia-natal/listas-janeiro.html" },
      { source: "/ceia-natal/obrigado", destination: "/ceia-natal/obrigado.html" },
      { source: "/ceia-natal/acesso-7k2q9x", destination: "/ceia-natal/acesso-7k2q9x/index.html" },
    ];
  },
  experimental: {
    serverActions: { allowedOrigins: ["*.trycloudflare.com"], bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
