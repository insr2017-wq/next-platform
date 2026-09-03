import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  ensureUserBannedColumnSqlite,
  ensureUserPublicIdColumnAndBackfill,
} from "@/lib/user-schema-sqlite";
import { devErrorDetail, logDevApiError } from "@/lib/dev-api-error";

function requireAdmin(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }
  return null;
}

function parseAmount(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v) && v > 0) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = parseFloat(v.replace(",", "."));
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  try {
    await ensureUserBannedColumnSqlite();
    await ensureUserPublicIdColumnAndBackfill();
  } catch (e) {
    logDevApiError("admin/users balance POST", e);
    return NextResponse.json(
      {
        error: "Erro ao preparar o banco.",
        ...(devErrorDetail(e) ? { detalhe: devErrorDetail(e) } : {}),
      },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const b = (body ?? {}) as { direction?: string; amount?: unknown };
  const direction = b.direction === "subtract" ? "subtract" : "add";
  const amount = parseAmount(b.amount);
  if (amount === null) {
    return NextResponse.json(
      { error: "Informe um valor maior que zero." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, balance: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  const current = Number(user.balance ?? 0);
  if (direction === "subtract") {
    if (current < amount) {
      return NextResponse.json(
        { error: "Saldo insuficiente para retirar este valor." },
        { status: 400 }
      );
    }
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        balance:
          direction === "add"
            ? { increment: amount }
            : { decrement: amount },
      },
      select: { balance: true },
    });
    return NextResponse.json({
      success: true,
      message:
        direction === "add"
          ? "Saldo adicionado com sucesso."
          : "Saldo retirado com sucesso.",
      balance: Number(updated.balance ?? 0),
    });
  } catch (e) {
    logDevApiError("admin/users balance POST update", e);
    return NextResponse.json(
      {
        error: "Erro ao atualizar saldo.",
        ...(devErrorDetail(e) ? { detalhe: devErrorDetail(e) } : {}),
      },
      { status: 500 }
    );
  }
}
