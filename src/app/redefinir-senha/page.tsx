import { ResetForm } from "@/components/EmailForms";

export const metadata = { title: "Nova senha" };

export default async function RedefinirSenhaPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = (await searchParams).token ?? "";
  return (
    <div className="wrap">
      <div className="auth stack">
        <div className="grid-gap"><span className="eyebrow">Acesso</span><h1 style={{ fontSize: 34 }}>Criar nova senha</h1></div>
        <ResetForm token={token} />
      </div>
    </div>
  );
}
