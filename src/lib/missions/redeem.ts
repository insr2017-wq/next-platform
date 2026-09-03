import { prisma } from "@/lib/db";
import { getPeriodStart } from "./period";

export async function redeemMissionReward(userId: string, missionId: string) {
  const mission = await prisma.mission.findFirst({
    where: { id: missionId, isActive: true },
  });
  if (!mission) {
    return { ok: false as const, status: 404, error: "Missão não encontrada." };
  }

  const periodStart = getPeriodStart(mission.resets);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const row = await tx.userMissionProgress.findUnique({
        where: {
          userId_missionId_periodStart: {
            userId,
            missionId: mission.id,
            periodStart,
          },
        },
      });
      if (!row || (!row.completedAt && row.currentProgress < mission.targetValue)) {
        return { ok: false as const, status: 400, error: "Conclua a missão antes de resgatar." };
      }
      if (row.redeemedAt) {
        return { ok: false as const, status: 409, error: "Recompensa já resgatada." };
      }

      if (mission.rewardType === "valor_fixo" && mission.rewardValue > 0) {
        await tx.user.update({
          where: { id: userId },
          data: { balance: { increment: mission.rewardValue } },
        });
      } else if (mission.rewardType === "giro_extra_roleta") {
        const spins = Math.max(1, Math.round(mission.rewardValue));
        await tx.user.update({
          where: { id: userId },
          data: { extraRouletteSpins: { increment: spins } },
        });
      }

      await tx.userMissionProgress.update({
        where: { id: row.id },
        data: {
          completedAt: row.completedAt ?? new Date(),
          redeemedAt: new Date(),
        },
      });

      return { ok: true as const };
    });
    return result;
  } catch (e) {
    console.error("[missions] redeem failed", e);
    return { ok: false as const, status: 500, error: "Não foi possível resgatar agora." };
  }
}
