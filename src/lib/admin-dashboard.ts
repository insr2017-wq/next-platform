import { prisma } from "@/lib/db";
import { brazilDayRangeUtc, brazilTodayYmd, brazilYmdAdd } from "@/lib/datetime-br";

export type DayPoint = {
  date: string;
  label: string;
  users: number;
  inflow: number;
  outflow: number;
};

export type YieldPoint = {
  date: string;
  label: string;
  amount: number;
};

export type AdminDashboardData = {
  todayUsers: number;
  todayInflow: number;
  todayOutflow: number;
  pendingWithdrawalsCount: number;
  pendingWithdrawalsSum: number;
  yieldNext7: number;
  yieldNext14: number;
  series: DayPoint[];
  yieldForecast: YieldPoint[];
};

function label(ymd: string): string {
  const [, m, d] = ymd.split("-");
  return `${d}/${m}`;
}

function bucketSum(
  rows: { at: Date; amount: number }[],
  start: Date,
  end: Date
): number {
  let sum = 0;
  for (const row of rows) {
    if (row.at >= start && row.at < end) sum += row.amount;
  }
  return sum;
}

export async function getAdminDashboardData(days = 14): Promise<AdminDashboardData> {
  const today = brazilTodayYmd();
  const fromYmd = brazilYmdAdd(today, -(days - 1));
  const { start: rangeStart } = brazilDayRangeUtc(fromYmd);
  const { end: rangeEnd } = brazilDayRangeUtc(today);

  const [newUsers, paidDeposits, withdrawals, pending, activeProducts] = await Promise.all([
    prisma.user.findMany({
      where: { createdAt: { gte: rangeStart, lt: rangeEnd }, role: "user" },
      select: { createdAt: true },
    }),
    prisma.deposit.findMany({
      where: {
        status: "paid",
        OR: [
          { paidAt: { gte: rangeStart, lt: rangeEnd } },
          { paidAt: null, createdAt: { gte: rangeStart, lt: rangeEnd } },
        ],
      },
      select: { amount: true, paidAt: true, createdAt: true },
    }),
    prisma.withdrawal.findMany({
      where: {
        status: { in: ["processed", "pending", "processing"] },
        createdAt: { gte: rangeStart, lt: rangeEnd },
      },
      select: { requestedAmount: true, netAmount: true, amount: true, createdAt: true, status: true },
    }),
    prisma.withdrawal.aggregate({
      where: { status: "pending" },
      _count: { id: true },
      _sum: { requestedAmount: true },
    }),
    prisma.userProduct.findMany({
      where: { earningStatus: "active" },
      select: {
        dailyYieldSnapshot: true,
        cycleDaysSnapshot: true,
        daysPaid: true,
        purchasedAt: true,
        lastPayoutAt: true,
        product: { select: { dailyYield: true, cycleDays: true } },
      },
    }),
  ]);

  const userPoints = newUsers.map((u) => ({ at: u.createdAt, amount: 1 }));
  const inPoints = paidDeposits.map((d) => ({
    at: d.paidAt ?? d.createdAt,
    amount: Number(d.amount) || 0,
  }));
  const outPoints = withdrawals.map((w) => ({
    at: w.createdAt,
    amount: Number(w.requestedAmount || w.netAmount || w.amount) || 0,
  }));

  const series: DayPoint[] = [];
  for (let i = 0; i < days; i++) {
    const ymd = brazilYmdAdd(fromYmd, i);
    const { start, end } = brazilDayRangeUtc(ymd);
    series.push({
      date: ymd,
      label: label(ymd),
      users: bucketSum(userPoints, start, end),
      inflow: bucketSum(inPoints, start, end),
      outflow: bucketSum(outPoints, start, end),
    });
  }

  const todayPoint = series[series.length - 1];

  const yieldForecast: YieldPoint[] = [];
  for (let i = 0; i < 14; i++) {
    const ymd = brazilYmdAdd(today, i);
    yieldForecast.push({ date: ymd, label: i === 0 ? "Hoje" : label(ymd), amount: 0 });
  }

  const now = Date.now();
  for (const row of activeProducts) {
    const daily = Number(row.dailyYieldSnapshot) || Number(row.product.dailyYield) || 0;
    const cycle = Math.max(1, row.cycleDaysSnapshot || row.product.cycleDays || 1);
    const remaining = Math.max(0, cycle - row.daysPaid);
    if (daily <= 0 || remaining <= 0) continue;
    const anchor = row.lastPayoutAt ?? row.purchasedAt;
    for (let i = 0; i < remaining && i < 14; i++) {
      const due = new Date(anchor.getTime() + (i + 1) * 24 * 60 * 60 * 1000);
      const offsetDays = Math.floor((due.getTime() - now) / (24 * 60 * 60 * 1000));
      if (offsetDays >= 14) continue;
      const idx = offsetDays < 0 ? 0 : offsetDays;
      yieldForecast[idx]!.amount += daily;
    }
  }

  const yieldNext7 = yieldForecast.slice(0, 7).reduce((s, p) => s + p.amount, 0);
  const yieldNext14 = yieldForecast.reduce((s, p) => s + p.amount, 0);

  return {
    todayUsers: todayPoint?.users ?? 0,
    todayInflow: todayPoint?.inflow ?? 0,
    todayOutflow: todayPoint?.outflow ?? 0,
    pendingWithdrawalsCount: pending._count.id,
    pendingWithdrawalsSum: Number(pending._sum.requestedAmount ?? 0),
    yieldNext7,
    yieldNext14,
    series,
    yieldForecast,
  };
}
