import { prisma } from "@/lib/db";
import { SNAPSHOT_CRITERIA } from "./constants";
import { brazilTodayYMD, dayDiffYMD, getPeriodStart } from "./period";

type MissionRow = {
  id: string;
  criterion: string;
  targetValue: number;
  resets: boolean;
  requiredLevel?: number | null;
};

async function getOrCreateProgress(userId: string, mission: MissionRow) {
  const periodStart = getPeriodStart(mission.resets);
  const existing = await prisma.userMissionProgress.findUnique({
    where: {
      userId_missionId_periodStart: {
        userId,
        missionId: mission.id,
        periodStart,
      },
    },
  });
  if (existing) return existing;
  try {
    return await prisma.userMissionProgress.create({
      data: {
        userId,
        missionId: mission.id,
        periodStart,
        currentProgress: 0,
      },
    });
  } catch {
    const raced = await prisma.userMissionProgress.findUnique({
      where: {
        userId_missionId_periodStart: {
          userId,
          missionId: mission.id,
          periodStart,
        },
      },
    });
    if (raced) return raced;
    throw new Error("MISSION_PROGRESS_CREATE_FAILED");
  }
}

async function writeProgress(
  progressId: string,
  nextValue: number,
  targetValue: number,
  completedAt: Date | null
) {
  const done = nextValue >= targetValue;
  await prisma.userMissionProgress.update({
    where: { id: progressId },
    data: {
      currentProgress: nextValue,
      completedAt: completedAt ?? (done ? new Date() : null),
    },
  });
}

async function countActiveDirectReferrals(userId: string, since?: Date, requiredLevel = 1): Promise<number> {
  const level = Math.min(3, Math.max(1, Math.trunc(requiredLevel || 1)));
  let currentIds = [userId];
  for (let hop = 0; hop < level; hop++) {
    const refs = await prisma.referral.findMany({
      where: { inviterId: { in: currentIds } },
      select: { invitedUserId: true },
    });
    currentIds = refs.map((r) => r.invitedUserId);
    if (currentIds.length === 0) return 0;
  }
  if (since) return currentIds.length;

  const withProduct = await prisma.userProduct.groupBy({
    by: ["userId"],
    where: { userId: { in: currentIds } },
  });
  return withProduct.length;
}

async function collectNetworkIds(userId: string): Promise<string[]> {
  const refsL1 = await prisma.referral.findMany({
    where: { inviterId: userId },
    select: { invitedUserId: true },
  });
  const l1 = refsL1.map((r) => r.invitedUserId);
  let l2: string[] = [];
  if (l1.length > 0) {
    const refsL2 = await prisma.referral.findMany({
      where: { inviterId: { in: l1 } },
      select: { invitedUserId: true },
    });
    l2 = refsL2.map((r) => r.invitedUserId);
  }
  let l3: string[] = [];
  if (l2.length > 0) {
    const refsL3 = await prisma.referral.findMany({
      where: { inviterId: { in: l2 } },
      select: { invitedUserId: true },
    });
    l3 = refsL3.map((r) => r.invitedUserId);
  }
  return [...new Set([...l1, ...l2, ...l3])];
}

async function networkVolume(userId: string, since?: Date): Promise<number> {
  const ids = await collectNetworkIds(userId);
  if (ids.length === 0) return 0;
  const purchases = await prisma.userProduct.findMany({
    where: { userId: { in: ids } },
    orderBy: { purchasedAt: "asc" },
    select: {
      userId: true,
      purchasedAt: true,
      product: { select: { price: true } },
    },
  });
  const firstByUser = new Map<string, { price: number; at: Date }>();
  for (const row of purchases) {
    if (firstByUser.has(row.userId)) continue;
    firstByUser.set(row.userId, {
      price: Number(row.product?.price ?? 0),
      at: row.purchasedAt,
    });
  }
  let total = 0;
  for (const item of firstByUser.values()) {
    if (since && item.at < since) continue;
    total += item.price;
  }
  return total;
}

async function computeSnapshot(userId: string, mission: MissionRow): Promise<number | null> {
  switch (mission.criterion) {
    case "cadastro_chave_pix": {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { pixKey: true, holderCpf: true },
      });
      return user?.pixKey && user.holderCpf ? 1 : 0;
    }
    case "primeiro_deposito_min": {
      const paid = await prisma.deposit.findMany({
        where: { userId, status: "paid" },
        select: { amount: true },
      });
      if (paid.length === 0) return 0;
      return Math.max(...paid.map((d) => Number(d.amount)));
    }
    case "compra_produto": {
      return prisma.userProduct.count({ where: { userId } });
    }
    case "indicados_ativos": {
      const since = mission.resets ? getPeriodStart(true) : undefined;
      return countActiveDirectReferrals(userId, since, mission.requiredLevel ?? 1);
    }
    case "volume_rede": {
      const since = mission.resets ? getPeriodStart(true) : undefined;
      return networkVolume(userId, since);
    }
    default:
      return null;
  }
}

