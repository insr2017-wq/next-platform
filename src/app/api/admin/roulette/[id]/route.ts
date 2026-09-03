import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

function requireAdmin(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }
  return null;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return denied;
  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  if (typeof b.label === "string") {
    const label = b.label.trim();
    if (!label) return NextResponse.json({ error: "Nome inválido." }, { status: 400 });
    data.label = label;
  }
  if (b.value !== undefined) {
    const n = typeof b.value === "number" ? b.value : parseFloat(String(b.value).replace(",", "."));
    if (!Number.isFinite(n) || n < 0) return NextResponse.json({ error: "Valor inválido." }, { status: 400 });
    data.value = Math.round(n * 100) / 100;
  }
  if (typeof b.kind === "string") {
    data.kind = b.kind === "extra_spin" ? "extra_spin" : "balance";
  }
  if (b.probability !== undefined) {
    const n = typeof b.probability === "number" ? b.probability : parseInt(String(b.probability), 10);
    if (!Number.isFinite(n) || n < 0) return NextResponse.json({ error: "Probabilidade inválida." }, { status: 400 });
    data.probability = Math.trunc(n);
  }
  if (b.active !== undefined) {
    data.active = b.active === true || b.active === "true";
  }
  if (b.sortOrder !== undefined) {
    const n = typeof b.sortOrder === "number" ? b.sortOrder : parseInt(String(b.sortOrder), 10);
    if (Number.isFinite(n)) data.sortOrder = Math.trunc(n);
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nenhuma alteração." }, { status: 400 });
  }
  await prisma.roulettePrize.update({ where: { id }, data });
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return denied;
  const { id } = await context.params;
  const used = await prisma.rouletteSpinLog.count({ where: { prizeId: id } });
  if (used > 0) {
    await prisma.roulettePrize.update({ where: { id }, data: { active: false } });
    return NextResponse.json({ success: true, message: "Prêmio desativado (já houve giros)." });
  }
  await prisma.roulettePrize.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
