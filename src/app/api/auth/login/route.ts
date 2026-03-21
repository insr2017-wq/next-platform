import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  verifyPassword,
  createToken,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "@/lib/auth";
import {
  ensureUserBannedColumnSqlite,
  ensureUserPublicIdColumnAndBackfill,
  ensureUserPixColumnsSqlite,
  ensureUserCheckInColumnsSqlite,
} from "@/lib/user-schema-sqlite";

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").trim();
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corpo da requisição inválido." },
      { status: 400 }
    );
  }
  try {
    const { phone: rawPhone, password } = (body ?? {}) as { phone?: string; password?: string };

    const phone = normalizePhone(rawPhone ?? "");
    if (!phone || !password) {
      return NextResponse.json(
        { error: "Telefone e senha são obrigatórios." },
        { status: 400 }
      );
    }

    await ensureUserBannedColumnSqlite();
    await ensureUserPublicIdColumnAndBackfill();
    await ensureUserPixColumnsSqlite();
    await ensureUserCheckInColumnsSqlite();

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return NextResponse.json(
        { error: "Telefone ou senha incorretos." },
        { status: 401 }
      );
    }

    if (user.banned) {
      return NextResponse.json(
        { error: "Esta conta está suspensa. Entre em contato com o suporte." },
        { status: 403 }
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Telefone ou senha incorretos." },
        { status: 401 }
      );
    }

    const role = user.role === "admin" ? "admin" : "user";
    const token = await createToken({
      userId: user.id,
      role,
      phone: user.phone,
    });

    const response = NextResponse.json({
      success: true,
      role,
      redirectTo: role === "admin" ? "/admin/dashboard" : "/home",
    });
    response.cookies.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
    return response;
  } catch (e) {
    console.error("Login error:", e);
    const message =
      process.env.NODE_ENV === "development" && e instanceof Error
        ? e.message
        : "Erro ao entrar. Tente novamente.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
