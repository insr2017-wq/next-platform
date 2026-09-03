/**
 * Valor aleatório em BRL entre min e max (inclusive), em centavos para evitar erros de float.
 */
export function randomBonusRewardAmount(min: number, max: number): number {
  const minC = Math.round(min * 100);
  const maxC = Math.round(max * 100);
  const lo = Math.min(minC, maxC);
  const hi = Math.max(minC, maxC);
  const span = hi - lo + 1;
  const cents = lo + Math.floor(Math.random() * span);
  return cents / 100;
}
