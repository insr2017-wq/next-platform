import { NextResponse } from "next/server";
import { getSession, hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "user") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const b = (body ?? {}) as Record<string, unknown>;
  const currentPassword =
    typeof b.currentPassword === "string" ? b.currentPassword : "";
  const newPassword = typeof b.newPassword === "string" ? b.newPassword : "";
  const confirmPassword =
    typeof b.confirmPassword === "string" ? b.confirmPassword : "";

  if (!currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.json(
      { error: "Preencha todos os campos." },
      { status: 400 },
    );
  }

  if (newPassword.length < 6) {
    return NextResponse.json(
      { error: "A nova senha deve ter ao menos 6 caracteres." },
      { status: 400 },
    );
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json(
      { error: "A confirmação não coincide com a nova senha." },
      { status: 400 },
    );
  }

  if (currentPassword === newPassword) {
    return NextResponse.json(
      { error: "A nova senha deve ser diferente da senha atual." },
      { status: 400 },
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { passwordHash: true, banned: true },
    });

    if (!user || user.banned) {
      return NextResponse.json({ error: "Conta indisponível." }, { status: 403 });
    }

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Senha atual incorreta." }, { status: 400 });
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: session.userId },
      data: { passwordHash },
    });

    return NextResponse.json({
      success: true,
      message: "Senha alterada com sucesso.",
    });
  } catch (e) {
    console.error("PUT /api/user/password:", e);
    return NextResponse.json(
      { error: "Não foi possível alterar a senha." },
      { status: 500 },
    );
  }
}
