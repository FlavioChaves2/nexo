import Link from "next/link";
import { DocPage } from "@/components/DocPage";
import { currentFeeBps } from "@/lib/attribution";
import { LEGAL, operator } from "@/lib/legal";
import { AUTO_CONFIRM_DAYS } from "@/lib/constants";
import { PLANS } from "@/lib/plans";
import { REFERRAL_BPS } from "@/lib/referrals";
import { ORBIT_PLANS } from "@/lib/orbit-plans";
import { NEW_ACCOUNT_DAYS, NEW_ACCOUNT_MAX_WITHDRAW } from "@/lib/trust";

export const metadata = { title: "Termos de uso", description: "Regras para comprar e vender na Nexo: Garantia Nexo, taxas, disputas, anúncios proibidos e responsabilidades." };

const p = (bps: number) => `${(bps / 100).toString().replace(".", ",")}%`;
const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default async function TermosPage() {
  const feeNow = await currentFeeBps();
  return (
    <DocPage eyebrow="Legal" title="Termos de uso" updated={LEGAL.updated}>
      <p>Estes termos são o contrato entre você e a {operator()} (“Nexo”), operadora do site {LEGAL.site} e do app da Nexo. Ao criar uma conta ou usar a Nexo para comprar ou vender, você declara que leu e concorda com eles e com a <Link className="lime" href="/privacidade">Política de privacidade</Link>.</p>

      <h2>1. O que a Nexo faz</h2>
      <p>A Nexo é um marketplace que conecta pessoas que compram e vendem bens digitais ligados a jogos: contas, itens, moedas, gift cards, assinaturas e serviços. A Nexo <b>não é dona</b> dos itens anunciados e não os vende em nome próprio. O papel da Nexo é intermediar a negociação: receber o pagamento do comprador, guardar o valor até a entrega ser confirmada (a Garantia Nexo), mediar disputas e repassar o valor ao vendedor.</p>

      <h2>2. Quem pode usar</h2>
      <ul>
        <li>Para <b>vender</b> e sacar valores é preciso ter 18 anos ou mais e verificar a identidade (nome completo, CPF e data de nascimento).</li>
        <li>Menores de 18 anos só podem comprar com autorização e acompanhamento dos pais ou responsáveis, que respondem pelos atos do menor.</li>
        <li>Cada pessoa pode ter uma conta de vendedor (um CPF por conta). Contas criadas para burlar suspensões ou limites serão encerradas.</li>
      </ul>

      <h2>3. Sua conta</h2>
      <ul>
        <li>As informações que você fornece devem ser verdadeiras e atualizadas.</li>
        <li>Você é responsável pela senha e por tudo o que é feito na sua conta. Recomendamos ativar o login em duas etapas em Segurança.</li>
        <li>A equipe da Nexo <b>nunca</b> pede sua senha, código de duas etapas ou pagamento fora do site.</li>
        <li>Você pode excluir sua conta a qualquer momento em <Link className="lime" href="/conta/excluir">Minha conta → Excluir conta</Link>, desde que não haja saldo, saque em análise ou pedido em andamento.</li>
      </ul>

      <h2>4. Como funciona a Garantia Nexo</h2>
      <ol>
        <li>O comprador paga pela Nexo. O valor fica <b>retido</b> e não vai direto para o vendedor.</li>
        <li>O vendedor entrega pelo pedido (quadro de entrega e chat) ou a entrega automática envia o código.</li>
        <li>Depois da entrega, o comprador tem um prazo para conferir: contas {AUTO_CONFIRM_DAYS.CONTA} dias; itens e serviços {AUTO_CONFIRM_DAYS.ITEM} dias; moedas e gift cards {AUTO_CONFIRM_DAYS.GIFT} dia. Nesse prazo ele confirma o recebimento ou abre uma disputa. Sem resposta, o pedido é confirmado automaticamente.</li>
        <li>Com a confirmação, o valor do item, menos a taxa da Nexo, entra no saldo do vendedor.</li>
      </ol>
      <p>Os planos opcionais de proteção do comprador ({PLANS.VIP.name} +{p(PLANS.VIP.bps)} e {PLANS.PREMIUM.name} +{p(PLANS.PREMIUM.bps)}) somam dias ao prazo de conferência, dão prioridade na fila de disputas e devolvem parte do valor em saldo Nexo quando o pedido é concluído. O valor do plano fica com a Nexo e não é devolvido se o pedido for concluído normalmente.</p>

      <h2>5. Pagamentos e preços</h2>
      <ul>
        <li>Os pagamentos são processados por instituição de pagamento parceira (atualmente o Asaas). A Nexo não guarda dados de cartão.</li>
        <li>No Pix e no saldo Nexo, o comprador paga só o preço do anúncio, sem taxa. Quando o pagamento com cartão estiver disponível, a taxa do cartão será mostrada antes de você pagar.</li>
        <li>O Pix gerado expira em 30 minutos. Pedido não pago é cancelado automaticamente.</li>
        <li>O preço é definido pelo vendedor. Cupons da Nexo são descontados da taxa da Nexo; o vendedor recebe sobre o preço cheio.</li>
      </ul>

      <h2>6. Taxas, saldo e saques do vendedor</h2>
      <ul>
        <li>Anunciar é grátis. A Nexo cobra <b>{p(feeNow)}</b> sobre o valor de cada venda concluída. Pedido cancelado ou reembolsado não paga taxa.</li>
        <li>O saldo pode ser sacado por Pix para a chave do <b>CPF verificado</b> do titular da conta. Cada saque é conferido pela equipe antes do envio.</li>
        <li>Para proteger compradores, contas com menos de {NEW_ACCOUNT_DAYS} dias sacam até {brl(NEW_ACCOUNT_MAX_WITHDRAW)} por vez, e só um saque pode ficar em análise por vez.</li>
        <li>A Nexo pode reter o saldo ligado a pedidos em disputa, denúncias ou suspeita de fraude até a análise terminar.</li>
      </ul>

      <h2>7. Serviços pagos para vendedores</h2>
      <ul>
        <li><b>Órbita</b> (destaque do anúncio): {ORBIT_PLANS.map((o) => `${o.days} ${o.days === 1 ? "dia" : "dias"} por ${brl(o.cents)}`).join(", ")}, pagos com o saldo. O anúncio aparece com o selo “Em órbita” no topo da página inicial e da busca, em revezamento com outros anúncios em órbita. A Órbita aumenta a visibilidade, mas não garante vendas, e o valor não é devolvido se o anúncio for pausado, vendido ou removido antes do fim.</li>
      </ul>

      <h2>8. O que pode e o que não pode ser anunciado</h2>
      <p>Anuncie só o que você tem e pode entregar, com título, descrição e fotos fiéis. É <b>proibido</b> anunciar ou entregar:</p>
      <ul>
        <li>contas, itens ou moedas roubados, hackeados ou obtidos com fraude, chargeback ou cartão de terceiros;</li>
        <li>cheats, hacks, bots, programas maliciosos, contas compartilhadas sem autorização do dono ou métodos para burlar sistemas de jogos;</li>
        <li>dados pessoais de terceiros, conteúdo ilegal, adulto, violento ou que viole direitos autorais e marcas;</li>
        <li>qualquer produto ou serviço fora do universo de jogos e assinaturas digitais.</li>
      </ul>

      <h2>9. Contato e pagamento só pela Nexo</h2>
      <p>Toda a negociação acontece dentro da Nexo. No chat do pedido, nos anúncios, nas perguntas, no perfil e no Quero comprar é <b>proibido</b> enviar links, telefone, e-mail, @ de redes sociais ou convite para conversar por WhatsApp, Discord, Telegram, Instagram ou similares, e é proibido combinar pagamento por fora. A Nexo bloqueia automaticamente esse tipo de conteúdo. Tentar contornar o bloqueio leva à suspensão da conta. Negócio feito fora da Nexo não tem Garantia Nexo.</p>
      <p>O quadro de entrega do pedido é a exceção: nele o vendedor pode enviar login, e-mail e senha da conta vendida, que só o comprador vê.</p>

      <h2>10. Entrega e confirmação</h2>
      <ul>
        <li>O vendedor deve entregar o que foi anunciado, no prazo combinado, pelo pedido. Em contas, deve entregar também o acesso ao e-mail original quando anunciado.</li>
        <li>O comprador deve conferir a entrega antes de confirmar. <b>Depois de confirmado, o pedido não pode mais ser contestado na Nexo</b>, porque o valor é liberado ao vendedor.</li>
        <li>O chat do pedido é gravado e serve como prova em caso de disputa.</li>
      </ul>

      <h2>11. Disputas e reembolsos</h2>
      <p>Se a entrega não acontecer ou não corresponder ao anúncio, o comprador abre uma disputa no pedido dentro do prazo de conferência. O valor continua retido. Uma pessoa da equipe analisa a conversa, a entrega e as provas das duas partes e decide liberar o valor ao vendedor ou devolvê-lo ao comprador, registrando o motivo no pedido. Reembolsos de Pix voltam pelo Pix para quem pagou; pagamentos com saldo voltam ao saldo. Disputas falsas ou abusivas podem levar à suspensão.</p>
      <p>Esses termos não limitam os direitos garantidos pelo Código de Defesa do Consumidor quando aplicável.</p>

      <h2>12. Quero comprar</h2>
      <p>O comprador pode publicar um pedido com o que procura e o valor máximo. Vendedores mandam ofertas; a oferta aceita vira um anúncio reservado ao comprador e segue o checkout normal, com a mesma Garantia Nexo.</p>

      <h2>13. Convites, títulos e alertas</h2>
      <ul>
        <li><b>Convide e ganhe:</b> quem convida recebe {p(REFERRAL_BPS)} do valor de cada compra e venda concluída de quem criou a conta pelo seu link, pago da taxa da Nexo. Convites falsos, contas duplicadas ou negociação simulada para gerar comissão cancelam os ganhos e podem levar à suspensão.</li>
        <li><b>Fundadores:</b> os 20 primeiros vendedores reais a concluir uma venda recebem o título Fundador. A Nexo pode retirar títulos de contas suspensas por fraude.</li>
        <li><b>Alertas:</b> você pode salvar buscas para receber avisos de anúncios novos. Os avisos são um serviço de conveniência e podem atrasar ou falhar.</li>
      </ul>

      <h2>14. Jogos, marcas e regras de terceiros</h2>
      <p>Os jogos, marcas, nomes e imagens citados pertencem às respectivas empresas, que não têm relação com a Nexo e não patrocinam nem endossam os anúncios. As imagens dos jogos são usadas só para identificá-los. Alguns jogos proíbem nos próprios termos a venda ou transferência de contas e itens. Vendedor e comprador são responsáveis por conhecer esses termos e assumem o risco, inclusive o de suspensão da conta pela empresa do jogo.</p>

      <h2>15. Suspensão e encerramento</h2>
      <p>A Nexo pode remover anúncios, limitar funções ou suspender contas que violem estes termos ou a lei, informando o motivo. Valores ligados a pedidos abertos seguem as regras de disputa; o saldo livre de uma conta suspensa pode ser retido enquanto houver suspeita de fraude ou obrigação legal.</p>

      <h2>16. Responsabilidade da Nexo</h2>
      <p>A Nexo responde pela guarda e pelo repasse dos valores conforme estes termos e pela mediação das disputas. A Nexo não responde pela qualidade, legalidade ou uso dos itens anunciados além do que está descrito na Garantia Nexo, por ações das empresas dos jogos, nem por negociações feitas fora da plataforma. A Nexo trabalha para manter o site no ar, mas pode haver interrupções para manutenção ou por falhas de terceiros.</p>

      <h2>17. Mudanças nestes termos</h2>
      <p>Podemos atualizar estes termos. Mudanças importantes serão avisadas no site com antecedência. Continuar usando a Nexo depois da mudança significa concordar com a nova versão. Pedidos já pagos seguem as regras da época do pagamento.</p>

      <h2>18. Lei e foro</h2>
      <p>Estes termos seguem as leis brasileiras. Fica eleito o foro do domicílio do consumidor{LEGAL.city ? `; para as demais situações, o foro de ${LEGAL.city}` : ""}.</p>

      <h2>19. Contato</h2>
      <p>Fale com a equipe pelo <Link className="lime" href="/suporte">chat do suporte</Link> ou pela <Link className="lime" href="/ajuda">central de ajuda</Link>.</p>
    </DocPage>
  );
}
