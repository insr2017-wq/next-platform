import { brazilHourNow, brazilTodayYmd, brazilDayRangeUtc } from "@/lib/datetime-br";
import type { PlatformSettingsData } from "@/lib/platform-settings";
import { prisma } from "@/lib/db";

export function isWithdrawHourBlocked(
  settings: Pick<
    PlatformSettingsData,
    "withdrawBlockEnabled" | "withdrawBlockStartHour" | "withdrawBlockEndHour"
  >,
  now = new Date()
): boolean {
  if (!settings.withdrawBlockEnabled) return false;
  const start = clampHour(settings.withdrawBlockStartHour);
  const end = clampHour(settings.withdrawBlockEndHour);
  if (start === end) return false;
  const hour = brazilHourNow(now);
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end;
}

function clampHour(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(23, Math.max(0, Math.trunc(n)));
}

export function formatWithdrawBlockWindow(startHour: number, endHour: number): string {
  const pad = (h: number) => `${clampHour(h).toString().padStart(2, "0")}:00`;
  return `${pad(startHour)} às ${pad(endHour)}`;
}

export async function assertWithdrawAllowed(
  userId: string,
  settings: PlatformSettingsData
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isWithdrawHourBlocked(settings)) {
    return {
      ok: false,
      error: `Saques estão bloqueados das ${formatWithdrawBlockWindow(
        settings.withdrawBlockStartHour,
        settings.withdrawBlockEndHour
      )} (horário de Brasília). Tente novamente fora desta janela.`,
    };
  }

  const today = brazilTodayYmd();
  const { start, end } = brazilDayRangeUtc(today);

  const perUser = Math.max(0, Math.trunc(settings.withdrawDailyLimitPerUser || 0));
  const platform = Math.max(0, Math.trunc(settings.withdrawDailyLimitPlatform || 0));

  if (perUser > 0) {
    const userCount = await prisma.withdrawal.count({
      where: { userId, createdAt: { gte: start, lt: end } },
    });
    if (userCount >= perUser) {
      return {
        ok: false,
        error: `Limite diário de saques atingido (${perUser} por dia). Tente novamente amanhã.`,
      };
    }
  }

  if (platform > 0) {
    const total = await prisma.withdrawal.count({
      where: { createdAt: { gte: start, lt: end } },
    });
    if (total >= platform) {
      return {
        ok: false,
        error: "O limite diário de saques da plataforma foi atingido. Tente novamente amanhã.",
      };
    }
  }

  return { ok: true };
}
