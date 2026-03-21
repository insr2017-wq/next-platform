import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { randomBonusRewardAmount } from "@/lib/bonus-reward";
import { devErrorDetail, logDevApiError } from "@/lib/dev-api-error";

function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "user") {
    return NextResponse.json(
      { error: "Faça login como usuário para resgatar o código." },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const codeRaw = typeof (body as { code?: string })?.code === "string"
    ? (body as { code: string }).code
    : "";
  const code = normalizeCode(codeRaw);
  if (!code) {
    return NextResponse.json(
      { error: "Informe o código bônus." },
      { status: 400 }
    );
  }

  const userId = session.userId;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const bonus = await tx.bonusCode.findUnique({
        where: { code },
        include: {
          _count: { select: { redemptions: true } },
        },
      });

      if (!bonus) {
        return { type: "not_found" as const };
      }
      if (!bonus.isActive) {
        return { type: "inactive" as const };
      }

      const existing = await tx.bonusCodeRedemption.findUnique({
        where: {
          bonusCodeId_userId: { bonusCodeId: bonus.id, userId },
        },
      });
      if (existing) {
        return { type: "already_redeemed" as const };
      }

      const count = bonus._count.redemptions;
      if (bonus.maxRedemptions > 0 && count >= bonus.maxRedemptions) {
        return { type: "limit_reached" as const };
      }

      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { banned: true },
      });
      if (!user || user.banned) {
        return { type: "user_invalid" as const };
      }

      const amount = randomBonusRewardAmount(bonus.minAmount, bonus.maxAmount);

      await tx.bonusCodeRedemption.create({
        data: {
          bonusCodeId: bonus.id,
          userId,
          amount,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: amount } },
      });

      return { type: "ok" as const, amount };
    });

    switch (result.type) {
      case "not_found":
        return NextResponse.json(
          { error: "Código não encontrado. Verifique se digitou corretamente." },
          { status: 404 }
        );
      case "inactive":
        return NextResponse.json(
          { error: "Este código não está ativo no momento." },
          { status: 400 }
        );
      case "already_redeemed":
        return NextResponse.json(
          { error: "Você já resgatou este código anteriormente." },
          { status: 400 }
        );
      case "limit_reached":
        return NextResponse.json(
          { error: "Este código atingiu o limite máximo de resgates." },
          { status: 400 }
        );
      case "user_invalid":
        return NextResponse.json(
          { error: "Não foi possível concluir o resgate. Tente novamente." },
          { status: 403 }
        );
      default:
        return NextResponse.json({
          success: true,
          amount: result.amount,
          message: "Código resgatado com sucesso!",
        });
    }
  } catch (e: unknown) {
    const p2002 =
      e &&
      typeof e === "object" &&
      "code" in e &&
      (e as { code?: string }).code === "P2002";
    if (p2002) {
      return NextResponse.json(
        { error: "Você já resgatou este código anteriormente." },
        { status: 400 }
      );
    }
    logDevApiError("bonus-code/redeem POST", e);
    return NextResponse.json(
      {
        error: "Não foi possível resgatar o código. Tente novamente em instantes.",
        ...(devErrorDetail(e) ? { detalhe: devErrorDetail(e) } : {}),
      },
      { status: 500 }
    );
  }
}
