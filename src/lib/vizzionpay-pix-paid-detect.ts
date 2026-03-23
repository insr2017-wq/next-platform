/** Detecção de “pagamento confirmado” em JSON da VizzionPay (webhook ou consulta). */

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function pickString(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function deepPaidStatus(obj: unknown, depth = 0): boolean {
  if (depth > 8 || !isRecord(obj)) return false;
  for (const [k, v] of Object.entries(obj)) {
    if (
      (k === "status" || k === "paymentStatus" || k === "payment_status") &&
      typeof v === "string" &&
      /paid|pago|approved|completed|confirmed|aprovado|success|paid_out/i.test(v)
    ) {
      return true;
    }
    if (k === "paid" && v === true) return true;
    if (typeof v === "object" && v !== null && deepPaidStatus(v, depth + 1)) return true;
  }
  return false;
}

export function detectVizzionPayPixPaidPayload(json: unknown): boolean {
  if (!isRecord(json)) return false;
  if (json.paid === true) return true;
  if (json.success === true && deepPaidStatus(json)) return true;
  const status =
    pickString(json, ["status", "paymentStatus", "payment_status", "state", "event"]) ??
    (isRecord(json.data) ? pickString(json.data, ["status", "paymentStatus", "payment_status", "state"]) : null);
  if (status && /paid|pago|approved|completed|confirmed|aprovado|success/i.test(status)) return true;
  if (isRecord(json.data) && json.data.paid === true) return true;
  if (deepPaidStatus(json)) return true;
  return false;
}
