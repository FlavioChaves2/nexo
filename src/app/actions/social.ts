"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { OrderError } from "@/lib/orders";
import { contactError, contactErrorIn } from "@/lib/contact-filter";
import { deleteImage, filesFrom, saveImage } from "@/lib/images";
import { cleanDisplayName, reservedNameError } from "@/lib/store-names";

export type SocialState = { error?: string; ok?: string } | undefined;


export async function askQuestion(listingId: string, _: SocialState, form: FormData): Promise<SocialState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Entre na sua conta para perguntar." };
  const body = String(form.get("body") ?? "").trim();
  if (body.length < 5 || body.length > 500) return { error: "A pergunta precisa ter entre 5 e 500 caracteres." };
  const contact = contactError(body, "na pergunta");
  if (contact) return { error: contact };
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
  const contact = contactError(answer, "na resposta");
  if (contact) return { error: contact };
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
  storeHours: z.string().trim().max(80, "Horário de atendimento: até 80 caracteres."),
});

export async function updateProfile(_: SocialState, form: FormData): Promise<SocialState> {
  const user = await requireUser("/conta/perfil");
  const parsed = profileSchema.safeParse({
    storeName: cleanDisplayName(String(form.get("storeName") ?? "")),
    bio: form.get("bio") ?? "",
    storeHours: cleanDisplayName(String(form.get("storeHours") ?? "")),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const reserved = reservedNameError(parsed.data.storeName, "O nome da loja");
  if (reserved) return { error: reserved };
  const contact = contactErrorIn([parsed.data.storeName, parsed.data.bio, parsed.data.storeHours], "no perfil");
  if (contact) return { error: contact };
  const me =await db.user.findUniqueOrThrow({ where: { id: user.id } });

  let avatarId = me.avatarId;
  let storeBannerId = me.storeBannerId;
  try {
    const [file] = filesFrom(form, "avatar");
    if (file) avatarId = (await saveImage(file, user.id, "AVATAR")).id;
    else if (form.get("removeAvatar") === "on") avatarId = null;
    const [banner] = filesFrom(form, "banner");
    if (banner) storeBannerId = (await saveImage(banner, user.id, "CAPA")).id;
    else if (form.get("removeBanner") === "on") storeBannerId = null;
  } catch (e) {
    if (e instanceof OrderError) return { error: e.message };
    throw e;
  }
  await db.user.update({ where: { id: user.id }, data: { ...parsed.data, avatarId, storeBannerId } });
  if (me.avatarId && me.avatarId !== avatarId) await deleteImage(me.avatarId);
  if (me.storeBannerId && me.storeBannerId !== storeBannerId) await deleteImage(me.storeBannerId);
  revalidatePath("/", "layout");
  return { ok: "Perfil salvo." };
}
