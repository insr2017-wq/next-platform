import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

function requireAdmin(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }
  return null;
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

  try {
    await prisma.$transaction(async (tx) => {
      const withdrawal = await tx.withdrawal.findUnique({
        where: { id },
        select: { id: true, status: true, requestedAmount: true, amount: true, userId: true },
      });
      if (!withdrawal) {
        throw new Error("NOT_FOUND");
      }
      if (withdrawal.status !== "pending") {
        throw new Error("NOT_PENDING");
      }

      await tx.withdrawal.update({
        where: { id: withdrawal.id },
        data: { status: "failed", processedAt: new Date() },
      });

      // Devolve o valor ao saldo do usuário.
      await tx.user.update({
        where: { id: withdrawal.userId },
        data: { balance: { increment: withdrawal.requestedAmount > 0 ? withdrawal.requestedAmount : withdrawal.amount } },
      });
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "NOT_FOUND") {
      return NextResponse.json({ error: "Saque não encontrado." }, { status: 404 });
    }
    if (msg === "NOT_PENDING") {
      return NextResponse.json(
        { error: "Este saque não está pendente." },
        { status: 400 }
      );
    }
    console.error("admin/withdrawals reject:", e);
    return NextResponse.json(
      { error: "Não foi possível recusar o saque." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, message: "Saque recusado." });
}

