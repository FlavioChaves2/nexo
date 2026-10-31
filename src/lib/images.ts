import sharp from "sharp";
import { db } from "./db";
import { OrderError } from "./orders";

// Fotos ficam no próprio banco (coluna Image.data), porque a Vercel não guarda
// arquivos em disco. Com muito volume, troque por Supabase Storage, S3 ou R2.

export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
export const MAX_LISTING_IMAGES = 5;

/** Descobre o tipo pelo conteúdo do arquivo, não pelo nome (evita arquivo disfarçado). */
function sniff(buf: Buffer): string | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") return "image/webp";
  return null;
}

export { imageUrl } from "./images-url";

/** Confere tamanho e tipo real da foto antes de gravar. Lança OrderError com a explicação. */
export async function checkImage(file: File) {
  if (file.size > MAX_IMAGE_BYTES) throw new OrderError(`"${file.name}" passa de 3 MB.`);
  const buf = Buffer.from(await file.arrayBuffer());
  const mime = sniff(buf);
  if (!mime) throw new OrderError(`"${file.name}" não é JPG, PNG ou WEBP.`);
  return { buf, mime };
}

export async function saveImage(file: File, ownerId: string, kind: "ANUNCIO" | "AVATAR" | "CAPA", listingId?: string, sort = 0) {
  const { buf, mime } = await checkImage(file);
  const thumb = await makeThumb(buf);
  return db.image.create({ data: { ownerId, kind, listingId, mime, size: buf.length, sort, data: buf, thumb }, select: { id: true } });
}

/** Miniatura WEBP de até 480 px: os cards baixam ~30 KB em vez da foto inteira. Falhou, fica sem (usa a original). */
export async function makeThumb(buf: Buffer) {
  try {
    return await sharp(buf).rotate().resize(480, 480, { fit: "inside", withoutEnlargement: true }).webp({ quality: 74 }).toBuffer();
  } catch {
    return null;
  }
}

export async function readImage(id: string, mini = false) {
  if (!/^[a-z0-9]+$/i.test(id)) return null;
  if (mini) {
    const t = await db.image.findUnique({ where: { id }, select: { thumb: true } });
    if (!t) return null;
    if (t.thumb) return { mime: "image/webp", data: t.thumb };
    // foto antiga, ainda sem miniatura: cai na original
  }
  const img = await db.image.findUnique({ where: { id }, select: { mime: true, data: true } });
  return img ? { mime: img.mime, data: img.data } : null;
}

export async function deleteImage(id: string) {
  await db.image.delete({ where: { id } }).catch(() => null);
}

/** Arquivos válidos enviados num campo <input type="file" multiple>. */
export const filesFrom = (form: FormData, field: string) =>
  form.getAll(field).filter((f): f is File => f instanceof File && f.size > 0);
