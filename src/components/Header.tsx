import { Suspense } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { money } from "@/lib/format";
import { isMockPayments } from "@/lib/payments";
import { Logo } from "./Logo";
import { Icon } from "./Icon";
import { TabsNav } from "./TabsNav";
import { HeaderMenu } from "./HeaderMenu";
import { imageUrl } from "@/lib/images-url";

export async function Header() {
  const user = await getCurrentUser();
  const [favCount, unread, me] = user
    ? await Promise.all([
        db.favorite.count({ where: { userId: user.id } }),
        db.notification.count({ where: { userId: user.id, readAt: null } }),
        db.user.findUnique({ where: { id: user.id }, select: { storeName: true, avatarId: true } }),
      ])
    : [0, 0, null];

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
          {/* Barra enxuta: avisos, Vender e o menu da conta (o resto mora no menu). */}
          <nav className="acoes" aria-label="Conta">
            {user && (
              <Link className="icon-btn bell" href="/notificacoes" aria-label={unread ? `Avisos, ${unread} novos` : "Avisos"}>
                <Icon name="bell" />
                {unread > 0 && <span className="dot">{unread > 9 ? "9+" : unread}</span>}
              </Link>
            )}
            <Link className="btn btn-primary" href="/vender">
              + Vender
            </Link>
            <HeaderMenu
              user={
                user
                  ? { username: user.username, storeName: me?.storeName ?? "", avatarUrl: me?.avatarId ? imageUrl(me.avatarId, true) : null, balance: money(user.balanceCents), isAdmin: user.role === "ADMIN", favorites: favCount }
                  : null
              }
            />
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
