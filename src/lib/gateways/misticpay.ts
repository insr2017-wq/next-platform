import { getAppBaseUrl } from "@/lib/app-base-url";
import { GatewayApiError } from "@/lib/gateways/errors";
import { toNormalizedWebhookStatus } from "@/lib/gateways/status";
import {
  MISTICPAY_ID,
  type CheckTransactionResult,
  type CreateDepositParams,
  type CreateDepositResult,
  type CreateWithdrawParams,
  type CreateWithdrawResult,
  type NormalizedWebhookEvent,
  type PaymentGateway,
} from "@/lib/gateways/types";

const DEFAULT_BASE_URL = "https://api.misticpay.com/api";
const LOG_PREFIX = "[MisticPay]";

function misticPayBaseUrl(): string {
  return process.env.MISTICPAY_API_BASE_URL?.trim() || DEFAULT_BASE_URL;
}

export function isMisticPayConfigured(): boolean {
  const id = process.env.MISTICPAY_CLIENT_ID?.trim() ?? "";
  const secret = process.env.MISTICPAY_CLIENT_SECRET?.trim() ?? "";
  return Boolean(id && secret);
}

export function misticPayWebhookUrl(): string {
  const fromEnv = process.env.MISTICPAY_WEBHOOK_URL?.trim();
  if (fromEnv) return fromEnv;
  return `${getAppBaseUrl()}/webhooks/misticpay`;
}

function basicAuthHeader(): string {
  const id = process.env.MISTICPAY_CLIENT_ID?.trim() ?? "";
  const secret = process.env.MISTICPAY_CLIENT_SECRET?.trim() ?? "";
  return `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function pickString(obj: Record<string, unknown> | null | undefined, keys: string[]): string | null {
  if (!obj) return null;
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return null;
}

function looksLikePixEmv(value: string): boolean {
  const t = value.trim();
  return t.startsWith("000201") || /BR\.GOV\.BCB\.PIX/i.test(t);
}

/** Base64/URL de imagem; ignora copia-e-cola EMV se o gateway reutilizar o campo qrCode. */
function pickQrImagePayload(data: Record<string, unknown>): string | null {
  const preferred = pickString(data, [
    "qrCodeBase64",
    "qr_code_base64",
    "qrCodeImage",
    "qr_code_image",
  ]);
  if (preferred && !looksLikePixEmv(preferred)) return preferred;

  const maybe = pickString(data, ["qrCode", "qr_code"]);
  if (!maybe || looksLikePixEmv(maybe)) return null;
  if (maybe.startsWith("data:image") || maybe.startsWith("http://") || maybe.startsWith("https://")) {
    return maybe;
  }
  const compact = maybe.replace(/\s/g, "");
  if (/^[A-Za-z0-9+/]+=*$/.test(compact) && compact.length > 80) return maybe;
  return null;
}

function pickNumber(obj: Record<string, unknown> | null | undefined, keys: string[]): number | null {
  if (!obj) return null;
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim()) {
      const n = Number(v.replace(",", "."));
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

function dataLayer(json: unknown): Record<string, unknown> {
  if (!isRecord(json)) return {};
  if (isRecord(json.data)) return json.data;
  return json;
}

export function mapPixKeyTypeToMisticPay(
  pixKeyType: string
): "CPF" | "CNPJ" | "EMAIL" | "TELEFONE" | "CHAVE_ALEATORIA" {
  const t = pixKeyType.toLowerCase().trim();
  if (t === "cpf") return "CPF";
  if (t === "cnpj") return "CNPJ";
  if (t === "email" || t === "e-mail") return "EMAIL";
  if (t === "telefone" || t === "phone" || t === "tel") return "TELEFONE";
  if (t === "aleatoria" || t === "random" || t === "evp" || t === "chave_aleatoria") {
    return "CHAVE_ALEATORIA";
  }
  return "CPF";
}

function throwForHttpStatus(status: number, bodySnippet: string): never {
  if (status === 401) {
    throw new GatewayApiError("AUTH_FAILED", "Credencial MisticPay inválida.", status);
  }
  if (status === 403) {
    throw new GatewayApiError("FORBIDDEN", "Escopo insuficiente na chave de acesso MisticPay.", status);
  }
  if (status === 429) {
    throw new GatewayApiError("RATE_LIMITED", "Rate limit da MisticPay (consultas).", status);
  }
  throw new GatewayApiError("REQUEST_FAILED", `Erro HTTP MisticPay (${status}): ${bodySnippet}`, status);
}

async function misticRequest(
  method: "GET" | "POST",
  path: string,
  body?: Record<string, unknown>
): Promise<{ json: unknown; status: number }> {
  if (!isMisticPayConfigured()) {
    throw new GatewayApiError("NOT_CONFIGURED", "MisticPay não configurada.");
  }

  const url = `${misticPayBaseUrl()}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: basicAuthHeader(),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(LOG_PREFIX, "fetch_failed", { path, message });
    throw new GatewayApiError("REQUEST_FAILED", `Falha de rede MisticPay: ${message}`);
  }

  const text = await res.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  if (!res.ok) {
    console.error(LOG_PREFIX, "http_error", {
      path,
      httpStatus: res.status,
      bodyPreview: text.slice(0, 2_000),
    });
    throwForHttpStatus(res.status, text.slice(0, 400));
  }

  return { json: json ?? {}, status: res.status };
}

