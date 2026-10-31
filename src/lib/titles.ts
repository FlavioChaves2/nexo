import { db } from "./db";
import { notify } from "./notify";
import { OrderError } from "./orders";

// Títulos de vendedor: dados à mão pela equipe no admin, ou automáticos como o Fundador.

export const FOUNDER = { auto: "FUNDADOR", name: "Fundador", emoji: "👑", color: "#F5C542", maxHolders: 20, description: "Um dos 20 primeiros vendedores a concluir uma venda na Nexo." };

/** Contas de exemplo (@nexo.test) não ocupam vaga de Fundador. */
const isTestAccount = (email: string) => email.endsWith("@nexo.test");

/** O que os selos precisam saber dos títulos de uma pessoa. */
export const titlesSelect = {
  titles: { select: { title: { select: { name: true, emoji: true, color: true, description: true } } }, orderBy: { createdAt: "asc" as const } },
} as const;

export type BadgeTitle = { name: string; emoji: string; color: string; description: string };
export const flatTitles = (u: { titles?: { title: BadgeTitle }[] }) => (u.titles ?? []).map((t) => t.title);

export async function founderTitle() {
  return db.title.upsert({ where: { auto: FOUNDER.auto }, create: FOUNDER, update: {} });
}

/** Chamado quando uma venda é concluída: os 20 primeiros vendedores reais ganham o Fundador. */
export async function grantFounderIfEligible(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!user || isTestAccount(user.email)) return;
  const title = await founderTitle();
  const granted = await db.$transaction(async (tx) => {
    // Trava curta: dois anúncios publicados ao mesmo tempo não passam do limite de 20.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(820820)`;
    if (await tx.userTitle.findUnique({ where: { userId_titleId: { userId, titleId: title.id } } })) return false;
    const holders = await tx.userTitle.count({ where: { titleId: title.id } });
    if (title.maxHolders !== null && holders >= title.maxHolders) return false;
    await tx.userTitle.create({ data: { userId, titleId: title.id } });
    return holders + 1;
  });
  if (granted) await notify(userId, `👑 Você é Fundador da Nexo! (${granted}/${FOUNDER.maxHolders})`, "Um dos 20 primeiros vendedores. O título aparece para sempre ao lado do seu nome.", "/conta/perfil");
}

export async function createTitle(adminId: string, input: { name: string; emoji: string; color: string; description: string }) {
  const name = input.name.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 24) throw new OrderError("Nome do título: 2 a 24 caracteres.");
  if (!/^#[0-9a-f]{6}$/i.test(input.color)) throw new OrderError("Escolha uma cor.");
  const emoji = [...input.emoji.trim()].slice(0, 2).join("") || "🏅";
  if (await db.title.findUnique({ where: { name } })) throw new OrderError("Já existe um título com esse nome.");
  await db.$transaction(async (tx) => {
    const t = await tx.title.create({ data: { name, emoji, color: input.color, description: input.description.trim().slice(0, 120) } });
    await tx.adminAction.create({ data: { adminId, kind: "TITULO_CRIADO", targetId: t.id, label: `${emoji} ${name}` } });
  });
}

export async function grantTitle(adminId: string, titleId: string, rawUser: string) {
  const handle = rawUser.trim().replace(/^@/, "").toLowerCase();
  if (!handle) throw new OrderError("Digite o nome de usuário ou o e-mail.");
  const user = await db.user.findFirst({ where: { OR: [{ username: handle }, { email: handle }] }, select: { id: true, username: true } });
  if (!user) throw new OrderError(`Ninguém encontrado com "${handle}".`);
  const title = await db.title.findUnique({ where: { id: titleId }, include: { _count: { select: { holders: true } } } });
  if (!title) throw new OrderError("Título não encontrado.");
  if (title.maxHolders !== null && title._count.holders >= title.maxHolders) throw new OrderError(`Este título já tem as ${title.maxHolders} vagas ocupadas. Remova alguém antes.`);
  if (await db.userTitle.findUnique({ where: { userId_titleId: { userId: user.id, titleId } } })) throw new OrderError(`${user.username} já tem este título.`);
  await db.$transaction(async (tx) => {
    await tx.userTitle.create({ data: { userId: user.id, titleId, grantedById: adminId } });
    await tx.adminAction.create({ data: { adminId, kind: "TITULO_DADO", targetId: user.id, label: `${title.emoji} ${title.name} para ${user.username}` } });
    await notify(user.id, `${title.emoji} Você ganhou o título ${title.name}!`, title.description || "Ele aparece ao lado do seu nome na Nexo.", "/conta/perfil", tx);
  });
  return user.username;
}

export async function revokeTitle(adminId: string, titleId: string, userId: string) {
  await db.$transaction(async (tx) => {
    const ut = await tx.userTitle.findUnique({ where: { userId_titleId: { userId, titleId } }, include: { title: true, user: { select: { username: true } } } });
    if (!ut) throw new OrderError("Esta pessoa não tem mais o título.");
    await tx.userTitle.delete({ where: { userId_titleId: { userId, titleId } } });
    await tx.adminAction.create({ data: { adminId, kind: "TITULO_REMOVIDO", targetId: userId, label: `${ut.title.emoji} ${ut.title.name} de ${ut.user.username}` } });
  });
}

export async function deleteTitle(adminId: string, titleId: string) {
  const t = await db.title.findUnique({ where: { id: titleId } });
  if (!t) throw new OrderError("Título não encontrado.");
  if (t.auto) throw new OrderError("O título automático não pode ser apagado.");
  await db.$transaction(async (tx) => {
    await tx.title.delete({ where: { id: titleId } }); // tira de todo mundo junto
    await tx.adminAction.create({ data: { adminId, kind: "TITULO_APAGADO", targetId: titleId, label: `${t.emoji} ${t.name}` } });
  });
}
