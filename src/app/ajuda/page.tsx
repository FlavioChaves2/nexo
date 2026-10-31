import Link from "next/link";
import { DocPage } from "@/components/DocPage";

export const metadata = { title: "Central de ajuda", description: "Como comprar, vender, a Garantia Nexo, disputas, taxas e saques." };

const FAQ: [string, string, string][] = [
  ["Comprar", "O que são os planos VIP?", "Proteção extra opcional no checkout. VIP (+1,99%): +2 dias para conferir a entrega, disputa na fila prioritária e 0,5% de volta em saldo. VIP Premium (+3,49%): +5 dias para conferir, prioridade máxima na disputa, 1% de volta em saldo e aviso de entrega prioritária ao vendedor. O valor do plano não vai para o vendedor."],
  ["Comprar", "Posso pagar com cartão de crédito?", "Em breve. Por enquanto a Nexo aceita Pix e saldo Nexo, os dois sem taxa e aprovados na hora."],
  ["Comprar", "Como funciona a Garantia Nexo?", "Seu Pix fica retido pela Nexo. O vendedor só recebe depois que você confirma que recebeu, ou automaticamente depois do prazo de conferência se você não abrir disputa. Contas: 7 dias (por causa do risco de recuperação). Itens e serviços: 3 dias. Moedas e gift cards: 1 dia."],
  ["Comprar", "Quanto tempo demora a entrega?", "Anúncios com entrega automática entregam o código na hora. Nos outros, o vendedor entrega pelo pedido e você recebe um aviso."],
  ["Comprar", "Recebi algo errado. E agora?", "Antes de confirmar, clique em “Tive um problema” no pedido e explique. O valor fica retido e um mediador analisa o caso."],
  ["Vender", "Quanto custa vender?", "Anunciar é grátis. A Nexo cobra 9,79% de cada venda concluída, uma das taxas mais baixas do mercado. O cálculo de quanto você recebe aparece ao criar o anúncio."],
  ["Vender", "Quando recebo o dinheiro?", "Quando o comprador confirma, ou automaticamente ao fim do prazo de conferência, sem disputa. Contas: 7 dias (por causa do risco de recuperação). Itens e serviços: 3 dias. Moedas e gift cards: 1 dia. O valor entra no seu saldo e você saca por Pix."],
  ["Vender", "Por que preciso verificar minha identidade?", "Para proteger compradores. Só vendedores verificados (nome, CPF e 18+) podem sacar. A verificação também dá o selo de verificado na sua loja."],
  ["Vender", "O que é a Órbita?", "É o destaque pago da Nexo. Você paga com o saldo (R$ 2 por 1 dia, R$ 5 por 3 dias ou R$ 10 por 7 dias) e o anúncio aparece no topo da página inicial e da busca, com o selo “Em órbita”. Para ativar, abra o anúncio e toque em “Colocar em órbita”."],
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
      <p>Se o problema for com um pedido, fale primeiro com o vendedor no chat do pedido ou abra uma disputa: assim tudo fica registrado e o dinheiro continua retido.</p>
      <p>Para qualquer outra coisa, fale com uma pessoa da equipe pelo chat do suporte. Você recebe um aviso quando a resposta chegar.</p>
      <p><Link className="btn btn-primary" href="/suporte">Falar com o suporte</Link> <Link className="btn btn-ghost" href="/como-funciona">Como funciona a Nexo</Link></p>
    </DocPage>
  );
}
