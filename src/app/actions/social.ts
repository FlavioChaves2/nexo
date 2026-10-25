"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { OrderError } from "@/lib/orders";
import { deleteImage, filesFrom, saveImage } from "@/lib/images";

export type SocialState = { error?: string; ok?: string } | undefined;

/** Bloqueia telefone, e-mail e links nas perguntas públicas (negociação por fora tira a garantia). */
const CONTACT = /(\d[\s.-]?){8,}|@[a-z0-9-]+\.|https?:\/\/|wa\.me|whats|telegram|discord\.gg/i;

export async function askQuestion(listingId: string, _: SocialState, form: FormData): Promise<SocialState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Entre na sua conta para perguntar." };
  const body = String(form.get("body") ?? "").trim();
  if (body.length < 5 || body.length > 500) return { error: "A pergunta precisa ter entre 5 e 500 caracteres." };
  if (CONTACT.test(body)) return { error: "Não envie contato, telefone ou link. Toda negociação acontece pela Nexo." };
  const listing = await db.listing.findUnique({ where: { id: listingId } });
  if (!listing) return { error: "Anúncio não encontrado." };
  if (listing.sellerId === user.id) return { error: "Você não pode perguntar no próprio anúncio." };
  const recent = await db.question.count({ where: { askerId: user.id, createdAt: { gte: new Date(Date.now() - 3_600_000) } } });
  if (recent >= 10) return { error: "Muitas perguntas na última hora. Tente mais tarde." };

  await db.question.create({ data: { listingId, askerId: user.id, body } });
  await notify(listing.sellerId, "Nova pergunta no seu anúncio", body, `/anuncio/${listingId}#perguntas`);
  revalidatePath(`/anuncio/${listingId}`);
  return { ok: "Pergunta enviada. Você recebe um aviso quando o vendedor responder." };
}

export async function answerQuestion(questionId: string, _: SocialState, form: FormData): Promise<SocialState> {
  const user = await requireUser("/");
  const answer = String(form.get("answer") ?? "").trim();
  if (answer.length < 2 || answer.length > 1000) return { error: "Escreva a resposta." };
  if (CONTACT.test(answer)) return { error: "Não envie contato, telefone ou link na resposta." };
  const q = await db.question.findUnique({ where: { id: questionId }, include: { listing: true } });
  if (!q || q.listing.sellerId !== user.id) return { error: "Pergunta não encontrada." };
  await db.question.update({ where: { id: questionId }, data: { answer, answeredAt: new Date() } });
  await notify(q.askerId, "Sua pergunta foi respondida", answer, `/anuncio/${q.listingId}#perguntas`);
  revalidatePath(`/anuncio/${q.listingId}`);
  return { ok: "Resposta publicada." };
}

const profileSchema = z.object({
  storeName: z.string().trim().max(40, "Nome da loja: até 40 caracteres."),
  bio: z.string().trim().max(500, "Descrição: até 500 caracteres."),
});

export async function updateProfile(_: SocialState, form: FormData): Promise<SocialState> {
  const user = await requireUser("/conta/perfil");
  const parsed = profileSchema.safeParse({ storeName: form.get("storeName") ?? "", bio: form.get("bio") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const me = await db.user.findUniqueOrThrow({ where: { id: user.id } });

  let avatarId = me.avatarId;
  try {
    const [file] = filesFrom(form, "avatar");
    if (file) avatarId = (await saveImage(file, user.id, "AVATAR")).id;
    else if (form.get("removeAvatar") === "on") avatarId = null;
  } catch (e) {
    if (e instanceof OrderError) return { error: e.message };
    throw e;
  }
  await db.user.update({ where: { id: user.id }, data: { ...parsed.data, avatarId } });
  if (me.avatarId && me.avatarId !== avatarId) await deleteImage(me.avatarId);
  revalidatePath("/", "layout");
  return { ok: "Perfil salvo." };
}
