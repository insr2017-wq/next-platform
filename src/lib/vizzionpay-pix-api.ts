import { getVizzionPayConfig, getVizzionPayReceiveUrl } from "@/lib/vizzionpay-config";

export type VizzionPayPixClient = {
  name: string;
  email: string;
  phone: string;
  document: string;
};

export type VizzionPayPixProduct = {
  name: string;
  description?: string;
  quantity: number;
  price: number;
};

export type VizzionPayPixReceiveRequest = {
  identifier: string;
  amount: number;
  client: VizzionPayPixClient;
  products: VizzionPayPixProduct[];
  metadata: Record<string, string | number | boolean | null>;
  callbackUrl: string;
};

export type VizzionPayPixReceiveParsed = {
  transactionId: string | null;
  orderId: string | null;
  status: string | null;
  pixCode: string;
  /** Valor bruto para persistir em `Deposit.qrCodeImage` (URL ou base64). */
  qrCodeImageRaw: string | null;
  pixBase64: string | null;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function pickString(obj: Record<string, unknown> | null | undefined, keys: string[]): string | null {
  if (!obj) return null;
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

/**
 * Extrai dados do Pix da resposta da VizzionPay (flexível a variações de envelope).
 */
export function parseVizzionPayPixReceiveResponse(json: unknown): VizzionPayPixReceiveParsed | null {
  const root = isRecord(json) ? json : null;
  if (!root) return null;

  if (root.success === false) return null;

  const data = isRecord(root.data) ? root.data : root;
  if (isRecord(data) && data.success === false) return null;
  const pix =
    (isRecord(data.pix) ? data.pix : null) ??
    (isRecord(root.pix) ? root.pix : null) ??
    (isRecord(data.payment) && isRecord(data.payment.pix) ? data.payment.pix : null);

  const pixCode =
    pickString(pix, ["code", "copyPaste", "copy_paste", "emv", "payload"]) ??
    pickString(data, ["pixCode", "pix_code", "copyPaste", "emv"]) ??
    pickString(root, ["pixCode", "pix_code"]);

  if (!pixCode) return null;

  const imageRaw =
    pickString(pix, ["image", "qrCode", "qrcode", "qr_code", "imageUrl", "image_url"]) ?? null;
  const pixBase64 =
    pickString(pix, ["base64", "imageBase64", "image_base64", "qrCodeBase64"]) ?? null;

  const transactionId =
    pickString(data, ["transactionId", "transaction_id", "id"]) ??
    pickString(root, ["transactionId", "transaction_id"]) ??
    null;

  const orderId =
    (isRecord(data.order) ? pickString(data.order, ["id"]) : null) ??
    pickString(data, ["orderId", "order_id"]) ??
    (isRecord(root.order) ? pickString(root.order, ["id"]) : null) ??
    null;

  const status =
    pickString(data, ["status"]) ?? pickString(root, ["status"]) ?? pickString(pix, ["status"]);

  const qrCodeImageRaw = imageRaw ?? pixBase64 ?? null;

  return {
    transactionId,
    orderId,
    status,
    pixCode,
    qrCodeImageRaw,
    pixBase64: pixBase64 ?? null,
  };
}

export class VizzionPayPixApiError extends Error {
  readonly statusCode: number;
  readonly bodySnippet: string;

  constructor(message: string, statusCode: number, bodySnippet: string) {
    super(message);
    this.name = "VizzionPayPixApiError";
    this.statusCode = statusCode;
    this.bodySnippet = bodySnippet;
  }
}

export async function postVizzionPayPixReceive(
  body: VizzionPayPixReceiveRequest
): Promise<{ ok: true; json: unknown } | { ok: false; status: number; text: string }> {
  const cfg = getVizzionPayConfig();
  if (!cfg) {
    throw new Error("VIZZIONPAY_NOT_CONFIGURED");
  }

  const url = getVizzionPayReceiveUrl();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-public-key": cfg.publicKey,
      "x-secret-key": cfg.secretKey,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await res.text();
  if (!res.ok) {
    return { ok: false, status: res.status, text: text.slice(0, 8_000) };
  }

  let json: unknown;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    return { ok: false, status: res.status, text: text.slice(0, 8_000) || "Resposta inválida." };
  }

  return { ok: true, json };
}
