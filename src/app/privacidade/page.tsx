import Link from "next/link";
import { DocPage } from "@/components/DocPage";
import { LEGAL, operator } from "@/lib/legal";

export const metadata = { title: "Política de privacidade", description: "Quais dados a Nexo coleta, para quê, com quem compartilha, por quanto tempo guarda e como você exerce seus direitos (LGPD)." };

export default function PrivacidadePage() {
  return (
    <DocPage eyebrow="Legal · LGPD" title="Política de privacidade" updated={LEGAL.updated}>
      <p>Esta política explica como a {operator()} (“Nexo”), controladora dos dados tratados no site {LEGAL.site} e no app da Nexo, coleta, usa, guarda e protege os seus dados pessoais, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018, a LGPD) e o Marco Civil da Internet (Lei 12.965/2014).</p>

      <h2>1. Dados que coletamos</h2>
      <ul>
        <li><b>Cadastro:</b> e-mail, nome de usuário e senha (guardada só como hash criptográfico, nunca em texto).</li>
        <li><b>Perfil público:</b> nome da loja, descrição e foto, se você enviar.</li>
        <li><b>Verificação de vendedor:</b> nome completo, CPF e data de nascimento.</li>
        <li><b>Compras e vendas:</b> anúncios, pedidos, valores, mensagens do chat do pedido, entregas, avaliações, perguntas, denúncias, disputas, ofertas do Quero comprar, saldo e saques.</li>
        <li><b>Pagamento:</b> o CPF de quem paga o Pix (exigência do Banco Central) e a chave Pix de saque. Os dados de pagamento são tratados pelo processador de pagamento.</li>
        <li><b>Suporte:</b> as conversas com a equipe.</li>
        <li><b>Uso do site:</b> alertas salvos, favoritos, contagem de visitas dos anúncios (sem identificar quem visitou) e o registro de qual amigo te convidou.</li>
        <li><b>Segurança e registros:</b> endereço IP, data e hora de acesso e das tentativas de login, e o registro das ações da equipe.</li>
        <li><b>Notificações:</b> se você ativar, o endereço técnico do seu navegador ou celular para receber avisos.</li>
      </ul>

      <h2>2. Para que usamos e com qual base legal</h2>
      <ul>
        <li><b>Executar o contrato com você</b> (art. 7º, V): criar e manter a conta, processar compras, entregas, saldo e saques, mostrar seu perfil e enviar avisos dos seus pedidos.</li>
        <li><b>Cumprir obrigações legais</b> (art. 7º, II): guardar registros de acesso e de transações e atender a autoridades.</li>
        <li><b>Prevenir fraudes e proteger a comunidade</b> (art. 7º, IX e art. 11, II, g): verificar identidade, limitar tentativas de login, analisar disputas e denúncias, bloquear contato externo no chat e aplicar limites a contas novas.</li>
        <li><b>Exercer direitos em processos</b> (art. 7º, VI): usar o histórico do pedido como prova em disputas e reclamações.</li>
        <li><b>Consentimento</b> (art. 7º, I): notificações no celular e alertas, que você pode desligar a qualquer momento.</li>
      </ul>
      <p>Não usamos seus dados para publicidade de terceiros nem tomamos decisões automáticas que afetem você sem revisão humana: suspensões, disputas e saques passam por uma pessoa da equipe.</p>

      <h2>3. Com quem compartilhamos</h2>
      <p><b>Não vendemos seus dados.</b> Compartilhamos só o necessário com:</p>
      <ul>
        <li>o processador de pagamento (atualmente o Asaas), para cobrar, estornar e enviar Pix;</li>
        <li>os serviços de hospedagem e banco de dados (Vercel e Neon) e de envio de e-mails (Resend);</li>
        <li>os serviços de notificação do seu navegador ou celular (Google, Apple, Mozilla), se você ativar;</li>
        <li>a outra parte de um pedido, que vê só seu nome de usuário, seu perfil público e o que vocês trocarem no pedido. CPF e e-mail não aparecem para ela;</li>
        <li>autoridades públicas, quando a lei ou uma ordem judicial exigir.</li>
      </ul>
      <p>Alguns desses fornecedores podem guardar dados em servidores fora do Brasil, com garantias contratuais de proteção compatíveis com a LGPD (art. 33).</p>

      <h2>4. Por quanto tempo guardamos</h2>
      <ul>
        <li>Dados da conta: enquanto ela existir.</li>
        <li>Registros de acesso (IP, data e hora): no mínimo 6 meses, como exige o Marco Civil da Internet (art. 15).</li>
        <li>Pedidos, pagamentos e saques: pelo prazo exigido pela legislação fiscal e para defesa em processos (em geral, 5 anos).</li>
        <li>Quando você exclui a conta, apagamos os dados pessoais e anonimizamos o restante. Os registros de pedidos ficam sem identificar você, porque também pertencem à outra parte e cumprem obrigações legais.</li>
      </ul>

      <h2>5. Seus direitos</h2>
      <p>Pela LGPD (art. 18), você pode pedir: confirmação de que tratamos seus dados, acesso, correção, anonimização ou eliminação de dados desnecessários, portabilidade, informação sobre com quem compartilhamos e revogação do consentimento. Também pode reclamar na Autoridade Nacional de Proteção de Dados (ANPD).</p>
      <ul>
        <li>Corrigir perfil e senha: em <Link className="lime" href="/conta/perfil">Minha conta</Link>.</li>
        <li>Excluir a conta: em <Link className="lime" href="/conta/excluir">Excluir conta</Link>.</li>
        <li>Demais pedidos: pelo <Link className="lime" href="/suporte">chat do suporte</Link>, que é o nosso canal de atendimento ao titular. Respondemos em até 15 dias.</li>
      </ul>

      <h2>6. Segurança</h2>
      <p>Usamos conexão criptografada (HTTPS), senhas com hash, login em duas etapas (obrigatório para a equipe), bloqueio após tentativas erradas de senha, acesso restrito aos dados de verificação e registro de todas as ações administrativas. Nenhum sistema é 100% invulnerável. Se acontecer um incidente de segurança que possa causar risco a você, avisaremos você e a ANPD, como manda a lei.</p>

      <h2>7. Cookies e armazenamento no navegador</h2>
      <ul>
        <li><b>Sessão:</b> mantém você logado (necessário).</li>
        <li><b>Login em duas etapas:</b> guarda por 5 minutos quem está terminando o login (necessário).</li>
        <li><b>Convite:</b> lembra por até 30 dias o link de convite que você abriu, para creditar quem te convidou.</li>
        <li><b>Preferências:</b> o navegador guarda escolhas simples, como esconder o ajudante Nexinho.</li>
      </ul>
      <p>Não usamos cookies de publicidade nem de rastreamento de terceiros.</p>

      <h2>8. Crianças e adolescentes</h2>
      <p>A Nexo não é destinada a menores de 18 anos para vender. Menores só podem comprar com autorização e acompanhamento dos responsáveis. Se soubermos de dados de criança coletados sem consentimento dos pais, eles serão apagados.</p>

      <h2>9. Mudanças nesta política</h2>
      <p>Podemos atualizar esta política. Mudanças importantes serão avisadas no site. A data da última atualização fica no topo da página.</p>

      <h2>10. Contato</h2>
      <p>Dúvidas sobre seus dados: <Link className="lime" href="/suporte">chat do suporte</Link>.</p>
    </DocPage>
  );
}
