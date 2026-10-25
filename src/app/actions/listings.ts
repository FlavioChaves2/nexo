"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { parseReais } from "@/lib/format";
import { LISTING_TYPES } from "@/lib/constants";
import { MAX_LISTING_IMAGES, deleteImage, filesFrom, saveImage } from "@/lib/images";
import { OrderError } from "@/lib/orders";

export type ListingFormState = { error?: string } | undefined;

const schema = z.object({
  gameSlug: z.string().min(1, "Escolha o jogo."),
  type: z.enum(LISTING_TYPES, { message: "Escolha o tipo." }),
  title: z.string().trim().min(8, "O título precisa ter pelo menos 8 caracteres.").max(80),
  description: z.string().trim().min(20, "Descreva o anúncio com pelo menos 20 caracteres.").max(3000),
  price: z.string(),
  oldPrice: z.string().optional(),
  stock: z.coerce.number().int().min(1, "Estoque mínimo: 1.").max(9999),
  autoDelivery: z.literal("on").optional(),
  codes: z.string().optional(),
});

function parsePrices(d: z.infer<typeof schema>) {
  const priceCents = parseReais(d.price);
  if (!Number.isFinite(priceCents) || priceCents < 100) throw new OrderError("Preço inválido. Mínimo R$ 1,00.");
  if (priceCents > 5_000_000) throw new OrderError("Preço máximo por anúncio: R$ 50.000,00.");
  let oldPriceCents: number | null = null;
  if (d.oldPrice?.trim()) {
    oldPriceCents = parseReais(d.oldPrice);
    if (!Number.isFinite(oldPriceCents) || oldPriceCents <= priceCents) throw new OrderError('O preço "de" precisa ser maior que o preço de venda.');
  }
  return { priceCents, oldPriceCents };
}

const splitCodes = (s?: string) => (s ?? "").split(/\r?\n/).map((c) => c.trim().slice(0, 500)).filter(Boolean);

async function guard(fn: () => Promise<string>): Promise<ListingFormState> {
  let to: string;
  try {
    to = await fn();
  } catch (e) {
    if (e instanceof OrderError) return { error: e.message };
    throw e;
  }
  redirect(to);
}

export async function createListing(_: ListingFormState, form: FormData): Promise<ListingFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?next=/vender");
  return guard(async () => {
    const parsed = schema.safeParse(Object.fromEntries(form));
    if (!parsed.success) throw new OrderError(parsed.error.issues[0].message);
    const d = parsed.data;
    const prices = parsePrices(d);
    if (!(await db.game.findUnique({ where: { slug: d.gameSlug } }))) throw new OrderError("Jogo inválido.");
    const files = filesFrom(form, "images");
    if (files.length > MAX_LISTING_IMAGES) throw new OrderError(`No máximo ${MAX_LISTING_IMAGES} fotos.`);

    const auto = d.autoDelivery === "on";
    const codes = auto ? splitCodes(d.codes) : [];
    if (auto && codes.length === 0) throw new OrderError("Para entrega automática, cole pelo menos um código (um por linha).");

    const listing = await db.listing.create({
      data: {
        sellerId: user.id,
        gameSlug: d.gameSlug,
        type: d.type,
        title: d.title,
        description: d.description,
        ...prices,
        stock: auto ? codes.length : d.stock,
        autoDelivery: auto,
        codes: auto ? { create: codes.map((code) => ({ code })) } : undefined,
      },
    });
    for (const [i, f] of files.entries()) await saveImage(f, user.id, "ANUNCIO", listing.id, i);
    return `/anuncio/${listing.id}`;
  });
}

export async function updateListing(listingId: string, _: ListingFormState, form: FormData): Promise<ListingFormState> {
  const user = await getCurrentUser();
  if (!user) redirect(`/entrar?next=/anuncio/${listingId}/editar`);
  return guard(async () => {
    const listing = await db.listing.findUnique({ where: { id: listingId }, include: { images: true } });
    if (!listing || listing.sellerId !== user.id) throw new OrderError("Anúncio não encontrado.");
    if (listing.status === "REMOVIDO") throw new OrderError("Anúncio removido pela moderação não pode ser editado.");

    // Tipo de entrega não muda na edição; o resto segue as mesmas regras da criação.
    const parsed = schema.safeParse({ ...Object.fromEntries(form), autoDelivery: listing.autoDelivery ? "on" : undefined, stock: form.get("stock") ?? listing.stock });
    if (!parsed.success) throw new OrderError(parsed.error.issues[0].message);
    const d = parsed.data;
    const prices = parsePrices(d);

    const remove = new Set(form.getAll("removeImage").map(String));
    const keep = listing.images.filter((i) => !remove.has(i.id));
    const files = filesFrom(form, "images");
    if (keep.length + files.length > MAX_LISTING_IMAGES) throw new OrderError(`No máximo ${MAX_LISTING_IMAGES} fotos por anúncio.`);

    const newCodes = listing.autoDelivery ? splitCodes(d.codes) : [];
    await db.$transaction(async (tx) => {
      if (newCodes.length) await tx.autoCode.createMany({ data: newCodes.map((code) => ({ listingId, code })) });
      const stock = listing.autoDelivery ? await tx.autoCode.count({ where: { listingId, orderId: null } }) : d.stock;
      await tx.listing.update({
        where: { id: listingId },
        data: { gameSlug: d.gameSlug, type: d.type, title: d.title, description: d.description, ...prices, stock },
      });
    });
    for (const img of listing.images) if (remove.has(img.id)) await deleteImage(img.id);
    for (const [i, f] of files.entries()) await saveImage(f, user.id, "ANUNCIO", listingId, keep.length + i);
    revalidatePath(`/anuncio/${listingId}`);
    return `/anuncio/${listingId}`;
  });
}

export async function toggleListingStatus(listingId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  const listing = await db.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.sellerId !== user.id || listing.status === "REMOVIDO") return;
  await db.listing.update({ where: { id: listingId }, data: { status: listing.status === "ATIVO" ? "PAUSADO" : "ATIVO" } });
  revalidatePath(`/anuncio/${listingId}`);
  revalidatePath("/conta");
}
