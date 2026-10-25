import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { db } from "./db";
import { OrderError } from "./orders";

// Fotos ficam em uploads/ na raiz do projeto. Em produção, troque por um
// armazenamento de arquivos (Supabase Storage, S3, Cloudflare R2).

const DIR = path.join(process.cwd(), "uploads");
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

export async function saveImage(file: File, ownerId: string, kind: "ANUNCIO" | "AVATAR", listingId?: string, sort = 0) {
  if (file.size > MAX_IMAGE_BYTES) throw new OrderError(`"${file.name}" passa de 3 MB.`);
  const buf = Buffer.from(await file.arrayBuffer());
  const mime = sniff(buf);
  if (!mime) throw new OrderError(`"${file.name}" não é JPG, PNG ou WEBP.`);
  const img = await db.image.create({ data: { ownerId, kind, listingId, mime, size: buf.length, sort } });
  await mkdir(DIR, { recursive: true });
  await writeFile(path.join(DIR, img.id), buf);
  return img;
}

export async function readImage(id: string) {
  if (!/^[a-z0-9]+$/i.test(id)) return null;
  const img = await db.image.findUnique({ where: { id } });
  if (!img) return null;
  try {
    return { img, data: await readFile(path.join(DIR, img.id)) };
  } catch {
    return null;
  }
}

export async function deleteImage(id: string) {
  await db.image.delete({ where: { id } }).catch(() => null);
  await unlink(path.join(DIR, id)).catch(() => null);
}

/** Arquivos válidos enviados num campo <input type="file" multiple>. */
export const filesFrom = (form: FormData, field: string) =>
  form.getAll(field).filter((f): f is File => f instanceof File && f.size > 0);
