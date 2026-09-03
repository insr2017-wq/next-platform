/**
 * Gera valor aleatório de bônus entre min e max (inclusive), com 2 casas decimais.
 * Usar no fluxo de resgate do usuário (não armazenar antecipadamente).
 */
export function randomBonusAmount(min: number, max: number): number {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  const raw = lo + Math.random() * (hi - lo);
  return Math.round(raw * 100) / 100;
}
