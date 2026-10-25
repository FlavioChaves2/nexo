// Reduz as fotos no navegador antes do envio (máx. 1600 px, JPEG 82%).
// A Vercel aceita no máximo ~4,5 MB por envio, e foto de celular passa disso fácil.

const MAX_SIDE = 1600;

async function shrink(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.82));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file; // formato que o navegador não abre: o servidor decide
  }
}

/** Troca os arquivos do <input type="file"> pelas versões reduzidas. Devolve a primeira, para a prévia. */
export async function shrinkInput(input: HTMLInputElement): Promise<File | undefined> {
  const files = Array.from(input.files ?? []);
  if (!files.length) return;
  const small = await Promise.all(files.map(shrink));
  const dt = new DataTransfer();
  small.forEach((f) => dt.items.add(f));
  input.files = dt.files;
  return small[0];
}
