import { prisma } from "@/lib/db";
import { getPlatformSettings } from "@/lib/platform-settings";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Credita rendimentos em intervalos completos desde a compra
 * (ou desde o último crédito). Executado em rotas do usuário (layout) — sem job em background.
 */
export async function applyPendingProductPayouts(userId: string): Promise<void> {
  const s = await getPlatformSettings();
  const testIntervalMinutes = Number(s.earningsTestIntervalMinutes ?? 10);
  const intervalMs = s.earningsTestMode
    ? Math.max(1, testIntervalMinutes) * 60 * 1000
    : MS_PER_DAY;

  await prisma.$transaction(async (tx) => {
    const owned = await tx.userProduct.findMany({
      where: { userId },
      select: { id: true },
    });
    for (const { id } of owned) {
      let guard = 0;
      while (guard++ < 400) {
        const row = await tx.userProduct.findUnique({
          where: { id },
          include: {
            product: { select: { dailyYield: true, cycleDays: true } },
          },
        });
        if (!row) break;

        if (row.earningStatus === "completed") break;

        let daily = row.dailyYieldSnapshot;
        let cycle = row.cycleDaysSnapshot;
        if (daily <= 0 || cycle < 1) {
          daily = Number(row.product.dailyYield);
          cycle = Math.max(1, row.product.cycleDays);
          await tx.userProduct.update({
            where: { id: row.id },
            data: {
              dailyYieldSnapshot: daily,
              cycleDaysSnapshot: cycle,
            },
          });
        }

        if (row.daysPaid >= cycle) {
          await tx.userProduct.updateMany({
            where: { id: row.id, earningStatus: "active" },
            data: { earningStatus: "completed" },
          });
          break;
        }

        const anchor = row.lastPayoutAt ?? row.purchasedAt;
        const nextDue = new Date(anchor.getTime() + intervalMs);
        if (Date.now() < nextDue.getTime()) break;

        const expectedDays = row.daysPaid;
        const expectedLast = row.lastPayoutAt;
        const newDays = expectedDays + 1;
        const newLast = nextDue;
        const completed = newDays >= cycle;

        const whereClause =
          expectedLast === null
            ? {
                id: row.id,
                daysPaid: expectedDays,
                lastPayoutAt: null as Date | null,
                earningStatus: "active" as const,
              }
            : {
                id: row.id,
                daysPaid: expectedDays,
                lastPayoutAt: expectedLast,
                earningStatus: "active" as const,
              };

        const claimed = await tx.userProduct.updateMany({
          where: whereClause,
          data: {
            daysPaid: newDays,
            lastPayoutAt: newLast,
            earningStatus: completed ? "completed" : "active",
          },
        });

        if (claimed.count === 0) {
          continue;
        }

        await tx.user.update({
          where: { id: userId },
          data: { balance: { increment: daily } },
        });

        if (completed) break;
      }
    }
  });
}
