import { prisma } from "@/lib/db";
import { getMondayPeriodStart } from "./period";

/**
 * Abre um período novo para missões com resets=true (não apaga o histórico da semana anterior).
 * Chamado de forma preguiçosa em listUserMissions e também via /api/cron/missions-weekly-reset.
 */
export async function openCurrentWeeklyPeriod() {
  const thisMonday = getMondayPeriodStart();
  const weekly = await prisma.mission.findMany({
    where: { resets: true, isActive: true },
    select: { id: true },
  });
  if (weekly.length === 0) return { opened: 0 };

  const usersWithProgress = await prisma.userMissionProgress.findMany({
    where: { missionId: { in: weekly.map((m) => m.id) } },
    distinct: ["userId"],
    select: { userId: true },
  });

  let opened = 0;
  for (const mission of weekly) {
    for (const { userId } of usersWithProgress) {
      const current = await prisma.userMissionProgress.findUnique({
        where: {
          userId_missionId_periodStart: {
            userId,
            missionId: mission.id,
            periodStart: thisMonday,
          },
        },
        select: { id: true },
      });
      if (current) continue;
      try {
        await prisma.userMissionProgress.create({
          data: {
            userId,
            missionId: mission.id,
            periodStart: thisMonday,
            currentProgress: 0,
          },
        });
        opened += 1;
      } catch {
        // unique race
      }
    }
  }
  return { opened };
}
