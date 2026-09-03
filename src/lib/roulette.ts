import { randomInt } from "crypto";
import { prisma } from "@/lib/db";
import { brazilTodayYMD } from "@/lib/missions/period";
import { bumpRouletteMissionStreak } from "@/lib/missions/evaluate";

export const DEFAULT_ROULETTE_PRIZES = [
  { label: "R$ 0,01", value: 0.01, kind: "balance", probability: 40, sortOrder: 0 },
  { label: "R$ 0,50", value: 0.5, kind: "balance", probability: 25, sortOrder: 1 },
  { label: "R$ 1,00", value: 1, kind: "balance", probability: 15, sortOrder: 2 },
  { label: "R$ 5,00", value: 5, kind: "balance", probability: 10, sortOrder: 3 },
  { label: "R$ 20,00", value: 20, kind: "balance", probability: 5, sortOrder: 4 },
  { label: "R$ 50,00", value: 50, kind: "balance", probability: 3, sortOrder: 5 },
  { label: "R$ 100,00", value: 100, kind: "balance", probability: 2, sortOrder: 6 },
  { label: "R$ 200,00", value: 200, kind: "balance", probability: 1, sortOrder: 7 },
] as const;

export async function ensureDefaultRoulettePrizes() {
  const count = await prisma.roulettePrize.count();
  if (count > 0) return;
  await prisma.roulettePrize.createMany({
    data: DEFAULT_ROULETTE_PRIZES.map((p) => ({ ...p })),
  });
}

export function pickWeightedPrize<T extends { probability: number }>(prizes: T[]): T | null {
  const eligible = prizes.filter((p) => p.probability > 0);
  if (eligible.length === 0) return null;
  const total = eligible.reduce((sum, p) => sum + p.probability, 0);
  let cursor = randomInt(0, total);
  for (const prize of eligible) {
    cursor -= prize.probability;
    if (cursor < 0) return prize;
  }
  return eligible[eligible.length - 1] ?? null;
}

export async function spinDailyRoulette(userId: string) {
  await ensureDefaultRoulettePrizes();
  const prizes = await prisma.roulettePrize.findMany({
    where: { active: true, probability: { gt: 0 } },
    orderBy: { sortOrder: "asc" },
  });
  const prize = pickWeightedPrize(prizes);
  if (!prize) {
    return { ok: false as const, status: 503, error: "Nenhum prêmio ativo na roleta." };
  }

  const today = brazilTodayYMD();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { lastMissionRouletteDate: true, extraRouletteSpins: true },
      });
      if (!user) throw new Error("NO_USER");

      const alreadyToday = user.lastMissionRouletteDate === today;
      if (alreadyToday && user.extraRouletteSpins <= 0) {
        throw new Error("ALREADY_SPUN");
      }

      const usedExtra = alreadyToday;
      const prevDate = user.lastMissionRouletteDate;
      let extraRemaining = user.extraRouletteSpins;

      if (usedExtra) {
        const updated = await tx.user.update({
          where: { id: userId },
          data: { extraRouletteSpins: { decrement: 1 } },
          select: { extraRouletteSpins: true },
        });
        extraRemaining = updated.extraRouletteSpins;
      } else {
        await tx.user.update({
          where: { id: userId },
          data: { lastMissionRouletteDate: today },
        });
      }

      if (prize.kind === "extra_spin") {
        const spins = Math.max(1, Math.round(prize.value));
        const updated = await tx.user.update({
          where: { id: userId },
          data: { extraRouletteSpins: { increment: spins } },
          select: { extraRouletteSpins: true },
        });
        extraRemaining = updated.extraRouletteSpins;
      } else if (prize.value > 0) {
        await tx.user.update({
          where: { id: userId },
          data: { balance: { increment: prize.value } },
        });
      }

      await tx.rouletteSpinLog.create({
        data: {
          userId,
          prizeId: prize.id,
          label: prize.label,
          value: prize.value,
          kind: prize.kind,
        },
      });

      return { prize, usedExtra, extraRemaining, prevDate };
    });

    if (!result.usedExtra) {
      await bumpRouletteMissionStreak(userId, result.prevDate);
    }

    return {
      ok: true as const,
      prize: {
        id: result.prize.id,
        label: result.prize.label,
        value: result.prize.value,
        kind: result.prize.kind,
      },
      extraRemaining: result.extraRemaining,
      usedExtra: result.usedExtra,
      alreadySpun: !result.usedExtra && result.extraRemaining <= 0,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "ALREADY_SPUN") {
      return {
        ok: false as const,
        status: 409,
        error: "Você já girou a roleta hoje.",
        extraRemaining: 0,
        alreadySpun: true,
      };
    }
    if (msg === "NO_USER") {
      return { ok: false as const, status: 403, error: "Conta inválida." };
    }
    throw e;
  }
}
