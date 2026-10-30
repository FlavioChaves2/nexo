"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const TABS: { href: string; label: string; tipo: string | null; hot?: boolean }[] = [
  { href: "/", label: "Explorar", tipo: null },
  { href: "/quero-comprar", label: "Quero comprar", tipo: null, hot: true },
  { href: "/busca?tipo=CONTA", label: "Contas", tipo: "CONTA" },
  { href: "/busca?tipo=MOEDA", label: "Moedas", tipo: "MOEDA" },
  { href: "/busca?tipo=ITEM", label: "Itens", tipo: "ITEM" },
  { href: "/busca?tipo=GIFT", label: "Gift cards", tipo: "GIFT" },
  { href: "/busca?tipo=SERVICO", label: "Serviços", tipo: "SERVICO" },
];

export function TabsNav() {
  const path = usePathname();
  const tipo = useSearchParams().get("tipo");
  return (
    <ul>
      {TABS.map((t) => {
        const on = t.tipo ? path === "/busca" && tipo === t.tipo : t.href === "/" ? path === "/" : path.startsWith(t.href);
        return (
          <li key={t.label}>
            <Link href={t.href} className={[on && "on", t.hot && "tab-hot"].filter(Boolean).join(" ") || undefined}>
              {t.hot ? <><span className="tab-hot-txt">{t.label}</span><span className="tab-hot-tag">Exclusivo</span></> : t.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
