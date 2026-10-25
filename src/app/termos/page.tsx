import { DocPage } from "@/components/DocPage";

export const metadata = { title: "Termos de uso" };

export default function TermosPage() {
  return (
    <DocPage eyebrow="Legal" title="Termos de uso" updated="25/10/2026" draft>
      <p>Estes termos valem para quem usa a Nexo, para comprar ou vender. Ao criar uma conta, você concorda com eles.</p>

      <h2>1. O que a Nexo faz</h2>
      <p>A Nexo é uma plataforma que conecta compradores e vendedores de bens digitais de jogos (contas, itens, moedas, gift cards e serviços). A Nexo não é dona dos itens anunciados: ela intermedeia o pagamento e guarda o valor até a entrega ser confirmada (Garantia Nexo).</p>

      <h2>2. Conta</h2>
      <ul>
        <li>Você precisa ter 18 anos ou mais para vender. Menores só podem comprar com autorização e acompanhamento dos responsáveis.</li>
        <li>Os dados informados devem ser verdadeiros. Cada pessoa pode ter uma conta de vendedor (um CPF por conta).</li>
        <li>Você é responsável pela senha e por tudo feito na sua conta. Recomendamos ativar o login em duas etapas.</li>
      </ul>

      <h2>3. Como funciona a Garantia Nexo</h2>
      <ol>
        <li>O comprador paga via Pix e o valor fica retido pela Nexo.</li>
        <li>O vendedor entrega pelo pedido (ou a entrega automática envia o código).</li>
        <li>O comprador tem 3 dias, a partir da entrega, para confirmar ou abrir uma disputa. Sem resposta, o pedido é confirmado automaticamente.</li>
        <li>Na confirmação, o valor menos a taxa vai para o saldo do vendedor.</li>
      </ol>
      <p>Contas de jogos têm 7 dias extras de garantia contra recuperação pelo antigo dono.</p>

      <h2>4. Regras para vendedores</h2>
      <ul>
        <li>Anunciar só o que você tem e pode entregar, com descrição fiel e fotos reais.</li>
        <li>Proibido: itens roubados ou obtidos por fraude, contas hackeadas, cheats, programas maliciosos, conteúdo ilegal ou que viole direitos de terceiros.</li>
        <li>Toda negociação e pagamento acontecem na Nexo. Pedir pagamento por fora leva à suspensão da conta.</li>
        <li>A taxa da Nexo é de 9,9% sobre cada venda concluída. Anunciar é grátis.</li>
        <li>Para sacar, é preciso confirmar o e-mail e verificar a identidade. Contas novas têm limite de saque nos primeiros 7 dias.</li>
      </ul>

      <h2>5. Regras para compradores</h2>
      <ul>
        <li>Confira a entrega antes de confirmar. Depois de confirmado, o pedido não pode mais ser contestado.</li>
        <li>Disputas falsas ou abusivas podem levar à suspensão.</li>
      </ul>

      <h2>6. Disputas</h2>
      <p>Em uma disputa, a equipe da Nexo analisa a conversa do pedido, a entrega e as provas das duas partes, e decide liberar o valor ao vendedor ou devolvê-lo ao comprador. A decisão é registrada no pedido.</p>

      <h2>7. Termos dos jogos</h2>
      <p>Alguns jogos proíbem a venda de contas ou itens nos próprios termos. Vendedor e comprador são responsáveis por conhecer esses termos e assumir esse risco, inclusive o de a conta ser suspensa pela empresa do jogo.</p>

      <h2>8. Suspensão e remoção</h2>
      <p>A Nexo pode remover anúncios e suspender contas que violem estes termos, informando o motivo. Valores em pedidos abertos seguem as regras de disputa.</p>

      <h2>9. Responsabilidade</h2>
      <p>A Nexo responde pela guarda e pelo repasse dos valores conforme estes termos. A Nexo não responde por ações das empresas dos jogos nem pelo uso dos itens fora da plataforma.</p>

      <h2>10. Contato e mudanças</h2>
      <p>Avisaremos mudanças importantes nestes termos com antecedência pelo site. Dúvidas: pela central de ajuda.</p>
    </DocPage>
  );
}
