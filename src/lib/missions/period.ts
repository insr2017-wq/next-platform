import { brazilTodayYMD, dayDiffYMD } from "@/lib/check-in";

/** Sentinela para missões que não resetam (permanente / meta). UNIQUE no Postgres não agrupa NULL. */
export const PERMANENT_PERIOD_START = new Date("1970-01-01T00:00:00.000Z");

function mondayYmd(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  const dow = utc.getUTCDay();
  const offset = dow === 0 ? 6 : dow - 1;
  utc.setUTCDate(utc.getUTCDate() - offset);
  return utc.toISOString().slice(0, 10);
}

export function ymdToUtcDate(ymd: string): Date {
  return new Date(`${ymd}T00:00:00.000Z`);
}

/** Segunda-feira 00:00 UTC da semana corrente no calendário America/Sao_Paulo. */
export function getMondayPeriodStart(now = new Date()): Date {
  const ymd = now.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  return ymdToUtcDate(mondayYmd(ymd));
}

export function getPeriodStart(resets: boolean, now = new Date()): Date {
  return resets ? getMondayPeriodStart(now) : PERMANENT_PERIOD_START;
}

export { brazilTodayYMD, dayDiffYMD };
