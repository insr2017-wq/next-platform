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

  const withdrawal = await prisma.withdrawal.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!withdrawal) return NextResponse.json({ error: "Saque não encontrado." }, { status: 404 });

  if (withdrawal.status !== "pending") {
    return NextResponse.json(
      { error: "Este saque não está mais pendente." },
      { status: 400 }
    );
  }

  await prisma.withdrawal.update({
    where: { id },
    data: { status: "processed", processedAt: new Date() },
  });

  return NextResponse.json({ success: true, message: "Saque aprovado." });
}

