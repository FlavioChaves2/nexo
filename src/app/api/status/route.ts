import { db } from "@/lib/db";

// Página de status para monitor de uptime (ex.: UptimeRobot): 200 quando site e banco respondem.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.$queryRaw`select 1`;
    return Response.json({ ok: true, banco: "ok", hora: new Date().toISOString() });
  } catch {
    return Response.json({ ok: false, banco: "fora do ar" }, { status: 503 });
  }
}
