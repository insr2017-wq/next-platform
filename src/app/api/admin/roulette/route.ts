import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureDefaultRoulettePrizes } from "@/lib/roulette";
import { logDevApiError, devErrorDetail } from "@/lib/dev-api-error";

function requireAdmin(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }
  return null;
}

function parsePrize(body: Record<string, unknown>, partial = false) {
  const data: {
    label?: string;
    value?: number;
    kind?: string;
    probability?: number;
    active?: boolean;
    sortOrder?: number;
  } = {};

  if (!partial || body.label !== undefined) {
    const label = typeof body.label === "string" ? body.label.trim() : "";
    if (!label || label.length > 80) return { error: "Informe o nome do prêmio." };
    data.label = label;
  }
  if (!partial || body.value !== undefined) {
    const n = typeof body.value === "number" ? body.value : parseFloat(String(body.value ?? "").replace(",", "."));
    if (!Number.isFinite(n) || n < 0) return { error: "Valor inválido." };
    data.value = Math.round(n * 100) / 100;
  }
  if (!partial || body.kind !== undefined) {
    const kind = typeof body.kind === "string" ? body.kind.trim() : "balance";
    data.kind = kind === "extra_spin" ? "extra_spin" : "balance";
  }
  if (!partial || body.probability !== undefined) {
    const n = typeof body.probability === "number" ? body.probability : parseInt(String(body.probability ?? ""), 10);
    if (!Number.isFinite(n) || n < 0) return { error: "Probabilidade inválida." };
    data.probability = Math.trunc(n);
  }
  if (body.active !== undefined) {
    data.active = body.active === true || body.active === "true";
  } else if (!partial) {
    data.active = true;
  }
  if (body.sortOrder !== undefined) {
    const n = typeof body.sortOrder === "number" ? body.sortOrder : parseInt(String(body.sortOrder ?? ""), 10);
    data.sortOrder = Number.isFinite(n) ? Math.trunc(n) : 0;
  }
  return { data };
}

function withChances<T extends { probability: number; active: boolean }>(rows: T[]) {
  const activeSum = rows.filter((r) => r.active).reduce((s, r) => s + r.probability, 0);
  return rows.map((r) => ({
    ...r,
    chancePercent: r.active && activeSum > 0 ? Math.round((r.probability / activeSum) * 10000) / 100 : 0,
  }));
}

export async function GET() {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return denied;
  try {
    await ensureDefaultRoulettePrizes();
    const rows = await prisma.roulettePrize.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
    return NextResponse.json({ items: withChances(rows) });
  } catch (e) {
    logDevApiError("admin/roulette GET", e);
    return NextResponse.json(
      { error: "Erro ao listar prêmios. Rode as migrações.", ...(devErrorDetail(e) ? { detalhe: devErrorDetail(e) } : {}) },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return denied;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }
  const parsed = parsePrize((body ?? {}) as Record<string, unknown>, false);
  if ("error" in parsed && parsed.error) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const d = parsed.data!;
  const created = await prisma.roulettePrize.create({
    data: {
      label: d.label!,
      value: d.value!,
      kind: d.kind ?? "balance",
      probability: d.probability!,
      active: d.active ?? true,
      sortOrder: d.sortOrder ?? 0,
    },
  });
  return NextResponse.json({ success: true, id: created.id });
}
