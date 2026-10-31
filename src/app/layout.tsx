import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Motion } from "@/components/Motion";
import { NavProgress } from "@/components/NavProgress";
import { HelperBot } from "@/components/HelperBot";
import { PwaRegister } from "@/components/PwaRegister";
import { HeaderAutoHide } from "@/components/HeaderAutoHide";
import { WelcomeModal } from "@/components/WelcomeModal";
import { Suspense } from "react";
import "./globals.css";

// Fontes guardadas no projeto (pacotes @fontsource), não baixadas do Google na hora do build:
// quando o Google Fonts falhava, a publicação na Vercel quebrava.
const sora = localFont({
  src: [
    { path: "../../node_modules/@fontsource/sora/files/sora-latin-500-normal.woff2", weight: "500" },
    { path: "../../node_modules/@fontsource/sora/files/sora-latin-600-normal.woff2", weight: "600" },
    { path: "../../node_modules/@fontsource/sora/files/sora-latin-700-normal.woff2", weight: "700" },
    { path: "../../node_modules/@fontsource/sora/files/sora-latin-800-normal.woff2", weight: "800" },
  ],
  variable: "--font-sora",
  display: "swap",
});
const manrope = localFont({
  src: [
    { path: "../../node_modules/@fontsource/manrope/files/manrope-latin-400-normal.woff2", weight: "400" },
    { path: "../../node_modules/@fontsource/manrope/files/manrope-latin-500-normal.woff2", weight: "500" },
    { path: "../../node_modules/@fontsource/manrope/files/manrope-latin-600-normal.woff2", weight: "600" },
    { path: "../../node_modules/@fontsource/manrope/files/manrope-latin-700-normal.woff2", weight: "700" },
    { path: "../../node_modules/@fontsource/manrope/files/manrope-latin-800-normal.woff2", weight: "800" },
  ],
  variable: "--font-manrope",
  display: "swap",
});
const mono = localFont({
  src: [
    { path: "../../node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2", weight: "500" },
    { path: "../../node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff2", weight: "700" },
  ],
  variable: "--font-mono",
  display: "swap",
  preload: false, // só preços e códigos usam: não atrasa a primeira tela
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "https://nexopoint.com.br"),
  openGraph: { siteName: "Nexo", locale: "pt_BR", type: "website" },
  title: { default: "NEXO - Comprar e vender Contas, Skins, Moedas e Gift Cards de Jogos", template: "%s | NEXO" },
  description: "Compre e venda contas, skins, moedas e gift cards com o pagamento protegido até a entrega.",
  appleWebApp: { capable: true, title: "Nexo", statusBarStyle: "black-translucent" },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/app/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/app/apple-touch-icon.png",
  },
};

export const viewport: Viewport = { themeColor: "#111311" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sora.variable} ${manrope.variable} ${mono.variable}`}>
      <body>
        <Suspense fallback={null}><NavProgress /></Suspense>
        <Header />
        <main>{children}</main>
        <Footer />
        <Motion />
        <HelperBot />
        <PwaRegister />
        <HeaderAutoHide />
        <WelcomeModal />
      </body>
    </html>
  );
}
