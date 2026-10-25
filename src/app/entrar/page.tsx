import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getCurrentUser, safeNext } from "@/lib/auth";

export const metadata = { title: "Entrar" };

export default async function EntrarPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (await getCurrentUser()) redirect(next);
  return (
    <div className="wrap">
      <div className="auth stack">
        <div className="grid-gap">
          <span className="eyebrow">Bem-vindo de volta</span>
          <h1 style={{ fontSize: 34 }}>Entrar na Nexo</h1>
        </div>
        <AuthForm mode="login" next={next} />
      </div>
    </div>
  );
}
