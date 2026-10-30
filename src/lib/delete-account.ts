import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { db } from "./db";
import { OrderError } from "./orders";

// Exclusão de conta pelo próprio usuário. Os pedidos e avaliações ficam (são registro das outras
// pessoas e da Nexo), mas a conta é anonimizada: dados pessoais apagados, anúncios fora do ar,
// e o e-mail e o nome de usuário ficam livres para uma conta nova.

export class DeleteAccountError extends OrderError {}

/** O que impede excluir agora (vazio = pode excluir). */
export async function deleteBlockers(userId: string) {
  const [u, openOrders, pendingW] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: userId }, select: { balanceCents: true, role: true } }),
    db.order.count({ where: { OR: [{ buyerId: userId }, { sellerId: userId }], status: { in: ["AGUARDANDO_PAGAMENTO", "PAGO", "ENTREGUE", "DISPUTA"] } } }),
    db.withdrawal.count({ where: { userId, status: { in: ["PENDENTE", "PROCESSANDO"] } } }),
  ]);
  const list: string[] = [];
  if (u.role === "ADMIN") list.push("Contas da equipe não podem ser excluídas por aqui.");
  if (openOrders) list.push(`Você tem ${openOrders} pedido(s) em andamento. Conclua ou cancele antes.`);
  if (pendingW) list.push("Você tem um saque em análise. Espere ele ser pago.");
  if (u.balanceCents > 0) list.push("Você ainda tem saldo na Nexo. Saque tudo antes de excluir.");
  return list;
}

export async function deleteAccount(userId: string, password: string, confirm: string) {
  if (confirm.trim().toUpperCase() !== "EXCLUIR") throw new DeleteAccountError("Digite EXCLUIR para confirmar.");
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (!(await bcrypt.compare(password, user.passwordHash))) throw new DeleteAccountError("Senha incorreta.");
  const blockers = await deleteBlockers(userId);
  if (blockers.length) throw new DeleteAccountError(blockers[0]);

  const tag = userId.slice(-8);
  await db.$transaction(async (tx) => {
    await tx.listing.updateMany({ where: { sellerId: userId, status: { not: "REMOVIDO" } }, data: { status: "REMOVIDO", moderationNote: "Conta excluída pelo vendedor.", orbitUntil: null } });
    await tx.wanted.updateMany({ where: { buyerId: userId, status: "ABERTO" }, data: { status: "CANCELADO" } });
    await tx.image.deleteMany({ where: { ownerId: userId, kind: "AVATAR" } });
    await tx.favorite.deleteMany({ where: { userId } });
    await tx.pushSubscription.deleteMany({ where: { userId } });
    await tx.notification.deleteMany({ where: { userId } });
    await tx.emailToken.deleteMany({ where: { userId } });
    await tx.userTitle.deleteMany({ where: { userId } }); // libera a vaga de Fundador
    await tx.user.update({
      where: { id: userId },
      data: {
        email: `excluido-${userId}@nexo.invalid`,
        username: `excluido_${tag}`,
        passwordHash: await bcrypt.hash(randomBytes(32).toString("hex"), 10),
        storeName: "", bio: "", avatarId: null,
        fullName: "", cpf: null, birthDate: "", verification: "NAO_ENVIADO", verificationNote: "",
        totpSecret: null, totpEnabled: false,
        emailVerifiedAt: null, passwordChangedAt: new Date(),
        suspendedAt: new Date(), suspendReason: "Conta excluída pelo próprio usuário.",
      },
    });
  });
}
