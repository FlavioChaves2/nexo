// Nomes de usuário e de loja que imitam a equipe, a plataforma ou contas oficiais.
// Comparação sem acentos, sem espaços/pontuação e com troca de números parecidos com letras (n3x0 = nexo).

const RESERVED = ["nexo", "nexopoint", "admin", "adm", "administrador", "suporte", "support", "oficial", "official", "moderador", "moderacao", "mod", "equipe", "staff", "sistema", "garantia", "ggmax", "verificado", "verified"];

const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", $: "s" };

export function normalizeName(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[013457@$]/g, (c) => LEET[c] ?? c)
    .replace(/[^a-z]/g, "");
}

/** Mensagem de erro se o nome imita a equipe ou contas oficiais; null se estiver ok. */
export function reservedNameError(name: string, what = "Este nome") {
  const n = normalizeName(name);
  if (!n) return null;
  // Termos curtos (adm, mod) só contam sozinhos ou quase sozinhos, para não barrar "modernstore".
  const hit = RESERVED.find((r) => (r.length <= 3 ? n.startsWith(r) && n.length <= r.length + 2 : n.includes(r)));
  return hit ? `${what} não pode usar termos da equipe ou de contas oficiais (como “${hit}”).` : null;
}

/** Remove caracteres invisíveis e de controle (usados para disfarçar nomes) e espaços repetidos. */
export const cleanDisplayName = (s: string) => s.replace(/[\p{Cc}\p{Cf}]/gu, "").replace(/\s+/g, " ").trim();
