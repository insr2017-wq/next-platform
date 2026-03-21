import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  brazilTodayYMD,
  buildCheckInDaysUI,
  checkInBonusBRL,
  checkInStreakSummary,
  resolveNextCheckInSlot,
} from "@/lib/check-in";
import { ensureUserCheckInColumnsSqlite } from "@/lib/user-schema-sqlite";
import { devErrorDetail, logDevApiError } from "@/lib/dev-api-error";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "user") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    await ensureUserCheckInColumnsSqlite();
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        checkInLastDate: true,
        checkInLastSlot: true,
        banned: true,
      },
    });
    if (!user || user.banned) {
      return NextResponse.json({ error: "Conta indisponível." }, { status: 403 });
    }

    const todayYmd = brazilTodayYMD();
    const lastDate = user.checkInLastDate ?? null;
    const lastSlot = user.checkInLastSlot ?? 0;
    const resolved = resolveNextCheckInSlot(lastDate, lastSlot, todayYmd);
    const canCheckIn = !(
      "alreadyToday" in resolved && resolved.alreadyToday
    );
    const days = buildCheckInDaysUI(lastDate, lastSlot, todayYmd);
    const { streakDays, nextBonus } = checkInStreakSummary(
      lastDate,
      lastSlot,
      todayYmd
    );

    return NextResponse.json({
      canCheckIn,
      days,
      streakDays,
      nextBonus,
      blockedMessage: canCheckIn
        ? undefined
        : "Check-in já realizado hoje. Disponível novamente após 00:00.",
    });
  } catch (e) {
    logDevApiError("check-in GET", e);
    return NextResponse.json(
      {
        error: "Não foi possível carregar o check-in.",
        ...(devErrorDetail(e) ? { detalhe: devErrorDetail(e) } : {}),
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "user") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const todayYmd = brazilTodayYMD();

  try {
    await ensureUserCheckInColumnsSqlite();
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: session.userId },
        select: {
          checkInLastDate: true,
          checkInLastSlot: true,
          banned: true,
        },
      });
      if (!user || user.banned) {
        return { type: "forbidden" as const };
      }
      const lastDate = user.checkInLastDate ?? null;
      const lastSlot = user.checkInLastSlot ?? 0;
      const resolved = resolveNextCheckInSlot(lastDate, lastSlot, todayYmd);
      if ("alreadyToday" in resolved && resolved.alreadyToday) {
        return { type: "already_today" as const };
      }
      const nextSlot = (resolved as { nextSlot: number }).nextSlot;
      const amount = checkInBonusBRL(nextSlot);

      await tx.user.update({
        where: { id: session.userId },
        data: {
          checkInLastDate: todayYmd,
          checkInLastSlot: nextSlot,
          balance: { increment: amount },
        },
      });

      return {
        type: "ok" as const,
        slot: nextSlot,
        amount,
        lastDate: todayYmd,
        lastSlot: nextSlot,
      };
    });

    if (result.type === "forbidden") {
      return NextResponse.json({ error: "Conta indisponível." }, { status: 403 });
    }
    if (result.type === "already_today") {
      return NextResponse.json(
        {
          error:
            "Check-in já realizado hoje. Disponível novamente após 00:00.",
        },
        { status: 400 }
      );
    }

    const days = buildCheckInDaysUI(
      result.lastDate,
      result.lastSlot,
      todayYmd
    );
    const { streakDays, nextBonus } = checkInStreakSummary(
      result.lastDate,
      result.lastSlot,
      todayYmd
    );

    return NextResponse.json({
      success: true,
      amount: result.amount,
      slot: result.slot,
      days,
      canCheckIn: false,
      streakDays,
      nextBonus,
      message: `Você recebeu ${new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(result.amount)}!`,
    });
  } catch (e) {
    logDevApiError("check-in POST", e);
    return NextResponse.json(
      {
        error: "Não foi possível concluir o check-in.",
        ...(devErrorDetail(e) ? { detalhe: devErrorDetail(e) } : {}),
      },
      { status: 500 }
    );
  }
}
