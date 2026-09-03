import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

export async function PATCH(
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

  const existing = await prisma.bonusCode.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Código não encontrado." }, { status: 404 });
  }

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

  const data: {
    code?: string;
    minAmount?: number;
    maxAmount?: number;
    maxRedemptions?: number;
    isActive?: boolean;
  } = {};

  if (typeof b.code === "string") {
    const code = b.code.trim().toUpperCase();
    if (!code || code.length > 64) {
      return NextResponse.json({ error: "Código inválido." }, { status: 400 });
    }
    if (code !== existing.code) {
      const taken = await prisma.bonusCode.findFirst({
        where: { code, id: { not: id } },
      });
      if (taken) {
        return NextResponse.json(
          { error: "Já existe um código com este nome." },
          { status: 409 }
        );
      }
    }
    data.code = code;
  }

  let minAmount = existing.minAmount;
  let maxAmount = existing.maxAmount;
  if (b.minAmount !== undefined) {
    const m = parseAmount(b.minAmount);
    if (m === null || m < 0) {
      return NextResponse.json({ error: "Valor mínimo inválido." }, { status: 400 });
    }
    minAmount = m;
    data.minAmount = m;
  }
  if (b.maxAmount !== undefined) {
    const m = parseAmount(b.maxAmount);
    if (m === null || m < 0) {
      return NextResponse.json({ error: "Valor máximo inválido." }, { status: 400 });
    }
    maxAmount = m;
    data.maxAmount = m;
  }
  if (maxAmount < minAmount) {
    return NextResponse.json(
      { error: "O valor máximo deve ser maior ou igual ao mínimo." },
      { status: 400 }
    );
  }

  if (b.maxRedemptions !== undefined) {
    let maxRedemptions = 0;
    if (typeof b.maxRedemptions === "number" && Number.isInteger(b.maxRedemptions)) {
      maxRedemptions = b.maxRedemptions;
    } else if (typeof b.maxRedemptions === "string") {
      const n = parseInt(b.maxRedemptions, 10);
      if (Number.isFinite(n) && n >= 0) maxRedemptions = n;
    }
    if (maxRedemptions < 0) {
      return NextResponse.json({ error: "Limite de resgates inválido." }, { status: 400 });
    }
    const count = await prisma.bonusCodeRedemption.count({ where: { bonusCodeId: id } });
    if (maxRedemptions > 0 && maxRedemptions < count) {
      return NextResponse.json(
        {
          error: `O limite não pode ser menor que os resgates já feitos (${count}).`,
        },
        { status: 400 }
      );
    }
    data.maxRedemptions = maxRedemptions;
  }

  if (typeof b.isActive === "boolean") {
    data.isActive = b.isActive;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nenhuma alteração." }, { status: 400 });
  }

  try {
    await prisma.bonusCode.update({ where: { id }, data });
  } catch (e) {
    console.error("PATCH bonus-code:", e);
    return NextResponse.json({ error: "Erro ao atualizar." }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Código atualizado." });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const existing = await prisma.bonusCode.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Código não encontrado." }, { status: 404 });
  }

  try {
    await prisma.bonusCode.delete({ where: { id } });
  } catch (e) {
    console.error("DELETE bonus-code:", e);
    return NextResponse.json({ error: "Erro ao excluir." }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Código excluído." });
}
