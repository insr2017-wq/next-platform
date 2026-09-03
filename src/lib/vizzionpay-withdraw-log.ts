/**
 * Logs do fluxo de saque Pix (VizzionPay transfer). Sem chaves secretas.
 */

const PREFIX = "[VizzionPay Saque]";

export function logVizzionPayWithdrawEvent(step: string, data: Record<string, unknown>): void {
  const line = { step, t: new Date().toISOString(), ...data };
  console.log(PREFIX, JSON.stringify(line));
}

export function logVizzionPayWithdrawWarn(step: string, data: Record<string, unknown>): void {
  const line = { step, t: new Date().toISOString(), ...data };
  console.warn(PREFIX, JSON.stringify(line));
}

export function logVizzionPayWithdrawError(step: string, data: Record<string, unknown>): void {
  const line = { step, t: new Date().toISOString(), ...data };
  console.error(PREFIX, JSON.stringify(line));
}

export function truncateForWithdrawLog(text: string, max = 4_000): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…(truncado, total=${text.length})`;
}
