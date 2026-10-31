// Bloqueio de contato fora da Nexo: links, telefones, e-mails, @ de redes e convites para
// WhatsApp, Telegram, Discord ou Instagram. Negociar por fora tira a Garantia Nexo e é a porta
// de entrada do golpe. Vale para chat do pedido, anúncios, perguntas, Quero comprar e perfil.
// Não vale para o quadro de entrega (login e e-mail da conta vendida vão lá) nem para o suporte.

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const RULES: [RegExp, string][] = [
  // E-mail primeiro (senão "gmail.com" contaria como link).
  [/[a-z0-9._%+-]+\s*@\s*[a-z0-9-]+\s*\.\s*[a-z]{2,}/, "e-mail"],
  // Links: http, www e endereços com domínio conhecido (inclusive escritos com espaço: "site . com").
  [/https?:\/\/|www\s*\.|\b[a-z0-9-]{2,}\s*\.\s*(com|net|org|gg|io|me|br|xyz|link|ly|app|site|store|shop|tv|co|info|online)\b/, "link"],
  // Convites e encurtadores conhecidos.
  [/wa\.me|discord\s*\.\s*(gg|com)|t\.me\b|bit\.ly|linktr\.ee/, "link"],
  // Telefone brasileiro: (11) 91234-5678, 11 9 1234 5678, +55 11 912345678, 912345678.
  [/(\+?\s*55[\s.-]*)?\(?\b\d{2}\)?[\s.-]*9[\s.-]?\d{4}[\s.-]?\d{4}\b/, "telefone"],
  [/\b\d{10,13}\b/, "telefone"],
  // @ de redes sociais.
  [/(^|[\s(])@[a-z0-9_.]{3,}/, "@ de rede social"],
  // Apps de conversa: chamar para fora.
  [/\b(whats\s*app|whatsapp|whats|zap|zapzap|wpp|telegram|telegran|insta|instagram|facebook|messenger|tiktok)\b/, "contato de rede social"],
  // Discord: só bloqueia quando é para levar a conversa para lá (o produto "Discord Nitro" pode ser anunciado).
  [/\b(me chama|chama|me add|me adiciona|adiciona|add|me acha|fala comigo|meu|minha conta do|servidor do|meu server|entra no)\s+(no |na |o |a )?(discord|dc)\b/, "contato de Discord"],
  [/\b[a-z0-9_.]{2,}#\d{4}\b/, "contato de Discord"],
  // Pagamento por fora.
  [/\b(pix\s+(direto|por fora|fora)|paga\s+por fora|pagar\s+por fora|por fora\s+(do site|da nexo)|fora (do site|da nexo)|chave pix)\b/, "pagamento por fora"],
];

/** Motivo do bloqueio ("link", "telefone"...) ou null se o texto pode passar. */
export function findContact(text: string): string | null {
  const t = norm(text);
  for (const [re, why] of RULES) if (re.test(t)) return why;
  return null;
}

/** Mensagem de erro padrão para mostrar à pessoa. */
export function contactError(text: string, where = "aqui"): string | null {
  const why = findContact(text);
  return why
    ? `Bloqueamos ${why} ${where}. Por segurança, toda a negociação acontece pela Nexo: links, telefone, e-mail, @ e contato de WhatsApp, Discord ou Telegram não são permitidos.`
    : null;
}
