import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { generateInviteCode } from "@/lib/invite-code";
import {
  ensureUserBannedColumnSqlite,
  ensureUserPublicIdColumnAndBackfill,
  ensureUserCheckInColumnsSqlite,
} from "@/lib/user-schema-sqlite";
import { generateUniquePublicId } from "@/lib/public-id";

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
    if (!phone || phone.length < 10) {
      return NextResponse.json(
        { error: "Número de telefone inválido." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Senha deve ter no mínimo 6 caracteres." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "As senhas não coincidem." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      return NextResponse.json(
        { error: "Este número de telefone já está cadastrado." },
        { status: 409 }
      );
    }

    let inviteCode: string;
    let attempts = 0;
    do {
      inviteCode = generateInviteCode();
      const taken = await prisma.user.findUnique({ where: { inviteCode } });
      if (!taken) break;
      attempts++;
      if (attempts > 10) {
        return NextResponse.json(
          { error: "Erro ao gerar código. Tente novamente." },
          { status: 500 }
        );
      }
    } while (true);

    const referredByRaw =
      typeof rawInviteCode === "string" && rawInviteCode.trim()
        ? rawInviteCode.trim()
        : null;

    // Se o código de convite foi informado, ele precisa existir.
    // O convite é opcional: se vier vazio/nulo, o cadastro segue normal.
    if (referredByRaw) {
      const inviter = await prisma.user.findUnique({
        where: { inviteCode: referredByRaw },
        select: { id: true },
      });
      if (!inviter) {
        return NextResponse.json(
          { error: "Código de convite inválido." },
          { status: 400 }
        );
      }
    }

    const passwordHash = await hashPassword(password);
    const publicId = await generateUniquePublicId();

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

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Register error:", e);
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
