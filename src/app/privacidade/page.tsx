import { DocPage } from "@/components/DocPage";

export const metadata = { title: "Política de privacidade" };

export default function PrivacidadePage() {
  return (
    <DocPage eyebrow="Legal · LGPD" title="Política de privacidade" updated="25/10/2026" draft>
      <p>Esta política explica quais dados a Nexo coleta, para quê e quais são os seus direitos, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018).</p>

      <h2>Dados que coletamos</h2>
      <ul>
        <li><b>Conta:</b> e-mail, nome de usuário, senha (guardada só em forma criptografada) e foto de perfil, se você enviar.</li>
        <li><b>Verificação de vendedor:</b> nome completo, CPF e data de nascimento.</li>
        <li><b>Uso:</b> anúncios, pedidos, mensagens do chat, avaliações, denúncias e perguntas.</li>
        <li><b>Segurança:</b> endereço IP e horário das tentativas de login.</li>
        <li><b>Pagamento:</b> dados do Pix e chave Pix para saque. Dados bancários são tratados pelo processador de pagamento.</li>
      </ul>

      <h2>Para que usamos</h2>
      <ul>
        <li>Fazer a plataforma funcionar: compras, entregas, saldo e saques (execução de contrato).</li>
        <li>Prevenir fraudes e proteger os usuários: verificação de identidade, limite de tentativas e análise de disputas (legítimo interesse e prevenção à fraude).</li>
        <li>Cumprir obrigações legais e fiscais.</li>
        <li>Enviar avisos sobre seus pedidos e sua conta.</li>
      </ul>

      <h2>Com quem compartilhamos</h2>
      <p>Não vendemos seus dados. Compartilhamos só o necessário com o processador de pagamento, o serviço de hospedagem e banco de dados, o serviço de envio de e-mails e autoridades, quando a lei exigir. O outro lado de um pedido vê só seu nome de usuário e o que vocês trocarem no chat.</p>

      <h2>Por quanto tempo guardamos</h2>
      <p>Enquanto sua conta existir e, depois, pelo prazo exigido por lei para registros de transações e prevenção à fraude.</p>

      <h2>Seus direitos</h2>
      <p>Você pode pedir confirmação e acesso aos seus dados, correção, exclusão (respeitando os prazos legais), portabilidade e informações sobre compartilhamento. Faça o pedido pela central de ajuda.</p>

      <h2>Segurança</h2>
      <p>Usamos conexão criptografada, senhas com hash, login em duas etapas (obrigatório para a equipe) e registro de todas as ações administrativas.</p>

      <h2>Cookies</h2>
      <p>Usamos apenas cookies necessários para manter você logado. Não usamos cookies de publicidade.</p>
    </DocPage>
  );
}
