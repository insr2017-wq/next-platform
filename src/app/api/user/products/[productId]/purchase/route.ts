import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPlatformSettings } from "@/lib/platform-settings";

export async function POST(
  _request: Request,
  context: { params: Promise<{ productId: string }> }
) {
  const session = await getSession();
  if (!session || session.role === "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { productId } = await context.params;
  if (!productId) {
    return NextResponse.json({ error: "Produto inválido." }, { status: 400 });
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true },
  });
  if (!product) {
    return NextResponse.json({ error: "Produto indisponível." }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { balance: true, banned: true },
  });
  if (!user || user.banned) {
    return NextResponse.json({ error: "Conta inválida." }, { status: 403 });
  }

  if (user.balance < product.price) {
    return NextResponse.json(
      { error: "Saldo insuficiente. Recarregue sua conta." },
      { status: 400 }
    );
  }

  try {
    const settings = await getPlatformSettings();

    await prisma.$transaction(async (tx) => {
      const buyerId = session.userId;

      const userProduct = await tx.userProduct.create({
        data: {
          userId: buyerId,
          productId: product.id,
          dailyYieldSnapshot: Number(product.dailyYield),
          cycleDaysSnapshot: Math.max(1, product.cycleDays),
          daysPaid: 0,
          lastPayoutAt: null,
          earningStatus: "active",
        },
      });

      await tx.user.update({
        where: { id: buyerId },
        data: { balance: { decrement: product.price } },
      });

      // === Comissões de indicação: somente após compra confirmada ===
      // Nível 1: quem indicou o comprador
      const l1 = await tx.referral.findFirst({
        where: { invitedUserId: buyerId },
        select: { inviterId: true },
      });
      if (!l1) return;

      // Busca encadeamento até nível 3 (se existir)
      const l2 = await tx.referral.findFirst({
        where: { invitedUserId: l1.inviterId },
        select: { inviterId: true },
      });
      const l3 = l2
        ? await tx.referral.findFirst({
            where: { invitedUserId: l2.inviterId },
            select: { inviterId: true },
          })
        : null;

      const existing = await tx.referralCommission.findMany({
        where: { userProductId: userProduct.id },
        select: { level: true },
      });
      const existingLevels = new Set(existing.map((e) => e.level));

      const inviterIdsByLevel: Array<{ level: 1 | 2 | 3; userId: string }> = [];
      if (!existingLevels.has(1)) inviterIdsByLevel.push({ level: 1, userId: l1.inviterId });
      if (l2 && !existingLevels.has(2)) inviterIdsByLevel.push({ level: 2, userId: l2.inviterId });
      if (l3 && !existingLevels.has(3)) inviterIdsByLevel.push({ level: 3, userId: l3.inviterId });

      if (inviterIdsByLevel.length === 0) return;

      const inviterIds = inviterIdsByLevel.map((x) => x.userId);
      const inviters = await tx.user.findMany({
        where: { id: { in: inviterIds } },
        select: { id: true },
      });
      const inviterIdSet = new Set(inviters.map((u) => u.id));

      const base = Number(product.price);
      const round2 = (n: number) => Math.round(n * 100) / 100;
      const levelPerc = {
        1: Number(settings.commissionLevel1),
        2: Number(settings.commissionLevel2),
        3: Number(settings.commissionLevel3),
      };

      for (const entry of inviterIdsByLevel) {
        if (!inviterIdSet.has(entry.userId)) continue;
        const perc = levelPerc[entry.level];
        const raw = (base * perc) / 100;
        const amount = round2(Number.isFinite(raw) ? raw : 0);
        if (amount <= 0) continue;

        await tx.referralCommission.create({
          data: {
            userId: entry.userId,
            sourceUserId: buyerId,
            userProductId: userProduct.id,
            level: entry.level,
            amount,
          },
        });

        await tx.user.update({
          where: { id: entry.userId },
          data: { balance: { increment: amount } },
        });
      }
    });
  } catch (e) {
    console.error("purchase:", e);
    return NextResponse.json({ error: "Não foi possível concluir a compra." }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Produto adquirido com sucesso." });
}
