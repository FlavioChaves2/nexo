// E-mails descartáveis e domínios reservados para exemplo: não recebem a confirmação
// (o Resend registra como "bounced", o que pesa contra a entrega dos e-mails de clientes reais)
// e são o padrão de quem cria conta só para testar falhas do site.

const BLOCKED = new Set([
  // Reservados para exemplo/teste (RFC 2606) e domínios inválidos.
  "example.com", "example.net", "example.org", "test.com", "nexo.invalid",
  // Caixas temporárias mais usadas.
  "mailinator.com", "mailinator.net", "mailinator2.com", "guerrillamail.com", "guerrillamail.net", "guerrillamail.org", "guerrillamailblock.com",
  "sharklasers.com", "grr.la", "spam4.me", "10minutemail.com", "10minutemail.net", "10minemail.com", "temp-mail.org", "temp-mail.io", "tempmail.com",
  "tempmail.net", "tempmailo.com", "tempr.email", "tmpmail.org", "tmpmail.net", "yopmail.com", "yopmail.net", "yopmail.fr", "throwawaymail.com",
  "trashmail.com", "trashmail.de", "getnada.com", "nada.email", "dispostable.com", "maildrop.cc", "mailnesia.com", "mintemail.com", "mohmal.com",
  "fakeinbox.com", "emailondeck.com", "getairmail.com", "mailcatch.com", "moakt.com", "burnermail.io", "inboxkitten.com", "1secmail.com",
  "1secmail.net", "1secmail.org", "dropmail.me", "emailfake.com", "fakemail.net", "mail.tm", "mailpoof.com", "spamgourmet.com", "discard.email",
  "mytemp.email", "tempinbox.com", "mailsac.com", "harakirimail.com", "linshiyouxiang.net", "byom.de", "cuvox.de", "armyspy.com", "dayrep.com",
  "einrot.com", "fleckens.hu", "gustr.com", "jourrapide.com", "rhyta.com", "superrito.com", "teleworm.us", "minuteinbox.com", "emltmp.com",
]);

export function isDisposableEmail(email: string) {
  const domain = email.split("@").pop()?.toLowerCase().trim() ?? "";
  if (!domain) return false;
  if (BLOCKED.has(domain)) return true;
  // Subdomínios (ex.: algo.mailinator.com) e terminações reservadas.
  if ([...BLOCKED].some((d) => domain.endsWith(`.${d}`))) return true;
  return /\.(test|example|invalid|localhost)$/.test(domain);
}
