import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getCurrentUser, safeNext } from "@/lib/auth";

export const metadata = { title: "Criar conta" };

export default async function CadastroPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (await getCurrentUser()) redirect(next);
  return (
    <div className="wrap">
      <div className="auth stack">
        <div className="grid-gap">
          <span className="eyebrow">Player to player</span>
          <h1 style={{ fontSize: 34 }}>Criar sua conta</h1>
          <p className="muted">Uma conta serve para comprar e vender.</p>
        </div>
        <AuthForm mode="register" next={next} />
      </div>
    </div>
  );
}
