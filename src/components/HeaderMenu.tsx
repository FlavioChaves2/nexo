"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { Icon } from "./Icon";

type MenuUser = { username: string; storeName: string; avatarUrl: string | null; balance: string; isAdmin: boolean; favorites: number };

/** Botão do topo que abre o menu da conta. Tudo que não é essencial saiu da barra e mora aqui. */
export function HeaderMenu({ user }: { user: MenuUser | null }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const path = usePathname();

  useEffect(() => setOpen(false), [path]); // trocou de página: fecha
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const name = user ? user.storeName || user.username : "";
  return (
    <div className={`hmenu${open ? " open" : ""}`} ref={box}>
      <button type="button" className="hmenu-btn" aria-haspopup="menu" aria-expanded={open} aria-label="Abrir menu" onClick={() => setOpen((o) => !o)}>
        {user ? (
          user.avatarUrl ? <img className="hmenu-av" src={user.avatarUrl} alt="" /> : <span className="hmenu-av">{name[0]}</span>
        ) : (
          <Icon name="user" />
        )}
        <span className="hmenu-bars" aria-hidden="true"><i /><i /><i /></span>
      </button>

      {open && (
        <div className="hmenu-card" role="menu">
          {user ? (
            <>
              <Link href="/conta" className="hmenu-me" role="menuitem">
                {user.avatarUrl ? <img className="hmenu-av lg" src={user.avatarUrl} alt="" /> : <span className="hmenu-av lg">{name[0]}</span>}
                <span><b>Olá, {name}!</b><small>Ver minha conta</small></span>
              </Link>
              <Link href="/conta?aba=saldo" className="hmenu-saldo" role="menuitem">
                <span><small>Saldo disponível</small><b>{user.balance}</b></span>
                <span className="chip auto">Sacar</span>
              </Link>
              <nav className="hmenu-list">
                <Link href="/conta?aba=compras" role="menuitem"><Icon name="bag" />Minhas compras</Link>
                <Link href="/conta?aba=vendas" role="menuitem"><Icon name="tag" />Minhas vendas</Link>
                <Link href="/conta/painel" role="menuitem"><Icon name="spark" />Painel de vendas</Link>
                <Link href="/conta/propostas" role="menuitem"><Icon name="send" />Propostas por link</Link>
                <Link href="/conta/alertas" role="menuitem"><Icon name="bell" />Meus alertas</Link>
                <Link href="/conta?aba=favoritos" role="menuitem"><Icon name="heart" />Favoritos{user.favorites > 0 && <span className="hmenu-n">{user.favorites}</span>}</Link>
                <Link href="/conta/convites" role="menuitem" className="hot"><Icon name="spark" />Convide e ganhe 3%</Link>
                <Link href="/conta/taxas" role="menuitem"><Icon name="diamond" />Taxas e prazos</Link>
                {user.isAdmin && <Link href="/admin" role="menuitem"><Icon name="shield" />Painel de admin</Link>}
              </nav>
              <nav className="hmenu-list">
                <Link href="/app" role="menuitem"><Icon name="bolt" />Baixar o app</Link>
                <Link href="/ajuda" role="menuitem"><Icon name="chat" />Central de ajuda</Link>
                <Link href="/suporte" role="menuitem"><Icon name="headset" />Falar com o suporte</Link>
                <Link href="/conta/seguranca" role="menuitem"><Icon name="verified" />Segurança da conta</Link>
              </nav>
              <form action={logout} className="hmenu-list">
                <button type="submit" className="hmenu-out" role="menuitem"><Icon name="arrow" />Sair</button>
              </form>
            </>
          ) : (
            <>
              <div className="hmenu-guest">
                <b>Bem-vindo à Nexo!</b>
                <span className="muted small">Entre para comprar, vender e acompanhar seus pedidos.</span>
                <Link className="btn btn-primary btn-block" href="/entrar">Entrar</Link>
                <Link className="btn btn-ghost btn-block" href="/cadastro">Criar conta grátis</Link>
              </div>
              <nav className="hmenu-list">
                <Link href="/quero-comprar" role="menuitem"><Icon name="search" />Quero comprar</Link>
                <Link href="/como-funciona" role="menuitem"><Icon name="shield" />Como funciona</Link>
                <Link href="/app" role="menuitem"><Icon name="bolt" />Baixar o app</Link>
                <Link href="/ajuda" role="menuitem"><Icon name="chat" />Central de ajuda</Link>
              </nav>
            </>
          )}
        </div>
      )}
    </div>
  );
}
