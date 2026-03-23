import { getVizzionPayConfig, getVizzionPayTransfersUrl } from "@/lib/vizzionpay-config";
import { logVizzionPayWithdrawError, logVizzionPayWithdrawEvent, truncateForWithdrawLog } from "@/lib/vizzionpay-withdraw-log";

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

export type VizzionPayTransferDocument = {
  type: "cpf" | "cnpj";
  number: string;
};

export type VizzionPayTransferOwner = {
  ip: string;
  name: string;
  document: VizzionPayTransferDocument;
};

export type VizzionPayTransferPix = {
  type: string;
  key: string;
};

export type VizzionPayTransferRequestBody = {
  identifier: string;
  amount: number;
  discountFeeOfReceiver: boolean;
  pix: VizzionPayTransferPix;
  owner: VizzionPayTransferOwner;
  callbackUrl: string;
};

export type VizzionPayTransferParsed = {
  withdrawId: string | null;
  status: string | null;
  receiptUrl: string | null;
  webhookToken: string | null;
  rejectedReason: string | null;
  raw: unknown;
};

function extractWithdrawObject(json: unknown): Record<string, unknown> | null {
  if (!isRecord(json)) return null;
  if (isRecord(json.data)) {
    const d = json.data;
    if (isRecord(d.withdraw)) return d.withdraw;
    if (isRecord(d.transfer)) return d.transfer;
    return d;
  }
  if (isRecord(json.withdraw)) return json.withdraw;
  if (isRecord(json.transfer)) return json.transfer;
  return json;
}

export function parseVizzionPayTransferResponse(json: unknown): VizzionPayTransferParsed {
  const root = isRecord(json) ? json : null;
  const w = extractWithdrawObject(json);
  const node = w ?? root;

  const withdrawId =
    pickString(node ?? {}, ["id", "withdrawId", "withdraw_id"]) ??
    pickString(isRecord(node) && isRecord(node.data) ? node.data : {}, ["id"]);

  const status = pickString(node ?? {}, ["status", "state"]) ?? pickString(root ?? {}, ["status"]);

  const receiptUrl =
    pickString(node ?? {}, ["receiptUrl", "receipt_url", "url"]) ??
    (isRecord(node) && isRecord(node.receipt) ? pickString(node.receipt as Record<string, unknown>, ["url"]) : null);

  const webhookToken = pickString(node ?? {}, ["webhookToken", "webhook_token"]);

  const rejectedReason =
    pickString(node ?? {}, ["rejectedReason", "rejected_reason", "reason", "message", "error"]) ??
    pickString(root ?? {}, ["message", "error"]);

  return {
    withdrawId,
    status,
    receiptUrl,
    webhookToken,
    rejectedReason,
    raw: json,
  };
}

export class VizzionPayTransferApiError extends Error {
  readonly statusCode: number;
  readonly bodySnippet: string;

  constructor(message: string, statusCode: number, bodySnippet: string) {
    super(message);
    this.name = "VizzionPayTransferApiError";
    this.statusCode = statusCode;
    this.bodySnippet = bodySnippet;
  }
}

export async function postVizzionPayTransfer(body: VizzionPayTransferRequestBody): Promise<{
  ok: boolean;
  status: number;
  json: unknown | null;
  text: string;
}> {
  const cfg = getVizzionPayConfig();
  if (!cfg) {
    throw new Error("VIZZIONPAY_NOT_CONFIGURED");
  }

  const url = getVizzionPayTransfersUrl();
  logVizzionPayWithdrawEvent("transfer_http_request", {
    url,
    identifier: body.identifier,
    amount: body.amount,
    pixType: body.pix.type,
    ownerIp: body.owner.ip,
    ownerNameLen: body.owner.name.length,
    documentType: body.owner.document.type,
  });

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-public-key": cfg.publicKey,
        "x-secret-key": cfg.secretKey,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logVizzionPayWithdrawError("transfer_fetch_failed", { message });
    throw new VizzionPayTransferApiError(`FETCH_FAILED: ${message}`, 0, message);
  }

  const text = await res.text();
  logVizzionPayWithdrawEvent("transfer_http_response", {
    url,
    identifier: body.identifier,
    httpStatus: res.status,
    bodyLength: text.length,
    bodyPreview: truncateForWithdrawLog(text, 6_000),
  });

  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  return { ok: res.ok, status: res.status, json, text };
}
