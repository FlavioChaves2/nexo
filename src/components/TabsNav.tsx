"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const TABS = [
  { href: "/", label: "Explorar", tipo: null },
  { href: "/busca?tipo=CONTA", label: "Contas", tipo: "CONTA" },
  { href: "/busca?tipo=MOEDA", label: "Moedas", tipo: "MOEDA" },
  { href: "/busca?tipo=ITEM", label: "Itens", tipo: "ITEM" },
  { href: "/busca?tipo=GIFT", label: "Gift cards", tipo: "GIFT" },
  { href: "/busca?tipo=SERVICO", label: "Serviços", tipo: "SERVICO" },
  { href: "/quero-comprar", label: "Quero comprar", tipo: null },
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
            <Link href={t.href} className={on ? "on" : undefined}>
              {t.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
