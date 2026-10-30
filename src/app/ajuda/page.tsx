import Link from "next/link";
import { DocPage } from "@/components/DocPage";

export const metadata = { title: "Central de ajuda", description: "Como comprar, vender, a Garantia Nexo, disputas, taxas e saques." };

const FAQ: [string, string, string][] = [
  ["Comprar", "Como funciona a Garantia Nexo?", "Seu Pix fica retido pela Nexo. O vendedor só recebe depois que você confirma que recebeu, ou automaticamente depois do prazo de conferência se você não abrir disputa. Contas: 7 dias (por causa do risco de recuperação). Itens e serviços: 3 dias. Moedas e gift cards: 1 dia."],
  ["Comprar", "Quanto tempo demora a entrega?", "Anúncios com entrega automática entregam o código na hora. Nos outros, o vendedor entrega pelo pedido e você recebe um aviso."],
  ["Comprar", "Recebi algo errado. E agora?", "Antes de confirmar, clique em “Tive um problema” no pedido e explique. O valor fica retido e um mediador analisa o caso."],
  ["Comprar", "Posso pagar no cartão?", "Por enquanto só Pix, que é aprovado na hora e sem taxa."],
  ["Vender", "Quanto custa vender?", "Anunciar é grátis. A Nexo cobra 9,9% de cada venda concluída. O cálculo de quanto você recebe aparece ao criar o anúncio."],
  ["Vender", "Quando recebo o dinheiro?", "Quando o comprador confirma, ou automaticamente ao fim do prazo de conferência, sem disputa. Contas: 7 dias (por causa do risco de recuperação). Itens e serviços: 3 dias. Moedas e gift cards: 1 dia. O valor entra no seu saldo e você saca por Pix."],
  ["Vender", "Por que preciso verificar minha identidade?", "Para proteger compradores. Só vendedores verificados (nome, CPF e 18+) podem sacar. A verificação também dá o selo de verificado na sua loja."],
  ["Vender", "Como subo de nível?", "Os níveis sobem com vendas concluídas e nota média: Bronze (5 vendas), Prata (25, nota 4,5), Ouro (100, nota 4,7) e Diamante (500, nota 4,8)."],
  ["Conta", "Esqueci minha senha.", "Na tela de entrar, clique em “Esqueci a senha” e siga o link enviado ao seu e-mail."],
  ["Conta", "Como deixo minha conta mais segura?", "Ative o login em duas etapas em Minha conta. Nunca negocie nem pague fora da Nexo."],
];

export default function AjudaPage() {
  const groups = [...new Set(FAQ.map((f) => f[0]))];
  return (
    <DocPage eyebrow="Ajuda" title="Central de ajuda">
      <p>Respostas rápidas sobre como comprar e vender com segurança. Leia também os <Link className="lime" href="/termos">termos de uso</Link>.</p>
      {groups.map((g) => (
        <section key={g} className="stack" style={{ gap: 10 }}>
          <h2>{g}</h2>
          {FAQ.filter((f) => f[0] === g).map(([, q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </section>
      ))}
      <h2>Ainda precisa de ajuda?</h2>
      <p>Se o problema for com um pedido, use o chat do próprio pedido ou abra uma disputa: assim tudo fica registrado e a equipe consegue agir.</p>
    </DocPage>
  );
}
