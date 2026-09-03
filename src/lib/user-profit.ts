import { prisma } from "@/lib/db";

/** Rendimentos creditados (dias pagos × yield diário) + comissões de indicação recebidas. */
export async function getUserAccumulatedProfit(userId: string): Promise<number> {
  const [userProducts, commissionAgg] = await Promise.all([
    prisma.userProduct.findMany({
      where: { userId },
      select: {
        daysPaid: true,
        dailyYieldSnapshot: true,
        product: { select: { dailyYield: true } },
      },
    }),
    prisma.referralCommission.aggregate({
      where: { userId },
      _sum: { amount: true },
    }),
  ]);

  const yieldTotal = userProducts.reduce((sum, row) => {
    const daily =
      row.dailyYieldSnapshot > 0
        ? row.dailyYieldSnapshot
        : Number(row.product.dailyYield);
    return sum + row.daysPaid * daily;
  }, 0);

  const commissionTotal = Number(commissionAgg._sum.amount ?? 0);
  return Math.round((yieldTotal + commissionTotal) * 100) / 100;
}

export async function getUserTotalInvested(userId: string): Promise<number> {
  const rows = await prisma.userProduct.findMany({
    where: { userId },
    select: { product: { select: { price: true } } },
  });
  const total = rows.reduce((sum, row) => sum + Number(row.product.price), 0);
  return Math.round(total * 100) / 100;
}
