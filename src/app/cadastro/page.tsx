import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { cookies } from "next/headers";
import { getCurrentUser, safeNext } from "@/lib/auth";
import { db } from "@/lib/db";
import { REF_COOKIE } from "@/lib/referrals";
import { Icon } from "@/components/Icon";

export const metadata = { title: "Criar conta" };

export default async function CadastroPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (await getCurrentUser()) redirect(next);
  const refId = (await cookies()).get(REF_COOKIE)?.value;
  const inviter = refId ? await db.user.findUnique({ where: { id: refId }, select: { username: true, storeName: true } }) : null;
  return (
    <div className="wrap">
      <div className="auth stack">
        <div className="grid-gap">
          <span className="eyebrow">Player to player</span>
          <h1 style={{ fontSize: 34 }}>Criar sua conta</h1>
          <p className="muted">Uma conta serve para comprar e vender.</p>
        </div>
        {inviter && <div className="note"><Icon name="heart" /><span>Você foi convidado por <b>{inviter.storeName || inviter.username}</b>. Bem-vindo à Nexo!</span></div>}
        <AuthForm mode="register" next={next} />
      </div>
    </div>
  );
}
