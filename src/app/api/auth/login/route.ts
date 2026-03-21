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
import { logPrismaOrServerError } from "@/lib/prisma-error-log";
import { authRouteLog, summarizeLoginBody } from "@/lib/auth-route-log";

const ROUTE = "api/auth/login";

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").trim();
}

export async function POST(request: Request) {
  authRouteLog(ROUTE, "POST iniciado");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    authRouteLog(ROUTE, "JSON inválido");
    return NextResponse.json(
      { error: "Corpo da requisição inválido." },
      { status: 400 }
    );
  }

  authRouteLog(ROUTE, "payload (sem senha)", summarizeLoginBody(body));

  try {
    const { phone: rawPhone, password } = (body ?? {}) as { phone?: string; password?: string };

    const phone = normalizePhone(rawPhone ?? "");
    if (!phone || !password) {
      authRouteLog(ROUTE, "validação falhou: telefone ou senha ausente");
      return NextResponse.json(
        { error: "Telefone e senha são obrigatórios." },
        { status: 400 }
      );
    }

    authRouteLog(ROUTE, "antes: ensureUser* (no-op em Postgres)");
    await ensureUserBannedColumnSqlite();
    await ensureUserPublicIdColumnAndBackfill();
    await ensureUserPixColumnsSqlite();
    await ensureUserCheckInColumnsSqlite();

    authRouteLog(ROUTE, "findUnique User por phone");
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      authRouteLog(ROUTE, "usuário não encontrado");
      return NextResponse.json(
        { error: "Telefone ou senha incorretos." },
        { status: 401 }
      );
    }

    if (user.banned) {
      authRouteLog(ROUTE, "usuário suspenso", { userId: user.id });
      return NextResponse.json(
        { error: "Esta conta está suspensa. Entre em contato com o suporte." },
        { status: 403 }
      );
    }

    authRouteLog(ROUTE, "verifyPassword");
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      authRouteLog(ROUTE, "senha incorreta");
      return NextResponse.json(
        { error: "Telefone ou senha incorretos." },
        { status: 401 }
      );
    }

    const role = user.role === "admin" ? "admin" : "user";
    authRouteLog(ROUTE, "createToken + cookie", { role });
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
    authRouteLog(ROUTE, "login ok");
    return response;
  } catch (e) {
    logPrismaOrServerError(ROUTE, e);
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