function unwrapWebhookPayload(raw: unknown): Record<string, unknown> | null {
  let v = raw;
  if (typeof v === "string" && v.trim()) {
    try {
      v = JSON.parse(v) as unknown;
    } catch {
      return null;
    }
  }
  if (Array.isArray(v) && v.length > 0) return unwrapWebhookPayload(v[0]);
  if (!isRecord(v)) return null;
  if (typeof v.body === "string" && v.body.trim()) {
    try {
      const inner = JSON.parse(v.body) as unknown;
      if (isRecord(inner)) return inner;
    } catch {
      // ignore
    }
  }
  if (isRecord(v.data) && (v.data.transactionId != null || v.data.transactionType != null)) {
    return v.data;
  }
  return v;
}

class MisticPayGateway implements PaymentGateway {
  readonly id = MISTICPAY_ID;

  async createDeposit(params: CreateDepositParams): Promise<CreateDepositResult> {
    const webhookUrl = params.webhookUrl?.trim() || misticPayWebhookUrl();
    const { json } = await misticRequest("POST", "/transactions/create", {
      amount: params.amount,
      payerName: params.payerName,
      payerDocument: params.payerDocument,
      transactionId: params.transactionId,
      description: params.description || "Pagamento",
      projectWebhook: webhookUrl,
    });

    const data = dataLayer(json);
    const gatewayTransactionId = pickString(data, ["transactionId", "transaction_id"]);
    const pixCode = pickString(data, ["copyPaste", "copy_paste", "pixCode", "pix_code"]);
    if (!gatewayTransactionId || !pixCode) {
      throw new GatewayApiError("RESPONSE_INVALID", "Resposta de depósito MisticPay sem transactionId/copyPaste.");
    }

    return {
      gatewayTransactionId,
      status: pickString(data, ["transactionState", "status"]) ?? "PENDENTE",
      pixCode,
      qrCodeImage: pickQrImagePayload(data),
    };
  }

  async createWithdraw(params: CreateWithdrawParams): Promise<CreateWithdrawResult> {
    const webhookUrl = params.webhookUrl?.trim() || misticPayWebhookUrl();
    const { json } = await misticRequest("POST", "/transactions/withdraw", {
      amount: params.amount,
      pixKey: params.pixKey,
      pixKeyType: mapPixKeyTypeToMisticPay(params.pixKeyType),
      description: params.description || "Saque",
      projectWebhook: webhookUrl,
    });

    const data = dataLayer(json);
    const gatewayTransactionId = pickString(data, ["transactionId", "transaction_id"]);
    if (!gatewayTransactionId) {
      throw new GatewayApiError("RESPONSE_INVALID", "Resposta de saque MisticPay sem transactionId.");
    }

    return {
      gatewayTransactionId,
      status: pickString(data, ["status", "transactionState"]) ?? "QUEUED",
      jobId: pickString(data, ["jobId", "job_id"]),
    };
  }

  async checkTransaction(gatewayTransactionId: string): Promise<CheckTransactionResult> {
    const { json } = await misticRequest("POST", "/transactions/check", {
      transactionId: gatewayTransactionId,
    });
    const data = dataLayer(json);
    return {
      gatewayTransactionId:
        pickString(data, ["transactionId", "transaction_id"]) ?? gatewayTransactionId,
      status: pickString(data, ["transactionState", "status"]) ?? "PENDENTE",
      raw: json,
    };
  }

  async getBalance(): Promise<number> {
    const { json } = await misticRequest("GET", "/users/balance");
    const data = dataLayer(json);
    const balance = pickNumber(data, ["balance"]);
    if (balance == null) {
      throw new GatewayApiError("RESPONSE_INVALID", "Resposta de saldo MisticPay inválida.");
    }
    return balance;
  }

  parseWebhook(payload: unknown): NormalizedWebhookEvent | null {
    const root = unwrapWebhookPayload(payload);
    if (!root) return null;

    const gatewayTransactionId = pickString(root, ["transactionId", "transaction_id"]);
    if (!gatewayTransactionId) return null;

    const typeRaw = (pickString(root, ["transactionType", "transaction_type"]) ?? "").toUpperCase();
    const type: "deposit" | "withdraw" = typeRaw === "RETIRADA" ? "withdraw" : "deposit";
    const statusRaw = pickString(root, ["status", "transactionState"]) ?? "PENDENTE";

    return {
      gatewayTransactionId,
      type,
      status: toNormalizedWebhookStatus(statusRaw),
      amount: pickNumber(root, ["value", "amount"]),
      fee: pickNumber(root, ["fee"]),
      e2e: pickString(root, ["e2e"]),
      gateway: MISTICPAY_ID,
    };
  }
}

export const misticPayGateway = new MisticPayGateway();
