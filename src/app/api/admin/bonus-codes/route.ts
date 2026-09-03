import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { devErrorDetail, logDevApiError } from "@/lib/dev-api-error";

function requireAdmin(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }
  return null;
}

function parseAmount(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = parseFloat(v.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
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

  const b = (body ?? {}) as {
    code?: string;
    minAmount?: unknown;
    maxAmount?: unknown;
    maxRedemptions?: unknown;
    isActive?: unknown;
  };

  const code = typeof b.code === "string" ? b.code.trim().toUpperCase() : "";
  if (!code || code.length > 64) {
    return NextResponse.json(
      { error: "Informe um código válido (até 64 caracteres)." },
      { status: 400 }
    );
  }

  const minAmount = parseAmount(b.minAmount);
  const maxAmount = parseAmount(b.maxAmount);
  if (minAmount === null || maxAmount === null) {
    return NextResponse.json(
      { error: "Valores mínimo e máximo são obrigatórios." },
      { status: 400 }
    );
  }
  if (minAmount < 0 || maxAmount < 0) {
    return NextResponse.json({ error: "Valores não podem ser negativos." }, { status: 400 });
  }
  if (maxAmount < minAmount) {
    return NextResponse.json(
      { error: "O valor máximo deve ser maior ou igual ao mínimo." },
      { status: 400 }
    );
  }

  let maxRedemptions = 0;
  if (typeof b.maxRedemptions === "number" && Number.isInteger(b.maxRedemptions)) {
    maxRedemptions = b.maxRedemptions;
  } else if (typeof b.maxRedemptions === "string" && b.maxRedemptions.trim() !== "") {
    const n = parseInt(b.maxRedemptions, 10);
    if (Number.isFinite(n) && n >= 0) maxRedemptions = n;
  }
  if (maxRedemptions < 0) {
    return NextResponse.json(
      { error: "Limite de resgates inválido (use 0 para ilimitado)." },
      { status: 400 }
    );
  }

  const isActive = b.isActive !== false;

  try {
    const created = await prisma.bonusCode.create({
      data: {
        code,
        minAmount,
        maxAmount,
        maxRedemptions,
        isActive,
      },
    });
    return NextResponse.json({
      success: true,
      message: "Código bônus criado.",
      id: created.id,
    });
  } catch (e: unknown) {
    const msg = e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "P2002";
    if (msg) {
      return NextResponse.json(
        { error: "Já existe um código com este nome." },
        { status: 409 }
      );
    }
    logDevApiError("admin/bonus-codes POST", e);
    return NextResponse.json(
      {
        error: "Erro ao criar código. Confira se a tabela BonusCode existe (migrações / prisma db push).",
        ...(devErrorDetail(e) ? { detalhe: devErrorDetail(e) } : {}),
      },
      { status: 500 }
    );
  }
}
