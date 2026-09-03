import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { brazilTodayYmd, brazilYmdAdd, formatYmdBr } from "@/lib/datetime-br";
import { roundMoney } from "@/lib/cashback";

const ALLOWED_DAYS = new Set([7, 30, 90]);

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "user") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const url = new URL(request.url);
  const daysRaw = Number(url.searchParams.get("days") ?? 7);
  const days = ALLOWED_DAYS.has(daysRaw) ? daysRaw : 7;

  const today = brazilTodayYmd();
  const start = brazilYmdAdd(today, -(days - 1));
  const prevStart = brazilYmdAdd(start, -days);
  const prevEnd = brazilYmdAdd(start, -1);

  try {
    const rows = await prisma.userDailyProfit.findMany({
      where: {
        userId: session.userId,
        date: { gte: prevStart, lte: today },
      },
      select: { date: true, amount: true },
    });

    const byDate = new Map(rows.map((r) => [r.date, Number(r.amount)]));

    let cumulative = 0;
    let periodProfit = 0;
    const points: Array<{ day: string; value: number }> = [];
    for (let i = 0; i < days; i++) {
      const ymd = brazilYmdAdd(start, i);
      const daily = roundMoney(byDate.get(ymd) ?? 0);
      periodProfit = roundMoney(periodProfit + daily);
      cumulative = roundMoney(cumulative + daily);
      points.push({ day: formatYmdBr(ymd), value: cumulative });
    }

    let previousProfit = 0;
    for (let i = 0; i < days; i++) {
      const ymd = brazilYmdAdd(prevStart, i);
      if (ymd > prevEnd) break;
      previousProfit = roundMoney(previousProfit + (byDate.get(ymd) ?? 0));
    }

    const growthPercent =
      previousProfit > 0
        ? roundMoney(((periodProfit - previousProfit) / previousProfit) * 100)
        : periodProfit > 0
          ? 100
          : 0;

    return NextResponse.json({
      days,
      points,
      periodProfit,
      growthPercent,
    });
  } catch (e) {
    console.error("profit-history:", e);
    const empty = Array.from({ length: days }, (_, i) => ({
      day: formatYmdBr(brazilYmdAdd(start, i)),
      value: 0,
    }));
    return NextResponse.json({ days, points: empty, periodProfit: 0, growthPercent: 0 });
  }
}
