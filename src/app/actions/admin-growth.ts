"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { OrderError } from "@/lib/orders";
import { addToProgram, savePolicy, updateProgram } from "@/lib/admin-growth";

export type GrowthState = { error?: string; ok?: string } | undefined;

async function run(paths: string[], fn: (adminId: string) => Promise<unknown>, ok: string): Promise<GrowthState> {
  const admin = await requireAdmin();
  try {
    await fn(admin.id);
  } catch (e) {
    if (e instanceof OrderError) return { error: e.message };
    throw e;
  }
  for (const p of [...paths, "/admin"]) revalidatePath(p);
  return { ok };
}

const str = (form: FormData, k: string) => String(form.get(k) ?? "");

export async function savePolicyAction(_: GrowthState, form: FormData): Promise<GrowthState> {
  return run(
    ["/admin/comissoes"],
    (adminId) =>
      savePolicy(adminId, {
        standardPct: str(form, "standardPct"),
        linkPct: str(form, "linkPct"),
        linkEnabled: form.get("linkEnabled") === "on",
        windowHours: str(form, "windowHours"),
        pixCost: str(form, "pixCost"),
        pixCostPct: str(form, "pixCostPct"),
        otherCost: str(form, "otherCost"),
        note: str(form, "note"),
      }),
    "Nova versão da política salva. Vale para os próximos pedidos.",
  );
}

export async function addToProgramAction(_: GrowthState, form: FormData): Promise<GrowthState> {
  return run(["/admin/programa"], (adminId) => addToProgram(adminId, str(form, "username")), "Vendedor adicionado ao programa.");
}

export async function updateProgramAction(id: string, _: GrowthState, form: FormData): Promise<GrowthState> {
  return run(
    ["/admin/programa"],
    (adminId) =>
      updateProgram(adminId, id, {
        status: str(form, "status"),
        ownerId: str(form, "ownerId"),
        notes: str(form, "notes"),
        steps: { stepListings: form.get("stepListings") === "on", stepStore: form.get("stepStore") === "on", stepMaterial: form.get("stepMaterial") === "on", stepFirstSale: form.get("stepFirstSale") === "on" },
      }),
    "Salvo.",
  );
}
