import type { Metadata, Viewport } from "next";
import { Sora, Manrope, JetBrains_Mono } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Motion } from "@/components/Motion";
import "./globals.css";

const sora = Sora({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-sora" });
const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-manrope" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "https://nexo-dun-sigma.vercel.app"),
  openGraph: { siteName: "Nexo", locale: "pt_BR", type: "website" },
  title: { default: "Nexo · Marketplace gamer", template: "%s · Nexo" },
  description: "Compre e venda contas, skins, moedas e gift cards com o pagamento protegido até a entrega.",
};

export const viewport: Viewport = { themeColor: "#111311" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sora.variable} ${manrope.variable} ${mono.variable}`}>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
        <Motion />
      </body>
    </html>
  );
}
