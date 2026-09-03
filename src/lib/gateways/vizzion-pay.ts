import { getAppBaseUrl } from "@/lib/app-base-url";
import {
  getVizzionPayConfig,
  getVizzionPayDepositProductId,
  getVizzionPayDepositProductUnitPrice,
  shouldOmitVizzionPayDepositProductPrice,
} from "@/lib/vizzionpay-config";
import {
  explainVizzionPayParseFailure,
  parseVizzionPayPixReceiveResponse,
  postVizzionPayPixReceive,
  VizzionPayPixApiError,
  type VizzionPayPixReceiveRequest,
} from "@/lib/vizzionpay-pix-api";
import {
  buildClientLogSnapshot,
  logVizzionPayPixError,
  logVizzionPayPixEvent,
  truncateForLog,
} from "@/lib/vizzionpay-pix-log";
import { detectVizzionPayPixPaidPayload } from "@/lib/vizzionpay-pix-paid-detect";
import { fetchVizzionPayPixStatusByDeposit } from "@/lib/vizzionpay-pix-query";
import { parseVizzionPayTransferResponse } from "@/lib/vizzionpay-transfer-api";
import {
  executeVizzionPayWithdrawalTransfer,
  mapVizzionPayWithdrawStatusToInternal,
  VizzionPayTransferApiError,
} from "@/lib/vizzionpay-withdraw-transfer";
import { GatewayApiError } from "@/lib/gateways/errors";
import {
  VIZZION_PAY_ID,
  type CheckTransactionResult,
  type CreateDepositParams,
  type CreateDepositResult,
  type CreateWithdrawParams,
  type CreateWithdrawResult,
  type NormalizedWebhookEvent,
  type PaymentGateway,
} from "@/lib/gateways/types";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function pickString(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return null;
}

type DepositProductLineMode = "omit_price" | "unit_from_env" | "single_qty_price_equals_amount";

function buildPixDepositProductLine(
  catalogProductId: string,
  amount: number,
  unitPriceFromEnv: number | null,
  omitPrice: boolean
): {
  line: { id: string; name: string; description: string; quantity: number; price?: number };
  mode: DepositProductLineMode;
} {
  const name = "Recarga de saldo";
  const description = "Recarga via Pix na plataforma";

  if (omitPrice) {
    return {
      line: { id: catalogProductId, name, description, quantity: 1 },
      mode: "omit_price",
    };
  }

  if (unitPriceFromEnv != null && unitPriceFromEnv > 0) {
    const unit = round2(unitPriceFromEnv);
    const rawQty = amount / unit;
    const qty = Math.round(rawQty);
    if (qty < 1 || !Number.isFinite(qty)) {
      throw new Error("DEPOSIT_AMOUNT_INCOMPATIBLE_WITH_PRODUCT_UNIT");
    }
    const total = round2(unit * qty);
    if (Math.abs(total - amount) > 0.01) {
      throw new Error("DEPOSIT_AMOUNT_INCOMPATIBLE_WITH_PRODUCT_UNIT");
    }
    return {
      line: { id: catalogProductId, name, description, quantity: qty, price: unit },
      mode: "unit_from_env",
    };
  }

  return {
    line: {
      id: catalogProductId,
      name,
      description,
      quantity: 1,
      price: amount,
    },
    mode: "single_qty_price_equals_amount",
  };
}

function extractEmailHost(email: string): string {
  const i = email.lastIndexOf("@");
  return i >= 0 ? email.slice(i + 1) : "(sem @)";
}

function buildFallbackEmail(transactionId: string): string {
  return `pix+${transactionId}@deposito.plataforma`;
}

function defaultDepositWebhookUrl(): string {
  return `${getAppBaseUrl()}/api/webhooks/vizzionpay/pix`;
}

function defaultWithdrawWebhookUrl(): string {
  return `${getAppBaseUrl()}/api/webhooks/vizzionpay/withdraw`;
}

