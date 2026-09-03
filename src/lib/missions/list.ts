import { prisma } from "@/lib/db";
import { formatMissionReward } from "./format";
import { getPeriodStart } from "./period";
import { SNAPSHOT_CRITERIA } from "./constants";
import { syncUserMissionProgress, safeRecordLoginStreak } from "./evaluate";
import type { UserMissionView } from "./types";

export type { UserMissionView };

export async function listUserMissions(userId: string): Promise<{
  extraRouletteSpins: number;
  items: UserMissionView[];
}> {
  await safeRecordLoginStreak(userId);
  await syncUserMissionProgress(userId, [...SNAPSHOT_CRITERIA]);

  const [missions, user] = await Promise.all([
    prisma.mission.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { extraRouletteSpins: true },
    }),
  ]);

  const periodPermanent = getPeriodStart(false);
  const periodWeekly = getPeriodStart(true);
  const progressRows =
    missions.length === 0
      ? []
      : await prisma.userMissionProgress.findMany({
          where: {
            userId,
            missionId: { in: missions.map((m) => m.id) },
            periodStart: { in: [periodPermanent, periodWeekly] },
          },
        });
  const progressByKey = new Map(
    progressRows.map((r) => [`${r.missionId}:${r.periodStart.toISOString()}`, r])
  );

  const items: UserMissionView[] = missions.map((mission) => {
    const periodStart = getPeriodStart(mission.resets);
    const row = progressByKey.get(`${mission.id}:${periodStart.toISOString()}`);
    const current = Number(row?.currentProgress ?? 0);
    const completed = Boolean(row?.completedAt) || current >= mission.targetValue;
    const redeemed = Boolean(row?.redeemedAt);
    return {
      id: mission.id,
      title: mission.title,
      description: mission.description,
      type: mission.type,
      criterion: mission.criterion,
      icon: mission.icon,
      targetValue: Number(mission.targetValue),
      currentProgress: current,
      completed,
      redeemed,
      canRedeem: completed && !redeemed,
      rewardType: mission.rewardType,
      rewardValue: Number(mission.rewardValue),
      rewardLabel: formatMissionReward(mission.rewardType, Number(mission.rewardValue)),
      resets: mission.resets,
      sortOrder: mission.sortOrder,
    };
  });

  return {
    extraRouletteSpins: user?.extraRouletteSpins ?? 0,
    items,
  };
}

export async function safeListUserMissions(userId: string): Promise<{
  extraRouletteSpins: number;
  items: UserMissionView[];
}> {
  try {
    return await listUserMissions(userId);
  } catch (e) {
    console.error("[missions] list failed", e);
    return { extraRouletteSpins: 0, items: [] };
  }
}
