import { readImage } from "@/lib/images";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const found = await readImage((await params).id);
  if (!found) return new Response("Imagem não encontrada", { status: 404 });
  return new Response(new Uint8Array(found.data), {
    headers: {
      "Content-Type": found.img.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
