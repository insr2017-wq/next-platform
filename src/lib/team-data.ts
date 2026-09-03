import type { PrismaClient } from "@/lib/prisma-generated";
import { maskPhone } from "@/lib/format";

export type TeamMember = {
  userId: string;
  level: 1 | 2 | 3;
  phoneMasked: string;
  totalDeposited: number;
  createdAt: string;
  status: "Sem investimento" | "Ativo";
};

export type TeamData = {
  inviteCode: string;
  teamRechargeTotal: number;
  totalMembers: number;
  level1Count: number;
  level2Count: number;
  level3Count: number;
  level1DepositTotal: number;
  level2DepositTotal: number;
  level3DepositTotal: number;
  members: TeamMember[];
};

/**
 * Carrega dados da equipe (referrals) do usuário atual: níveis 1–3, totais de recarga e lista de membros.
 */
export async function getTeamData(
  prisma: PrismaClient,
  currentUserId: string
): Promise<TeamData> {
  const current = await prisma.user.findUnique({
    where: { id: currentUserId },
    select: { inviteCode: true },
  });
  const inviteCode = current?.inviteCode ?? "";

  const refsL1 = await prisma.referral.findMany({
    where: { inviterId: currentUserId },
    select: { invitedUserId: true },
  });
  const l1Ids = refsL1.map((r: { invitedUserId: string }) => r.invitedUserId);

  let l2Ids: string[] = [];
  if (l1Ids.length > 0) {
    const refsL2 = await prisma.referral.findMany({
      where: { inviterId: { in: l1Ids } },
      select: { invitedUserId: true },
    });
    l2Ids = refsL2.map((r: { invitedUserId: string }) => r.invitedUserId);
  }

  let l3Ids: string[] = [];
  if (l2Ids.length > 0) {
    const refsL3 = await prisma.referral.findMany({
      where: { inviterId: { in: l2Ids } },
      select: { invitedUserId: true },
    });
    l3Ids = refsL3.map((r: { invitedUserId: string }) => r.invitedUserId);
  }

  const allIds = [...new Set([...l1Ids, ...l2Ids, ...l3Ids])];
  const levelByUserId = new Map<string, 1 | 2 | 3>();
  for (const id of l1Ids) levelByUserId.set(id, 1);
  for (const id of l2Ids) levelByUserId.set(id, 2);
  for (const id of l3Ids) levelByUserId.set(id, 3);

  if (allIds.length === 0) {
    return {
      inviteCode,
      teamRechargeTotal: 0,
      totalMembers: 0,
      level1Count: 0,
      level2Count: 0,
      level3Count: 0,
      level1DepositTotal: 0,
      level2DepositTotal: 0,
      level3DepositTotal: 0,
      members: [],
    };
  }

  const [users, firstPurchaseRows] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: allIds } },
      select: { id: true, phone: true, createdAt: true },
    }),
    // Busca a primeira compra de produto (por usuário) e usa o valor dessa 1a compra.
    // A query vem ordenada por `purchasedAt` ascendente; ao iterar, o primeiro registro encontrado
    // para cada userId é a primeira compra real.
    prisma.userProduct.findMany({
      where: { userId: { in: allIds } },
      orderBy: { purchasedAt: "asc" },
      select: {
        userId: true,
        purchasedAt: true,
        product: { select: { price: true } },
      },
    }),
  ]);

  const firstPurchaseByUserId = new Map<string, number>();
  for (const row of firstPurchaseRows) {
    if (firstPurchaseByUserId.has(row.userId)) continue;
    const price = Number(row.product?.price ?? 0);
    firstPurchaseByUserId.set(row.userId, price);
  }

  type UserRow = { id: string; phone: string | null; createdAt: Date };
  const userById = new Map<string, UserRow>(
    users.map((u: UserRow) => [u.id, u])
  );

  const members: TeamMember[] = [];
  for (const userId of allIds) {
    const level = levelByUserId.get(userId) ?? 1;
    const u = userById.get(userId);
    const phone = u?.phone ?? "";
    // `totalDeposited` representa agora o INVESTIDO baseado apenas na PRIMEIRA compra.
    const totalDeposited = firstPurchaseByUserId.get(userId) ?? 0;
    const createdAt = u?.createdAt
      ? u.createdAt.toISOString()
      : "";
    const masked = maskPhone(phone);
    members.push({
      userId,
      level,
      phoneMasked: masked,
      totalDeposited,
      createdAt,
      status: totalDeposited > 0 ? "Ativo" : "Sem investimento",
    });
  }

  const teamRechargeTotal = members.reduce((s, m) => s + m.totalDeposited, 0);
  const level1DepositTotal = members
    .filter((m) => m.level === 1)
    .reduce((s, m) => s + m.totalDeposited, 0);
  const level2DepositTotal = members
    .filter((m) => m.level === 2)
    .reduce((s, m) => s + m.totalDeposited, 0);
  const level3DepositTotal = members
    .filter((m) => m.level === 3)
    .reduce((s, m) => s + m.totalDeposited, 0);

  return {
    inviteCode,
    teamRechargeTotal,
    totalMembers: members.length,
    level1Count: l1Ids.length,
    level2Count: l2Ids.length,
    level3Count: l3Ids.length,
    level1DepositTotal,
    level2DepositTotal,
    level3DepositTotal,
    members,
  };
}
