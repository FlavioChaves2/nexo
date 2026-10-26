import Link from "next/link";
import { Icon } from "./Icon";

// Selos de confiança. Só afirmações verdadeiras sobre a Nexo: nada de logos de terceiros
// ou selos de certificação que a plataforma não tem.
const BADGES = [
  { icon: "shield", title: "Garantia Nexo", text: "O dinheiro fica retido até você confirmar a entrega" },
  { icon: "bolt", title: "Pix pelo Asaas", text: "Instituição de pagamento regulada pelo Banco Central" },
  { icon: "check", title: "Conexão segura", text: "Site protegido com criptografia (HTTPS)" },
  { icon: "eye", title: "Dados protegidos", text: "Seu CPF não é mostrado ao vendedor (LGPD)" },
] as const;

export function TrustBadges({ compact = false }: { compact?: boolean }) {
  return (
    <ul className={`trust${compact ? " compact" : ""}`} aria-label="Por que comprar com segurança na Nexo">
      {BADGES.map((b) => (
        <li key={b.title}>
          <span className="trust-ic"><Icon name={b.icon} /></span>
          <span><b>{b.title}</b>{!compact && <small>{b.text}</small>}</span>
        </li>
      ))}
      {compact && <li className="trust-more"><Link href="/ajuda">Como funciona a garantia →</Link></li>}
    </ul>
  );
}