function pickAmount(obj: Record<string, unknown>): number | null {
  for (const k of ["amount", "value", "fee"]) {
    const v = obj[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return null;
}

class VizzionPayGateway implements PaymentGateway {
  readonly id = VIZZION_PAY_ID;

  async createDeposit(params: CreateDepositParams): Promise<CreateDepositResult> {
    if (!(await getVizzionPayConfig())) {
      throw new GatewayApiError("NOT_CONFIGURED", "VizzionPay não configurada.");
    }
    const catalogProductId = getVizzionPayDepositProductId();
    if (!catalogProductId) {
      logVizzionPayPixError("vizzionpay_deposit_product_id_env_missing", {
        hint: "Defina VIZZIONPAY_DEPOSIT_PRODUCT_ID nas variáveis de ambiente (ex.: Vercel) com o ID do produto de recarga criado e ativo no painel VizzionPay.",
      });
      throw new Error("VIZZIONPAY_DEPOSIT_PRODUCT_NOT_CONFIGURED");
    }

    const amount = round2(Number(params.amount));
    const omitProductPrice = shouldOmitVizzionPayDepositProductPrice();
    const catalogUnitPrice = getVizzionPayDepositProductUnitPrice();
    const { line: productLine, mode: depositProductLineMode } = buildPixDepositProductLine(
      catalogProductId,
      amount,
      catalogUnitPrice,
      omitProductPrice
    );

    const identifier = params.transactionId;
    const callbackUrl = params.webhookUrl?.trim() || defaultDepositWebhookUrl();
    const clientEmail = params.payerEmail?.trim() || buildFallbackEmail(identifier);
    const clientPhone = params.payerPhone?.trim() || "";

    const payload: VizzionPayPixReceiveRequest = {
      identifier,
      amount,
      client: {
        name: params.payerName,
        email: clientEmail,
        phone: clientPhone,
        document: params.payerDocument,
      },
      products: [productLine],
      metadata: {
        depositId: identifier,
      },
      callbackUrl,
    };

    logVizzionPayPixEvent("vizzionpay_request_payload", {
      identifier,
      amount,
      depositProductLineMode,
      callbackUrl,
      client: buildClientLogSnapshot({
        name: payload.client.name,
        email: payload.client.email,
        phone: payload.client.phone,
        document: payload.client.document,
        syntheticEmail: !params.payerEmail,
        emailHost: extractEmailHost(clientEmail),
        documentSource: "cpf11",
        phoneDigitsLength: clientPhone.replace(/\D/g, "").length,
      }),
      metadata: payload.metadata,
      products: payload.products.map((p) => ({
        id: p.id,
        name: p.name,
        quantity: p.quantity,
        price: p.price,
        hasDescription: Boolean(p.description),
      })),
    });

    try {
      const result = await postVizzionPayPixReceive(payload);

      if (!result.ok) {
        const status = result.status;
        const isAuth = status === 401 || status === 403;
        logVizzionPayPixError("vizzionpay_http_error", {
          identifier,
          httpStatus: status,
          responseBody: truncateForLog(result.text, 8_000),
          classifiedAs: isAuth ? "auth" : "other",
        });
        throw new GatewayApiError(
          isAuth ? "AUTH_FAILED" : "REQUEST_FAILED",
          "Falha ao criar depósito na VizzionPay.",
          status
        );
      }

      const parsed = parseVizzionPayPixReceiveResponse(result.json);
      if (!parsed) {
        const reason = explainVizzionPayParseFailure(result.json);
        logVizzionPayPixError("vizzionpay_parse_failed", {
          identifier,
          parseReason: reason,
          rawJsonPreview: truncateForLog(JSON.stringify(result.json), 8_000),
        });
        throw new GatewayApiError("RESPONSE_INVALID", "Resposta inválida da VizzionPay.");
      }

      logVizzionPayPixEvent("vizzionpay_parse_ok", {
        identifier,
        transactionId: parsed.transactionId,
        orderId: parsed.orderId,
        gatewayStatus: parsed.status,
        pixCodeLength: parsed.pixCode.length,
        hasQrImage: Boolean(parsed.qrCodeImageRaw ?? parsed.pixBase64),
      });

      const gatewayRef = parsed.transactionId ?? parsed.orderId ?? identifier;
      return {
        gatewayTransactionId: gatewayRef,
        status: parsed.status ?? "pending",
        pixCode: parsed.pixCode,
        qrCodeImage: parsed.qrCodeImageRaw ?? parsed.pixBase64 ?? null,
        orderId: parsed.orderId,
      };
    } catch (e) {
      if (e instanceof GatewayApiError) throw e;
      if (e instanceof VizzionPayPixApiError) {
        logVizzionPayPixError("vizzionpay_fetch_network_error", {
          identifier,
          statusCode: e.statusCode,
          errorMessage: e.message,
          bodySnippet: truncateForLog(e.bodySnippet, 2_000),
        });
        throw new GatewayApiError("REQUEST_FAILED", "Falha de rede na VizzionPay.");
      }
      throw e;
    }
  }

  async createWithdraw(params: CreateWithdrawParams): Promise<CreateWithdrawResult> {
    if (!(await getVizzionPayConfig())) {
      throw new GatewayApiError("NOT_CONFIGURED", "VizzionPay não configurada.");
    }
    const internalId = params.internalId?.trim() || params.description || "withdraw";
    try {
      const outcome = await executeVizzionPayWithdrawalTransfer({
        id: internalId,
        netAmount: params.amount,
        pixKeyType: params.pixKeyType,
        pixKey: params.pixKey,
        holderName: params.holderName?.trim() || "CLIENTE",
        holderCpf: params.holderDocument?.trim() || "",
        requesterIp: params.requesterIp ?? null,
      });

      if (outcome.kind === "failed") {
        return {
          gatewayTransactionId: internalId,
          status: outcome.gatewayStatus || "FAILED",
          rejectedReason: outcome.rejectedReason,
        };
      }

      return {
        gatewayTransactionId: outcome.gatewayTransactionId,
        status: outcome.gatewayStatus || (outcome.kind === "processed" ? "COMPLETED" : "PROCESSING"),
      };
    } catch (e) {
      if (e instanceof VizzionPayTransferApiError) {
        throw new GatewayApiError("REQUEST_FAILED", e.message, e.statusCode);
      }
      throw e;
    }
  }

  async checkTransaction(gatewayTransactionId: string): Promise<CheckTransactionResult> {
    const queried = await fetchVizzionPayPixStatusByDeposit({
      depositId: gatewayTransactionId,
      gatewayTransactionId,
    });
    if (!queried) {
      throw new GatewayApiError("REQUEST_FAILED", "Não foi possível consultar a transação na VizzionPay.");
    }
    const status = detectVizzionPayPixPaidPayload(queried.json)
      ? "COMPLETO"
      : pickString(isRecord(queried.json) ? queried.json : {}, ["status", "state"]) || "PENDENTE";
    return {
      gatewayTransactionId,
      status,
      raw: queried.json,
    };
  }

  async getBalance(): Promise<number> {
    throw new GatewayApiError(
      "NOT_CONFIGURED",
      "Consulta de saldo da VizzionPay não está disponível nesta integração."
    );
  }

  parseWebhook(payload: unknown): NormalizedWebhookEvent | null {
    const root = unwrapPayload(payload);
    if (!root) return null;

    const transfer = parseVizzionPayTransferResponse(root);
    const withdrawId =
      transfer.withdrawId ??
      pickString(root, ["identifier", "withdrawalId", "withdrawal_id"]);
    const looksLikeWithdraw =
      Boolean(transfer.withdrawId) ||
      Object.prototype.hasOwnProperty.call(root, "withdrawId") ||
      Object.prototype.hasOwnProperty.call(root, "withdraw_id") ||
      (typeof root.pix === "object" && root.pix !== null && "key" in (root.pix as object));

    if (looksLikeWithdraw && withdrawId) {
      const internal = mapVizzionPayWithdrawStatusToInternal(transfer.status);
      if (
        internal === "processing" &&
        Boolean(transfer.receiptUrl?.trim()) &&
        !transfer.rejectedReason?.trim()
      ) {
        return {
          gatewayTransactionId: withdrawId,
          type: "withdraw",
          status: "completed",
          amount: pickAmount(root),
          fee: null,
          e2e: pickString(root, ["e2e", "endToEndId", "end_to_end_id"]),
          gateway: VIZZION_PAY_ID,
        };
      }
      return {
        gatewayTransactionId: withdrawId,
        type: "withdraw",
        status:
          internal === "processed" ? "completed" : internal === "failed" ? "failed" : "pending",
        amount: pickAmount(root),
        fee: null,
        e2e: pickString(root, ["e2e", "endToEndId", "end_to_end_id"]),
        gateway: VIZZION_PAY_ID,
      };
    }

    const gatewayTransactionId =
      pickString(root, ["transactionId", "transaction_id", "orderId", "order_id", "identifier"]) ??
      (isRecord(root.metadata) ? pickString(root.metadata, ["depositId", "deposit_id"]) : null);
    if (!gatewayTransactionId) return null;

    return {
      gatewayTransactionId,
      type: "deposit",
      status: detectVizzionPayPixPaidPayload(root) ? "completed" : "pending",
      amount: pickAmount(root),
      fee: null,
      e2e: pickString(root, ["e2e", "endToEndId", "end_to_end_id"]),
      gateway: VIZZION_PAY_ID,
    };
  }
}

function unwrapPayload(raw: unknown): Record<string, unknown> | null {
  let v = raw;
  if (typeof v === "string" && v.trim()) {
    try {
      v = JSON.parse(v) as unknown;
    } catch {
      return null;
    }
  }
  if (Array.isArray(v) && v.length > 0) return unwrapPayload(v[0]);
  if (!isRecord(v)) return null;
  if (typeof v.body === "string" && v.body.trim()) {
    try {
      const inner = JSON.parse(v.body) as unknown;
      if (isRecord(inner)) return inner;
    } catch {
      // ignore
    }
  }
  return v;
}

export const vizzionPayGateway = new VizzionPayGateway();
export { defaultDepositWebhookUrl as vizzionPayDepositWebhookUrl };
export { defaultWithdrawWebhookUrl as vizzionPayWithdrawWebhookUrl };
