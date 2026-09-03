import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPlatformSettings } from "@/lib/platform-settings";
import { cashbackExamples } from "@/lib/cashback";
import { formatBRL } from "@/lib/format-brl";
import { devErrorDetail, logDevApiError } from "@/lib/dev-api-error";

const GLOBAL_ID = "global";

function parseNonNegative(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v) && v >= 0) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = parseFloat(v.replace(",", "."));
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return null;
}

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }
  const s = await getPlatformSettings();
  return NextResponse.json({
    cashbackPercent: s.cashbackPercent,
    cashbackBandAmount: s.cashbackBandAmount,
    cashbackMinInvest: s.cashbackMinInvest,
    examples: cashbackExamples(s).map((row) => ({
      invest: formatBRL(row.invest),
      cashback: formatBRL(row.cashback),
    })),
  });
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const b = (body ?? {}) as Record<string, unknown>;
  const cashbackPercent = parseNonNegative(b.cashbackPercent);
  const cashbackBandAmount = parseNonNegative(b.cashbackBandAmount);
  const cashbackMinInvest = parseNonNegative(b.cashbackMinInvest);

  if (cashbackPercent === null || cashbackPercent > 100) {
    return NextResponse.json({ error: "Percentual de cashback inválido (0 a 100)." }, { status: 400 });
  }
  if (cashbackBandAmount === null || cashbackBandAmount <= 0) {
    return NextResponse.json({ error: "Informe o tamanho da faixa em reais." }, { status: 400 });
  }
  if (cashbackMinInvest === null) {
    return NextResponse.json({ error: "Informe o investimento mínimo." }, { status: 400 });
  }

  try {
    await prisma.platformSettings.upsert({
      where: { id: GLOBAL_ID },
      create: {
        id: GLOBAL_ID,
        cashbackPercent,
        cashbackBandAmount,
        cashbackMinInvest,
      },
      update: {
        cashbackPercent,
        cashbackBandAmount,
        cashbackMinInvest,
      },
    });
  } catch (e) {
    logDevApiError("admin/cashback PUT", e);
    return NextResponse.json(
      {
        error: "Erro ao salvar. Rode as migrações no servidor.",
        ...(devErrorDetail(e) ? { detalhe: devErrorDetail(e) } : {}),
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, message: "Cashback atualizado." });
}
