import { prisma } from "@/lib/db";
import { AdminBonusCodesManager, type BonusCodeRow } from "@/components/admin/AdminBonusCodesManager";

export default async function AdminBonusCodesPage() {
  let rows: BonusCodeRow[] = [];
  try {
    const codes = await prisma.bonusCode.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { redemptions: true } },
      },
    });
    rows = codes.map((c) => ({
      id: c.id,
      code: c.code,
      minAmount: Number(c.minAmount),
      maxAmount: Number(c.maxAmount),
      maxRedemptions: c.maxRedemptions,
      isActive: c.isActive,
      redemptionCount: c._count.redemptions,
      createdAt: c.createdAt.toISOString(),
    }));
  } catch {
    rows = [];
  }

  return <AdminBonusCodesManager initialRows={rows} />;
}
