"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Mini Nexinho ajudante no canto da tela. É um SVG leve (sem 3D) com dicas que mudam
// conforme a página. Fica escondido no admin e lembra se a pessoa o dispensou.
const TIPS: { match: (p: string) => boolean; tips: { q: string; a: string; href?: string; cta?: string }[] }[] = [
  {
    match: (p) => p.startsWith("/checkout"),
    tips: [
      { q: "Meu dinheiro está seguro?", a: "Sim. O Pix fica retido na Nexo e só vai para o vendedor depois que você confirmar que recebeu." },
      { q: "Por que pedem meu CPF?", a: "O Banco Central exige o CPF de quem paga para gerar o Pix. Ele vai direto para o Asaas e não aparece para o vendedor." },
    ],
  },
  {
    match: (p) => p.startsWith("/pedido"),
    tips: [
      { q: "O vendedor não entregou?", a: "Use o botão “Tive um problema” para abrir uma disputa. O valor continua retido até a equipe decidir." },
      { q: "Já recebi, e agora?", a: "Confirme o recebimento e avalie o vendedor. Isso ajuda toda a comunidade." },
    ],
  },
  {
    match: (p) => p.startsWith("/vender") || p.includes("aba=vendas"),
    tips: [
      { q: "Como vender mais rápido?", a: "Fotos reais, título claro e entrega automática para códigos. Anúncios assim vendem mais." },
      { q: "Quando recebo?", a: "Quando o comprador confirma a entrega (ou automaticamente após 3 dias sem disputa).", href: "/ajuda", cta: "Ver regras" },
    ],
  },
  {
    match: () => true,
    tips: [
      { q: "Como funciona a garantia?", a: "Você paga, o dinheiro fica com a Nexo, o vendedor entrega e só recebe quando você confirma.", href: "/ajuda", cta: "Saiba mais" },
      { q: "Quero vender algo", a: "Criar anúncio é grátis. A taxa só é cobrada quando você vende.", href: "/vender", cta: "Criar anúncio" },
      { q: "Preciso de ajuda", a: "Veja as dúvidas mais comuns na central de ajuda.", href: "/ajuda", cta: "Central de ajuda" },
    ],
  },
];

export function HelperBot() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [gone, setGone] = useState(true);
  const [pick, setPick] = useState<number | null>(null);

  useEffect(() => {
    try {
      setGone(sessionStorage.getItem("nexo-helper") === "off");
    } catch {
      setGone(false);
    }
  }, []);
  useEffect(() => {
    setOpen(false);
    setPick(null);
  }, [path]);

  if (gone || path.startsWith("/admin")) return null;
  const tips = TIPS.find((t) => t.match(path + location.search))!.tips;
  const tip = pick !== null ? tips[pick] : null;

  return (
    <div className={`helper${open ? " open" : ""}`}>
      {open && (
        <div className="helper-card" role="dialog" aria-label="Ajuda do Nexinho">
          <div className="row">
            <b>Oi! Sou o Nexinho 👋</b>
            <button
              type="button"
              className="helper-x"
              aria-label="Esconder ajudante"
              onClick={() => {
                try {
                  sessionStorage.setItem("nexo-helper", "off");
                } catch {}
                setGone(true);
              }}
            >
              ×
            </button>
          </div>
          {tip ? (
            <div className="helper-answer">
              <b>{tip.q}</b>
              <p>{tip.a}</p>
              <div className="row">
                <button type="button" className="linkish small" onClick={() => setPick(null)}>← Outras dúvidas</button>
                {tip.href && <Link className="btn btn-primary btn-sm" href={tip.href}>{tip.cta}</Link>}
              </div>
            </div>
          ) : (
            <>
              <span className="muted small">Posso ajudar com alguma dessas?</span>
              <div className="helper-qs">
                {tips.map((t, i) => (
                  <button key={t.q} type="button" onClick={() => setPick(i)} style={{ animationDelay: `${i * 0.05}s` }}>{t.q}</button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      <button type="button" className="helper-btn" aria-label={open ? "Fechar ajuda" : "Abrir ajuda do Nexinho"} aria-expanded={open} onClick={() => setOpen(!open)}>
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <line x1="32" y1="6" x2="32" y2="15" stroke="#8FBF22" strokeWidth="3" strokeLinecap="round" />
          <path className="hb-spark" d="M32 1l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" fill="#E4FF8F" />
          <rect x="10" y="14" width="44" height="34" rx="11" fill="#C5F04A" />
          <rect x="16" y="20" width="32" height="20" rx="6" fill="#12160A" />
          <rect className="hb-eye" x="23" y="25" width="5" height="8" rx="2.5" fill="#E4FF8F" />
          <rect className="hb-eye" x="36" y="25" width="5" height="8" rx="2.5" fill="#E4FF8F" />
          <path d="M28 35q4 3 8 0" stroke="#E4FF8F" strokeWidth="2" fill="none" strokeLinecap="round" />
          <rect x="18" y="49" width="28" height="12" rx="5" fill="#8FBF22" />
        </svg>
        {!open && <span className="helper-ping" aria-hidden="true" />}
      </button>
    </div>
  );
}
