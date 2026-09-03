import { getVqPayConfig, type VqPayConfig } from "./vqpay-config";
import { VqPayApiError, vqPayErrorMessage } from "./vqpay-errors";
import { signData, signMerchantNo } from "./vqpay-sign";

const API_VERSION = "1.0";

function randomNoncestr(): string {
  const n = Math.floor(100000 + Math.random() * 9000000);
  return String(n);
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

function buildAuthHeaders(cfg: VqPayConfig): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ApiVersion: API_VERSION,
    AppId: cfg.appId,
    Noncestr: randomNoncestr(),
    Timestamp: String(Date.now()),
  };
}

async function postVqPay<T>(
  path: string,
  body: unknown,
  cfg: VqPayConfig
): Promise<T> {
  const url = `${cfg.baseUrl}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: buildAuthHeaders(cfg),
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const code = isRecord(json) ? (json.errorCode as number | undefined) ?? null : null;
    throw new VqPayApiError(
      vqPayErrorMessage(code ?? res.status),
      code,
      res.status,
      text.slice(0, 4_000)
    );
  }

  if (isRecord(json) && json.state === "fail") {
    const code = typeof json.errorCode === "number" ? json.errorCode : null;
    throw new VqPayApiError(
      typeof json.errorMsg === "string" ? json.errorMsg : vqPayErrorMessage(code),
      code,
      res.status,
      text.slice(0, 4_000)
    );
  }

  return json as T;
}

export type VqPayPayer = {
  name: string;
  document: string;
  email?: string;
  phone?: string;
};

export type CreatePixPaymentInput = {
  orderId: string;
  amount: number;
  notificationUrl: string;
  successRedirectUrl: string;
  payer: VqPayPayer;
  extend?: string;
};

export type CreatePixPaymentResult = {
  paymentId: string | null;
  redirectUrl: string | null;
  status: string | null;
  statusCode: number | null;
  statusDetail: string | null;
};

export async function createPixPayment(input: CreatePixPaymentInput): Promise<CreatePixPaymentResult> {
  const cfg = await getVqPayConfig();
  if (!cfg) throw new Error("VQPAY_NOT_CONFIGURED");

  const timestamp = Date.now();
  const dataWithoutSig: Record<string, unknown> = {
    amount: formatAmount(input.amount),
    currency: "BRL",
    country: "BR",
    payment_method_id: "PIX",
    payment_method_flow: "REDIRECT",
    order_id: input.orderId,
    notification_url: input.notificationUrl,
    success_redirect_url: input.successRedirectUrl,
    timestamp,
    payer: input.payer,
  };
  if (input.extend) dataWithoutSig.extend = input.extend;

  const signature = signData(dataWithoutSig, cfg.paymentSecret);
  const data = { ...dataWithoutSig, signature };

  const json = await postVqPay<Record<string, unknown>>("/api/pay/payment", {
    merchant_no: cfg.merchantNo,
    data,
  }, cfg);

  const inner = isRecord(json.data) ? json.data : json;
  return {
    paymentId: typeof inner.payment_id === "string" ? inner.payment_id : null,
    redirectUrl: typeof inner.redirect_url === "string" ? inner.redirect_url : null,
    status: typeof inner.status === "string" ? inner.status : null,
    statusCode: typeof inner.status_code === "number" ? inner.status_code : null,
    statusDetail: typeof inner.status_detail === "string" ? inner.status_detail : null,
  };
}

export type QueryPaymentResult = {
  orderId: string;
  paymentId: string | null;
  status: string | null;
  statusCode: number | null;
  statusDetail: string | null;
  amount: string | null;
};

export async function queryPayment(orderId: string): Promise<QueryPaymentResult | null> {
  const cfg = await getVqPayConfig();
  if (!cfg) return null;

  const json = await postVqPay<Record<string, unknown>>("/api/pay/queryPaymentOrder", {
    merchant_no: cfg.merchantNo,
    data: { order_id: orderId },
  }, cfg);

  const inner = isRecord(json.data) ? json.data : json;
  if (!isRecord(inner)) return null;

  return {
    orderId,
    paymentId: typeof inner.payment_id === "string" ? inner.payment_id : null,
    status: typeof inner.status === "string" ? inner.status : null,
    statusCode: typeof inner.status_code === "number" ? inner.status_code : null,
    statusDetail: typeof inner.status_detail === "string" ? inner.status_detail : null,
    amount: typeof inner.amount === "string" ? inner.amount : null,
  };
}

export type VqPayPayeeAccountType = "CPF" | "PHONE" | "EMAIL" | "CHAVE";

export type VqPayPayee = {
  name: string;
  account: string;
  account_type: VqPayPayeeAccountType;
  document?: string;
  phone?: string;
  email?: string;
};

export function validateVqPayPayee(payee: VqPayPayee): void {
  const t = payee.account_type;
  if (!["CPF", "PHONE", "EMAIL", "CHAVE"].includes(t)) {
    throw new Error("VQPAY_INVALID_ACCOUNT_TYPE");
  }
  if (t === "CPF" && !payee.document?.trim()) throw new Error("VQPAY_PAYEE_DOCUMENT_REQUIRED");
  if (t === "PHONE" && !payee.phone?.trim()) throw new Error("VQPAY_PAYEE_PHONE_REQUIRED");
  if (t === "EMAIL" && !payee.email?.trim()) throw new Error("VQPAY_PAYEE_EMAIL_REQUIRED");
  if (t === "CHAVE" && !payee.account?.trim()) throw new Error("VQPAY_PAYEE_ACCOUNT_REQUIRED");
}

export type CreatePixSettlementInput = {
  orderId: string;
  amount: number;
  notificationUrl: string;
  payee: VqPayPayee;
};

export async function createPixSettlement(input: CreatePixSettlementInput): Promise<{
  settlementId: string | null;
  status: string | null;
  statusCode: number | null;
  statusDetail: string | null;
}> {
  validateVqPayPayee(input.payee);
  const cfg = await getVqPayConfig();
  if (!cfg) throw new Error("VQPAY_NOT_CONFIGURED");

  const timestamp = Date.now();
  const dataWithoutSig: Record<string, unknown> = {
    amount: formatAmount(input.amount),
    currency: "BRL",
    country: "BR",
    order_id: input.orderId,
    notification_url: input.notificationUrl,
    timestamp,
    payee: input.payee,
  };
  const signature = signData(dataWithoutSig, cfg.payoutSecret);
  const data = { ...dataWithoutSig, signature };

  const json = await postVqPay<Record<string, unknown>>("/api/settle/settlement", {
    merchant_no: cfg.merchantNo,
    data,
  }, cfg);

  const inner = isRecord(json.data) ? json.data : json;
  return {
    settlementId: typeof inner.settlement_id === "string" ? inner.settlement_id : null,
    status: typeof inner.status === "string" ? inner.status : null,
    statusCode: typeof inner.status_code === "number" ? inner.status_code : null,
    statusDetail: typeof inner.status_detail === "string" ? inner.status_detail : null,
  };
}

export async function querySettlement(orderId: string): Promise<{
  orderId: string;
  settlementId: string | null;
  status: string | null;
  statusCode: number | null;
} | null> {
  const cfg = await getVqPayConfig();
  if (!cfg) return null;

  const json = await postVqPay<Record<string, unknown>>("/api/settle/querySettlementOrder", {
    merchant_no: cfg.merchantNo,
    data: { order_id: orderId },
  }, cfg);

  const inner = isRecord(json.data) ? json.data : json;
  if (!isRecord(inner)) return null;

  return {
    orderId,
    settlementId: typeof inner.settlement_id === "string" ? inner.settlement_id : null,
    status: typeof inner.status === "string" ? inner.status : null,
    statusCode: typeof inner.status_code === "number" ? inner.status_code : null,
  };
}

export async function getBalance(): Promise<{
  availableBalance: string | null;
  freezeBalance: string | null;
  totalBalance: string | null;
} | null> {
  const cfg = await getVqPayConfig();
  if (!cfg) return null;

  const signature = signMerchantNo(cfg.merchantNo, cfg.payoutSecret);
  const json = await postVqPay<Record<string, unknown>>("/api/merchant/balance", {
    merchant_no: cfg.merchantNo,
    signature,
  }, cfg);

  const inner = isRecord(json.data) ? json.data : json;
  if (!isRecord(inner)) return null;

  return {
    availableBalance: typeof inner.available_balance === "string" ? inner.available_balance : null,
    freezeBalance: typeof inner.freeze_balance === "string" ? inner.freeze_balance : null,
    totalBalance: typeof inner.total_balance === "string" ? inner.total_balance : null,
  };
}

export function isVqPayPaymentPaid(status: string | null | undefined, statusCode: number | null | undefined): boolean {
  if (status?.toUpperCase() === "SUCCESS") return true;
  return statusCode === 100;
}
