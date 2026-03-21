/** Calendário do check-in em America/Sao_Paulo (Brasil). */
export function brazilTodayYMD(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
  });
}

/** Diferença em dias entre duas datas YYYY-MM-DD (ordem: de a até b). */
export function dayDiffYMD(fromYmd: string, toYmd: string): number {
  const [ya, ma, da] = fromYmd.split("-").map(Number);
  const [yb, mb, db] = toYmd.split("-").map(Number);
  const a = Date.UTC(ya, ma - 1, da);
  const b = Date.UTC(yb, mb - 1, db);
  return Math.round((b - a) / 86400000);
}

/** Valores creditados por dia do ciclo (1–7), em BRL. */
export const CHECK_IN_AMOUNTS: readonly number[] = [
  0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 5.0,
];

export function checkInBonusBRL(slot: number): number {
  const i = Math.min(Math.max(slot, 1), 7) - 1;
  return CHECK_IN_AMOUNTS[i] ?? 0.5;
}

export function formatCheckInBonusLabel(slot: number): string {
  const n = checkInBonusBRL(slot);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: n >= 1 ? 2 : 2,
    maximumFractionDigits: 2,
  }).format(n);
}

/**
 * Próximo slot (1–7) a resgatar hoje, ou null se já resgatou hoje.
 * lastSlot: último slot concluído no último check-in (0 = nunca).
 */
export function resolveNextCheckInSlot(
  lastDate: string | null | undefined,
  lastSlot: number,
  todayYmd: string
): { alreadyToday: true } | { alreadyToday: false; nextSlot: number } {
  if (lastDate && lastDate === todayYmd) {
    return { alreadyToday: true };
  }
  if (!lastDate || lastSlot < 1) {
    return { alreadyToday: false, nextSlot: 1 };
  }
  const diff = dayDiffYMD(lastDate, todayYmd);
  if (diff === 1) {
    const next = lastSlot >= 7 ? 1 : lastSlot + 1;
    return { alreadyToday: false, nextSlot: next };
  }
  return { alreadyToday: false, nextSlot: 1 };
}

export type DayStatus = "resgatado" | "hoje" | "bloqueado";

export function buildCheckInDaysUI(
  lastDate: string | null | undefined,
  lastSlot: number,
  todayYmd: string
): { id: number; label: string; bonus: string; status: DayStatus }[] {
  const resolved = resolveNextCheckInSlot(lastDate, lastSlot, todayYmd);
  const days: { id: number; label: string; bonus: string; status: DayStatus }[] =
    [];

  for (let i = 1; i <= 7; i++) {
    const bonus = formatCheckInBonusLabel(i);
    const label = `Dia ${i}`;
    if ("alreadyToday" in resolved && resolved.alreadyToday) {
      const done = i <= lastSlot;
      days.push({
        id: i,
        label,
        bonus,
        status: done ? "resgatado" : "bloqueado",
      });
      continue;
    }
    const nextSlot = (resolved as { nextSlot: number }).nextSlot;
    if (i < nextSlot) {
      days.push({ id: i, label, bonus, status: "resgatado" });
    } else if (i === nextSlot) {
      days.push({ id: i, label, bonus, status: "hoje" });
    } else {
      days.push({ id: i, label, bonus, status: "bloqueado" });
    }
  }
  return days;
}

/** Para o texto "Sequência atual" / próximo bônus. */
export function checkInStreakSummary(
  lastDate: string | null | undefined,
  lastSlot: number,
  todayYmd: string
): { streakDays: number; nextBonus: string } {
  const resolved = resolveNextCheckInSlot(lastDate, lastSlot, todayYmd);
  if ("alreadyToday" in resolved && resolved.alreadyToday) {
    const nextTomorrow = lastSlot >= 7 ? 1 : lastSlot + 1;
    return {
      streakDays: lastSlot,
      nextBonus: formatCheckInBonusLabel(nextTomorrow),
    };
  }
  const nextSlot = (resolved as { nextSlot: number }).nextSlot;
  const diff = lastDate ? dayDiffYMD(lastDate, todayYmd) : 999;
  const streak =
    nextSlot === 1
      ? 0
      : diff === 1 && lastSlot >= 1
        ? lastSlot
        : 0;
  return {
    streakDays: streak,
    nextBonus: formatCheckInBonusLabel(nextSlot),
  };
}
