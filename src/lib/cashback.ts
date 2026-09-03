export type CashbackConfig = {
  cashbackPercent: number;
  cashbackBandAmount: number;
  cashbackMinInvest: number;
};

export function roundMoney(n: number): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}

/** Cashback sobre o valor da compra, se o investimento atingir o mínimo. */
export function computeCashback(invested: number, settings: CashbackConfig): number {
  const amount = Number(invested);
  const percent = Number(settings.cashbackPercent);
  const min = Number(settings.cashbackMinInvest);
  if (!Number.isFinite(amount) || amount < min || !(percent > 0)) return 0;
  return roundMoney((amount * percent) / 100);
}

export function cashbackExamples(settings: CashbackConfig, count = 4): Array<{ invest: number; cashback: number }> {
  const min = Math.max(0, Number(settings.cashbackMinInvest) || 0);
  const band = Number(settings.cashbackBandAmount) > 0 ? Number(settings.cashbackBandAmount) : 200;
  return Array.from({ length: Math.max(1, count) }, (_, i) => {
    const invest = roundMoney(min + i * band);
    return { invest, cashback: computeCashback(invest, settings) };
  });
}
