import crypto from "node:crypto";

/** Campos aninhados que nunca entram na assinatura MD5 do VQPay. */
const NESTED_EXCLUDED_KEYS = new Set(["payer", "payee"]);

/**
 * Assina campos planos do objeto `data` (exclui payer/payee e valores vazios).
 * Mesma função serve para requests de saída e validação de webhooks/callbacks.
 */
export function signData(data: Record<string, unknown>, secretKey: string): string {
  const filtered = Object.entries(data)
    .filter(([key, value]) => !NESTED_EXCLUDED_KEYS.has(key))
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .sort(([a], [b]) => a.localeCompare(b));

  const query = filtered.map(([k, v]) => `${k}=${v}`).join("&");
  const raw = `${query}&key=${secretKey}`;
  return crypto.createHash("md5").update(raw).digest("hex").toUpperCase();
}

/** Assinatura do endpoint /api/merchant/balance — só merchant_no. */
export function signMerchantNo(merchantNo: string, secretKey: string): string {
  const raw = `merchant_no=${merchantNo}&key=${secretKey}`;
  return crypto.createHash("md5").update(raw).digest("hex").toUpperCase();
}

export function verifySignature(
  data: Record<string, unknown>,
  secretKey: string,
  receivedSignature: string
): boolean {
  const expected = signData(data, secretKey);
  const received = receivedSignature.trim().toUpperCase();
  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

/** Extrai payload plano para validação (callback de depósito/saque). */
export function webhookPayloadForSignature(payload: unknown): Record<string, unknown> | null {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) return null;
  const obj = payload as Record<string, unknown>;
  const { signature: _sig, ...rest } = obj;
  return rest;
}
