import { NextResponse } from "next/server";
import { Prisma } from "@/lib/prisma-generated";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { generateInviteCode } from "@/lib/invite-code";
import {
  ensureUserBannedColumnSqlite,
  ensureUserPublicIdColumnAndBackfill,
  ensureUserCheckInColumnsSqlite,
} from "@/lib/user-schema-sqlite";
import { generateUniquePublicId } from "@/lib/public-id";
import { logPrismaOrServerError } from "@/lib/prisma-error-log";
import { authRouteLog, summarizeRegisterBody } from "@/lib/auth-route-log";

const ROUTE = "api/auth/register";

const REGISTER_RATE_WINDOW_MS = 10 * 60 * 1000;
const REGISTER_RATE_MAX_ATTEMPTS = 5;
const registerAttemptsByIp = new Map<string, number[]>();

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();
  return "unknown";
}

/** Retorna true se o IP excedeu o limite (e não registra esta tentativa). */
function isRegisterRateLimited(ip: string): boolean {
  const now = Date.now();
  let timestamps = registerAttemptsByIp.get(ip) ?? [];
  timestamps = timestamps.filter((t) => now - t < REGISTER_RATE_WINDOW_MS);
  if (timestamps.length >= REGISTER_RATE_MAX_ATTEMPTS) {
    registerAttemptsByIp.set(ip, timestamps);
    return true;
  }
  timestamps.push(now);
  registerAttemptsByIp.set(ip, timestamps);
  return false;
}

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

  authRouteLog(ROUTE, "payload (sem senha)", summarizeRegisterBody(body));

  const clientIp = getClientIp(request);
  if (isRegisterRateLimited(clientIp)) {
    authRouteLog(ROUTE, "rate limit cadastro", { clientIp });
    return NextResponse.json(
      {
        error:
          "Muitas tentativas de cadastro a partir deste endereço. Tente novamente em alguns minutos.",
      },
      { status: 429 }
    );
  }

  try {
    authRouteLog(ROUTE, "antes: ensureUser* (no-op em Postgres)");
    await ensureUserBannedColumnSqlite();
    await ensureUserPublicIdColumnAndBackfill();
    await ensureUserCheckInColumnsSqlite();

    const {
      phone: rawPhone,
      password,
      confirmPassword,
      inviteCode: rawInviteCode,
      fullName,
    } = (body ?? {}) as {
      phone?: string;
      password?: string;
      confirmPassword?: string;
      inviteCode?: string;
      fullName?: string;
    };

    const phone = normalizePhone(rawPhone ?? "");
    authRouteLog(ROUTE, "telefone normalizado", { digitsLen: phone.length });

    if (!phone || phone.length < 10 || phone.length > 11) {
      authRouteLog(ROUTE, "validação falhou: telefone");
      return NextResponse.json(
        { error: "Número de telefone inválido" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      authRouteLog(ROUTE, "validação falhou: senha");
      return NextResponse.json(
        { error: "Senha deve ter no mínimo 6 caracteres." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      authRouteLog(ROUTE, "validação falhou: senhas diferentes");
      return NextResponse.json(
        { error: "As senhas não coincidem." },
        { status: 400 }
      );
    }

    const referredByRaw =
      typeof rawInviteCode === "string" && rawInviteCode.trim()
        ? rawInviteCode.trim()
        : null;

    authRouteLog(ROUTE, "findUnique User por phone (duplicata)");
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      authRouteLog(ROUTE, "telefone já cadastrado");
      return NextResponse.json(
        { error: "Este número de telefone já está cadastrado." },
        { status: 409 }
      );
    }

    if (referredByRaw) {
      authRouteLog(ROUTE, "findUnique convite (validação)");
      const inviter = await prisma.user.findUnique({
        where: { inviteCode: referredByRaw },
        select: { id: true },
      });
      if (!inviter) {
        authRouteLog(ROUTE, "convite inválido");
        return NextResponse.json(
          { error: "Código de convite inválido." },
          { status: 400 }
        );
      }
    }

    authRouteLog(ROUTE, "hashPassword (uma vez)");
    const passwordHash = await hashPassword(password);

    const maxAttempts = 3;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        let inviteCode: string;
        let genAttempts = 0;
        do {
          inviteCode = generateInviteCode();
          authRouteLog(ROUTE, "findUnique inviteCode livre", { genAttempts });
          const taken = await prisma.user.findUnique({ where: { inviteCode } });
          if (!taken) break;
          genAttempts++;
          if (genAttempts > 10) {
            authRouteLog(ROUTE, "falha: muitas tentativas inviteCode");
            return NextResponse.json(
              { error: "Erro ao gerar código. Tente novamente." },
              { status: 500 }
            );
          }
        } while (true);

        authRouteLog(ROUTE, "generateUniquePublicId", { attempt });
        const publicId = await generateUniquePublicId();

        authRouteLog(ROUTE, "início $transaction create User", { attempt });
        await prisma.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              fullName: typeof fullName === "string" ? fullName.trim() : "",
              phone,
              passwordHash,
              inviteCode,
              referredBy: referredByRaw,
              publicId,
              balance: 25,
            },
          });
          if (referredByRaw) {
            const inviter = await tx.user.findFirst({
              where: { inviteCode: referredByRaw },
            });
            if (inviter && inviter.id !== newUser.id) {
              await tx.referral.create({
                data: { inviterId: inviter.id, invitedUserId: newUser.id },
              });
            }
          }
        });
        authRouteLog(ROUTE, "cadastro concluído com sucesso");
        return NextResponse.json({ success: true });
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === "P2002" &&
          attempt < maxAttempts - 1
        ) {
          authRouteLog(ROUTE, "P2002 unicidade — retry", {
            attempt: attempt + 1,
            prismaCode: e.code,
            meta: JSON.stringify(e.meta ?? {}),
          });
          continue;
        }
        throw e;
      }
    }

    authRouteLog(ROUTE, "esgotaram tentativas após P2002");
    return NextResponse.json(
      { error: "Não foi possível concluir o cadastro. Tente novamente." },
      { status: 500 }
    );
  } catch (e) {
    logPrismaOrServerError(ROUTE, e);
    const message =
      process.env.NODE_ENV === "development" && e instanceof Error
        ? e.message
        : "Erro ao cadastrar. Tente novamente.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
