import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  createToken,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "@/lib/auth";

function safeEqual(a: string, b: string): boolean {
  if (!a || !b) return false;
  const x = Buffer.from(a, "utf8");
  const y = Buffer.from(b, "utf8");
  if (x.length !== y.length) return false;
  return timingSafeEqual(x, y);
}

/**
 * Apenas desenvolvimento: login como admin com chave local (ADMIN_DEV_BYPASS),
 * sem telefone/senha. Nunca habilitado em produção.
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Não disponível." }, { status: 404 });
  }

  const bypass = process.env.ADMIN_DEV_BYPASS?.trim() ?? "";
  if (bypass.length < 8) {
    return NextResponse.json(
      {
        error:
          "Defina ADMIN_DEV_BYPASS no .env (mín. 8 caracteres) para usar login rápido local.",
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const secret = typeof (body as { secret?: string })?.secret === "string"
    ? (body as { secret: string }).secret
    : "";
  if (!safeEqual(secret, bypass)) {
    return NextResponse.json({ error: "Chave inválida." }, { status: 401 });
  }

  const admin = await prisma.user.findFirst({
    where: { role: "admin" },
    orderBy: { updatedAt: "desc" },
  });

  if (!admin) {
    return NextResponse.json(
      {
        error:
          "Nenhum usuário admin no banco. Rode npm run db:seed e tente de novo.",
      },
      { status: 404 }
    );
  }

  const token = await createToken({
    userId: admin.id,
    role: "admin",
    phone: admin.phone,
  });

  const response = NextResponse.json({
    success: true,
    redirectTo: "/admin/dashboard",
  });
  response.cookies.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
  return response;
}
