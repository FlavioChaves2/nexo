import { Suspense } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { money } from "@/lib/format";
import { isMockPayments } from "@/lib/payments";
import { Logo } from "./Logo";
import { Icon } from "./Icon";
import { TabsNav } from "./TabsNav";

export async function Header() {
  const user = await getCurrentUser();
  const [favCount, unread] = user
    ? await Promise.all([
        db.favorite.count({ where: { userId: user.id } }),
        db.notification.count({ where: { userId: user.id, readAt: null } }),
      ])
    : [0, 0];

  return (
    <>
      {isMockPayments() && (
        <div className="concept">
          <div className="wrap">
            <b>AMBIENTE DE TESTE</b>
            <span>Pagamentos Pix simulados · Nenhuma cobrança é real</span>
          </div>
        </div>
      )}
      <header className="top">
        <div className="wrap top-inner">
          <Logo />
          <form className="search" action="/busca" role="search">
            <Icon name="search" />
            <input name="q" type="search" placeholder="O que você quer encontrar hoje?" aria-label="Buscar na Nexo" />
            <kbd>↵</kbd>
          </form>
          <nav className="acoes" aria-label="Conta">
            <Link className={`icon-btn${favCount ? " has" : ""}`} href="/conta?aba=favoritos" aria-label="Favoritos">
              <Icon name="heart" />
              <sub>{favCount}</sub>
            </Link>
            {user ? (
              <>
                <Link className="icon-btn bell" href="/notificacoes" aria-label={unread ? `Avisos, ${unread} novos` : "Avisos"}>
                  <Icon name="bell" />
                  {unread > 0 && <span className="dot">{unread > 9 ? "9+" : unread}</span>}
                </Link>
                {user.role === "ADMIN" && (
                  <Link className="icon-btn" href="/admin">
                    <Icon name="shield" />
                    <span className="lbl">Admin</span>
                  </Link>
                )}
                <Link className="icon-btn" href="/conta?aba=compras">
                  <Icon name="bag" />
                  <span className="lbl">Pedidos</span>
                </Link>
                <Link className="icon-btn" href="/conta">
                  <Icon name="user" />
                  <span className="lbl">{user.username}</span>
                  <span className="saldo">{money(user.balanceCents)}</span>
                </Link>
              </>
            ) : (
              <Link className="icon-btn" href="/entrar">
                <Icon name="user" />
                <span className="lbl">Entrar</span>
              </Link>
            )}
            <Link className="btn btn-primary" href="/vender">
              + Vender
            </Link>
          </nav>
        </div>
        <nav className="tabs-nav" aria-label="Categorias">
          <div className="wrap">
            <Suspense fallback={<ul />}>
              <TabsNav />
            </Suspense>
            <span className="tagline">
              FEITO PARA QUEM JOGA <Icon name="arrow" />
            </span>
          </div>
        </nav>
      </header>
    </>
  );
}
