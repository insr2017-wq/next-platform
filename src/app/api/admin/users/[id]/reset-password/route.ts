import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getSession, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";

function requireAdmin(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }
  return null;
}

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const { id } = await context.params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }
  if (user.role === "admin") {
    return NextResponse.json(
      { error: "Não é permitido resetar senha de um administrador por aqui." },
      { status: 400 }
    );
  }

  const temporaryPassword = generateTempPassword();
  await prisma.user.update({
    where: { id },
    data: { passwordHash: await hashPassword(temporaryPassword) },
  });

  return NextResponse.json({
    success: true,
    message: "Senha temporária gerada. Mostre ao usuário agora — ela não ficará salva em texto.",
    temporaryPassword,
  });
}