export async function syncUserMissionProgress(userId: string, criteria?: string[]) {
  const missions = await prisma.mission.findMany({
    where: {
      isActive: true,
      ...(criteria && criteria.length > 0 ? { criterion: { in: criteria } } : {}),
    },
  });

  for (const mission of missions) {
    if (criteria && criteria.length > 0 && !SNAPSHOT_CRITERIA.has(mission.criterion)) {
      continue;
    }
    if (!SNAPSHOT_CRITERIA.has(mission.criterion)) continue;

    const row = await getOrCreateProgress(userId, mission);
    const value = await computeSnapshot(userId, mission);
    if (value == null) continue;
    if (row.completedAt && value <= row.currentProgress) continue;
    if (value === row.currentProgress && row.completedAt) continue;
    if (value === row.currentProgress && !row.completedAt && value < mission.targetValue) continue;

    await writeProgress(
      row.id,
      value,
      mission.targetValue,
      row.completedAt
    );
  }
}

async function setEventProgress(userId: string, criterion: string, nextForMission: (current: number) => number) {
  const missions = await prisma.mission.findMany({
    where: { isActive: true, criterion },
  });
  for (const mission of missions) {
    const row = await getOrCreateProgress(userId, mission);
    if (row.completedAt) continue;
    const next = nextForMission(row.currentProgress);
    if (next === row.currentProgress) continue;
    await writeProgress(row.id, next, mission.targetValue, null);
  }
}

export async function recordLoginStreak(userId: string) {
  const today = brazilTodayYMD();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastMissionLoginDate: true },
  });
  if (!user) return;
  if (user.lastMissionLoginDate === today) return;

  const consecutive = user.lastMissionLoginDate
    ? dayDiffYMD(user.lastMissionLoginDate, today) === 1
    : false;

  await prisma.user.update({
    where: { id: userId },
    data: { lastMissionLoginDate: today },
  });

  await setEventProgress(userId, "login_streak", (current) =>
    consecutive ? current + 1 : 1
  );
}

export async function bumpRouletteMissionStreak(userId: string, previousDate: string | null) {
  const today = brazilTodayYMD();
  const consecutive = previousDate ? dayDiffYMD(previousDate, today) === 1 : false;
  await setEventProgress(userId, "roleta_streak", (current) => (consecutive ? current + 1 : 1));
}

export async function recordRouletteStreak(userId: string): Promise<{ extraRemaining: number; usedExtra: boolean }> {
  const today = brazilTodayYMD();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastMissionRouletteDate: true, extraRouletteSpins: true },
  });
  if (!user) return { extraRemaining: 0, usedExtra: false };

  const alreadyToday = user.lastMissionRouletteDate === today;
  if (alreadyToday) {
    if (user.extraRouletteSpins <= 0) {
      return { extraRemaining: 0, usedExtra: false };
    }
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { extraRouletteSpins: { decrement: 1 } },
      select: { extraRouletteSpins: true },
    });
    return { extraRemaining: updated.extraRouletteSpins, usedExtra: true };
  }

  const consecutive = user.lastMissionRouletteDate
    ? dayDiffYMD(user.lastMissionRouletteDate, today) === 1
    : false;

  await prisma.user.update({
    where: { id: userId },
    data: { lastMissionRouletteDate: today },
  });

  await setEventProgress(userId, "roleta_streak", (current) =>
    consecutive ? current + 1 : 1
  );

  const remaining = await prisma.user.findUnique({
    where: { id: userId },
    select: { extraRouletteSpins: true },
  });
  return { extraRemaining: remaining?.extraRouletteSpins ?? 0, usedExtra: false };
}

export async function syncInviterReferralMissions(buyerId: string) {
  const l1 = await prisma.referral.findFirst({
    where: { invitedUserId: buyerId },
    select: { inviterId: true },
  });
  if (!l1) return;

  const l2 = await prisma.referral.findFirst({
    where: { invitedUserId: l1.inviterId },
    select: { inviterId: true },
  });
  const l3 = l2
    ? await prisma.referral.findFirst({
        where: { invitedUserId: l2.inviterId },
        select: { inviterId: true },
      })
    : null;

  const ids = [l1.inviterId, l2?.inviterId, l3?.inviterId].filter(
    (id): id is string => Boolean(id)
  );
  for (const id of ids) {
    await syncUserMissionProgress(id, ["indicados_ativos", "volume_rede"]);
  }
}

export async function safeSyncUserMissionProgress(userId: string, criteria?: string[]) {
  try {
    await syncUserMissionProgress(userId, criteria);
  } catch (e) {
    console.error("[missions] sync failed", e);
  }
}

export async function safeRecordLoginStreak(userId: string) {
  try {
    await recordLoginStreak(userId);
  } catch (e) {
    console.error("[missions] login streak failed", e);
  }
}

export async function safeSyncInviterReferralMissions(buyerId: string) {
  try {
    await syncInviterReferralMissions(buyerId);
  } catch (e) {
    console.error("[missions] inviter sync failed", e);
  }
}
