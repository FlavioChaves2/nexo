import type { Metadata, Viewport } from "next";
import { Sora, Manrope, JetBrains_Mono } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Motion } from "@/components/Motion";
import { NavProgress } from "@/components/NavProgress";
import { HelperBot } from "@/components/HelperBot";
import { Suspense } from "react";
import "./globals.css";

const sora = Sora({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-sora" });
const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-manrope" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "https://nexopoint.com.br"),
  openGraph: { siteName: "Nexo", locale: "pt_BR", type: "website" },
  title: { default: "NEXO - Comprar e vender Contas, Skins, Moedas e Gift Cards de Jogos", template: "%s | NEXO" },
  description: "Compre e venda contas, skins, moedas e gift cards com o pagamento protegido até a entrega.",
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
      </body>
    </html>
  );
}
