import { roundMoney } from "@/lib/money";

export function computeProductYield(price: number, returnPercent: number, cycleDays: number) {
  const value = Math.max(0, Number(price) || 0);
  const percent = Math.max(0, Number(returnPercent) || 0);
  const days = Math.max(1, Math.trunc(Number(cycleDays) || 1));
  const totalReturn = roundMoney(value * (percent / 100));
  const dailyYield = roundMoney(totalReturn / days);
  return { totalReturn, dailyYield, cycleDays: days, returnPercent: percent };
}

export function inferReturnPercent(price: number, totalReturn: number): number {
  if (!(price > 0)) return 0;
  return roundMoney((totalReturn / price) * 100);
}
