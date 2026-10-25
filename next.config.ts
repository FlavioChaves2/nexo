import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Há um package-lock.json solto na pasta do usuário; fixa a raiz neste projeto.
  outputFileTracingRoot: __dirname,
  // Permite testar por um link temporário do Cloudflare Tunnel.
  allowedDevOrigins: ["*.trycloudflare.com"],
  experimental: {
    serverActions: { allowedOrigins: ["*.trycloudflare.com"] },
  },
};

export default nextConfig;
