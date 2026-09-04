const BR_TIME_ZONE = "America/Sao_Paulo";
const BR_OFFSET = "-03:00";

function toDate(value: Date | string | number): Date {
  return value instanceof Date ? value : new Date(value);
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function brazilParts(date: Date): { y: number; m: number; d: number; hour: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BR_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { y: get("year"), m: get("month"), d: get("day"), hour: get("hour") };
}

export function formatDateBr(value: Date | string | number): string {
  return toDate(value).toLocaleDateString("pt-BR", {
    timeZone: BR_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTimeBr(value: Date | string | number): string {
  return toDate(value).toLocaleString("pt-BR", {
    timeZone: BR_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Data de hoje em America/Sao_Paulo no formato YYYY-MM-DD. */
export function brazilTodayYmd(now = new Date()): string {
  const { y, m, d } = brazilParts(now);
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

/** Hora atual (0–23) em America/Sao_Paulo. */
export function brazilHourNow(now = new Date()): number {
  return brazilParts(now).hour;
}

/** Soma dias a uma data YYYY-MM-DD (calendário, sem fuso). */
export function brazilYmdAdd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y || 0, (m || 1) - 1, d || 1));
  dt.setUTCDate(dt.getUTCDate() + days);
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
}

export function formatYmdBr(ymd: string): string {
  const [y, m, d] = ymd.split("-");
  if (!y || !m || !d) return ymd;
  return `${d}/${m}/${y}`;
}

/** Intervalo UTC que cobre o dia civil `ymd` em America/Sao_Paulo. */
export function brazilDayRangeUtc(ymd: string): { start: Date; end: Date } {
  const next = brazilYmdAdd(ymd, 1);
  return {
    start: new Date(`${ymd}T00:00:00${BR_OFFSET}`),
    end: new Date(`${next}T00:00:00${BR_OFFSET}`),
  };
}


