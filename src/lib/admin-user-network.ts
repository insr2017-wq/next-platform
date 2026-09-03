import { prisma } from "@/lib/db";
import { getTeamData } from "@/lib/team-data";

export type AdminNetworkMember = {
  userId: string;
  publicId: string;
  phone: string;
  fullName: string;
  level: 1 | 2 | 3;
  invested: number;
  commissionGenerated: number;
  status: string;
};

export type AdminUserNetwork = {
  inviteCode: string;
  invitedBy: {
    userId: string;
    publicId: string;
    phone: string;
    fullName: string;
  } | null;
  level1Count: number;
  level2Count: number;
  level3Count: number;
  teamInvested: number;
  commissionsReceived: number;
  members: AdminNetworkMember[];
};

export async function getAdminUserNetwork(userId: string): Promise<AdminUserNetwork> {
  const [team, invitedRow, commissionRows] = await Promise.all([
    getTeamData(prisma, userId),
    prisma.referral.findFirst({
      where: { invitedUserId: userId },
      select: {
        inviter: {
          select: { id: true, publicId: true, phone: true, fullName: true },
        },
      },
    }),
    prisma.referralCommission.groupBy({
      by: ["sourceUserId"],
      where: { userId },
      _sum: { amount: true },
    }),
  ]);

  const commissionBySource = new Map(
    commissionRows.map((r) => [r.sourceUserId, Number(r._sum.amount ?? 0)])
  );

  const ids = team.members.map((m) => m.userId);
  const users =
    ids.length === 0
      ? []
      : await prisma.user.findMany({
          where: { id: { in: ids } },
          select: { id: true, publicId: true, phone: true, fullName: true },
        });
  const byId = new Map(users.map((u) => [u.id, u]));

  const members: AdminNetworkMember[] = team.members.map((m) => {
    const u = byId.get(m.userId);
    return {
      userId: m.userId,
      publicId: u?.publicId ?? "",
      phone: u?.phone ?? m.phoneMasked,
      fullName: u?.fullName ?? "",
      level: m.level,
      invested: m.totalDeposited,
      commissionGenerated: commissionBySource.get(m.userId) ?? 0,
      status: m.status,
    };
  });

  const commissionsReceived = commissionRows.reduce(
    (s, r) => s + Number(r._sum.amount ?? 0),
    0
  );

  return {
    inviteCode: team.inviteCode,
    invitedBy: invitedRow?.inviter
      ? {
          userId: invitedRow.inviter.id,
          publicId: invitedRow.inviter.publicId ?? "",
          phone: invitedRow.inviter.phone,
          fullName: invitedRow.inviter.fullName,
        }
      : null,
    level1Count: team.level1Count,
    level2Count: team.level2Count,
    level3Count: team.level3Count,
    teamInvested: team.teamRechargeTotal,
    commissionsReceived,
    members,
  };
}

export async function unlinkReferral(inviterId: string, invitedUserId: string) {
  const row = await prisma.referral.findFirst({
    where: { inviterId, invitedUserId },
    include: {
      inviter: { select: { inviteCode: true } },
      invitedUser: { select: { referredBy: true } },
    },
  });
  if (!row) {
    return { ok: false as const, error: "Vínculo de indicação não encontrado." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.referral.delete({ where: { id: row.id } });
    if (row.invitedUser.referredBy && row.invitedUser.referredBy === row.inviter.inviteCode) {
      await tx.user.update({
        where: { id: invitedUserId },
        data: { referredBy: null },
      });
    }
  });

  return { ok: true as const };
}
