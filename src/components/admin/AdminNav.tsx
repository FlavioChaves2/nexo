"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNav({ disputes, withdrawals, reports, verifications, support, external }: { disputes: number; withdrawals: number; reports: number; verifications: number; support: number; external: number }) {
  const path = usePathname();
  const items = [
    { href: "/admin", label: "Visão geral", n: 0 },
    { href: "/admin/suporte", label: "Suporte", n: support },
    { href: "/admin/disputas", label: "Disputas", n: disputes },
    { href: "/admin/saques", label: "Saques", n: withdrawals },
    { href: "/admin/denuncias", label: "Denúncias", n: reports },
    { href: "/admin/usuarios", label: "Usuários", n: verifications },
    { href: "/admin/anuncios", label: "Anúncios", n: 0 },
    { href: "/admin/cupons", label: "Cupons", n: 0 },
    { href: "/admin/titulos", label: "Títulos", n: 0 },
    { href: "/admin/verificacoes", label: "Perfis externos", n: external },
    { href: "/admin/programa", label: "Primeiros vendedores", n: 0 },
    { href: "/admin/comissoes", label: "Comissões", n: 0 },
  ];
  return (
    <nav className="tabs" aria-label="Painel de admin">
      {items.map((i) => {
        const on = i.href === "/admin" ? path === "/admin" : path.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href} className={on ? "on" : undefined}>
            {i.label}
            {i.n > 0 && <span className="badge">{i.n}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
