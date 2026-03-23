import { getAppBaseUrl } from "@/lib/app-base-url";
import { FALLBACK_CLIENT_IP } from "@/lib/client-ip";
import {
  parseVizzionPayTransferResponse,
  postVizzionPayTransfer,
  type VizzionPayTransferRequestBody,
  VizzionPayTransferApiError,
} from "@/lib/vizzionpay-transfer-api";
import { logVizzionPayWithdrawEvent, logVizzionPayWithdrawWarn } from "@/lib/vizzionpay-withdraw-log";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Nome do titular: sem acentos, só letras e espaços, máx. 100 caracteres. */
export function normalizeVizzionPayOwnerName(name: string): string {
  const nfd = name.normalize("NFD").replace(/\p{M}/gu, "");
  const only = nfd.replace(/[^a-zA-Z\s]/g, " ").replace(/\s+/g, " ").trim();
  return (only.slice(0, 100) || "CLIENTE");
}

export function mapWithdrawalPixKeyTypeToVizzionPay(pixKeyType: string): string {
  const t = pixKeyType.toLowerCase().trim();
  if (t === "cpf") return "cpf";
  if (t === "cnpj") return "cnpj";
  if (t === "email" || t === "e-mail") return "email";
  if (t === "telefone" || t === "phone" || t === "tel") return "phone";
  if (t === "aleatoria" || t === "random" || t === "evp") return "random";
  return "cpf";
}

export function formatPixKeyForTransfer(pixKeyType: string, pixKey: string): string {
  const apiType = mapWithdrawalPixKeyTypeToVizzionPay(pixKeyType);
  if (apiType === "email") return pixKey.trim().toLowerCase();
  if (apiType === "random") return pixKey.trim();
  if (apiType === "phone") {
    const d = pixKey.replace(/\D/g, "");
    if (d.length >= 10 && d.length <= 11 && !d.startsWith("55")) return `55${d}`;
    return d;
  }
  return pixKey.replace(/\D/g, "");
}

function documentTypeFromDigits(digits: string): "cpf" | "cnpj" {
  if (digits.length >= 14) return "cnpj";
  return "cpf";
}

export type WithdrawalTransferInput = {
  id: string;
  netAmount: number;
  pixKeyType: string;
  pixKey: string;
  holderName: string;
  holderCpf: string;
  requesterIp: string | null;
};

export type WithdrawalTransferOutcome =
  | {
      kind: "processed";
      gatewayTransactionId: string;
      gatewayStatus: string | null;
      receiptUrl: string | null;
      webhookToken: string | null;
    }
  | {
      kind: "processing";
      gatewayTransactionId: string;
      gatewayStatus: string | null;
      receiptUrl: string | null;
      webhookToken: string | null;
    }
  | {
      kind: "failed";
      gatewayStatus: string | null;
      receiptUrl: string | null;
      webhookToken: string | null;
      rejectedReason: string | null;
      httpStatus?: number;
    };

/**
 * Mapeamento VizzionPay → estados internos:
 * - COMPLETED (e equivalentes) → processed (Pix enviado / concluído)
 * - PENDING, PROCESSING, TRANSFERRING → processing (aguardando confirmação / webhook)
 * - CANCELED, FAILED, REJECTED etc. → failed (devolução de saldo deve ser feita pelo chamador)
 */
/** Normaliza para comparação (remove acentos, maiúsculas). */
function normalizeProviderStatus(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toUpperCase()
    .trim();
}

/**
 * Mapeamento VizzionPay → estados internos.
 * Inclui sinônimos comuns de gateways BR e variações da API.
 */
export function mapVizzionPayWithdrawStatusToInternal(
  provider: string | null
): "processing" | "processed" | "failed" {
  const s = normalizeProviderStatus(provider ?? "");
  if (!s) return "processing";

  const processed = new Set<string>([
    "COMPLETED",
    "COMPLETE",
    "SUCCESS",
    "SUCCEEDED",
    "SUCCESSFUL",
    "PAID",
    "DONE",
    "OK",
    "LIQUIDATED",
    "LIQUIDADO",
    "SETTLED",
    "CONFIRMED",
    "CONFIRMADO",
    "APPROVED",
    "APROVADO",
    "FINISHED",
    "FINALIZED",
    "FINALIZADO",
    "EXECUTED",
    "TRANSFERRED",
    "CONCLUIDO",
    "CONCLUDED",
    "EFETUADO",
    "CREDITED",
    "CREDITADO",
    "PIX_SENT",
    "PIXSENT",
    "PIX_COMPLETED",
    "PIXCOMPLETED",
    "PAGO",
    "PAGA",
    "PAGAMENTO_REALIZADO",
    "REALIZADO",
    "DISPONIVEL",
    "AVAILABLE",
  ]);

  const failed = new Set<string>([
    "CANCELED",
    "CANCELLED",
    "CANCELADO",
    "FAILED",
    "REJECTED",
    "RECUSADO",
    "ERROR",
    "DENIED",
    "NEGADO",
    "REFUSED",
    "REFUNDED",
    "ESTORNADO",
    "INVALID",
    "EXPIRED",
    "EXPIRADO",
  ]);

  const stillProcessing = new Set<string>([
    "PENDING",
    "PROCESSING",
    "TRANSFERRING",
    "WAITING",
    "AGUARDANDO",
    "EM_ANALISE",
    "EM ANALISE",
    "ANALISE",
    "QUEUED",
    "FILA",
    "SCHEDULED",
    "AGENDADO",
  ]);

  if (processed.has(s)) return "processed";
  if (failed.has(s)) return "failed";
  if (stillProcessing.has(s)) return "processing";

  // Palavras-chave parciais (algumas APIs enviam frases)
  if (
    s.includes("COMPLET") ||
    s.includes("CONCLU") ||
    s.includes("LIQUID") ||
    s.includes("APROV") ||
    s.includes("CONFIRM") ||
    s.includes("SUCESS") ||
    s.includes("PAGO") ||
    s.includes("PAID")
  ) {
    if (!s.includes("NAO ") && !s.includes("NÃO ") && !s.includes("PEND")) {
      return "processed";
    }
  }
  if (s.includes("FALH") || s.includes("NEGAD") || s.includes("RECUS") || s.includes("CANCEL")) {
    return "failed";
  }
  if (s.includes("PEND") || s.includes("AGUARD") || s.includes("PROCESS") || s.includes("TRANSFERIND")) {
    return "processing";
  }

  return "processing";
}

function buildPayload(w: WithdrawalTransferInput): VizzionPayTransferRequestBody {
  const base = getAppBaseUrl();
  const callbackUrl = `${base}/api/webhooks/vizzionpay/withdraw`;
  const digits = w.holderCpf.replace(/\D/g, "");
  const docType = documentTypeFromDigits(digits);
  const docNumber = docType === "cnpj" ? digits.slice(0, 14) : digits.slice(0, 11);
  const ownerIp = (w.requesterIp?.trim() || FALLBACK_CLIENT_IP).slice(0, 45);
  if (!w.requesterIp?.trim()) {
    logVizzionPayWithdrawWarn("withdraw_owner_ip_fallback", {
      withdrawalId: w.id,
      fallback: FALLBACK_CLIENT_IP,
    });
  }

  const amount = round2(Number(w.netAmount));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("AMOUNT_INVALID");
  }

  const pixType = mapWithdrawalPixKeyTypeToVizzionPay(w.pixKeyType);
  const pixKey = formatPixKeyForTransfer(w.pixKeyType, w.pixKey);

  return {
    identifier: w.id,
    amount,
    discountFeeOfReceiver: false,
    pix: {
      type: pixType,
      key: pixKey,
    },
    owner: {
      ip: ownerIp,
      name: normalizeVizzionPayOwnerName(w.holderName),
      document: {
        type: docType,
        number: docNumber,
      },
    },
    callbackUrl,
  };
}

export async function executeVizzionPayWithdrawalTransfer(
  w: WithdrawalTransferInput
): Promise<WithdrawalTransferOutcome> {
  const payload = buildPayload(w);
  logVizzionPayWithdrawEvent("withdraw_transfer_start", {
    identifier: payload.identifier,
    amount: payload.amount,
    pixType: payload.pix.type,
    discountFeeOfReceiver: payload.discountFeeOfReceiver,
  });

  const result = await postVizzionPayTransfer(payload);

  if (!result.ok || result.json === null) {
    const parsed = result.json !== null ? parseVizzionPayTransferResponse(result.json) : null;
    logVizzionPayWithdrawEvent("withdraw_transfer_http_not_ok", {
      identifier: w.id,
      httpStatus: result.status,
      rejectedReason: parsed?.rejectedReason ?? null,
    });
    return {
      kind: "failed",
      gatewayStatus: parsed?.status ?? null,
      receiptUrl: parsed?.receiptUrl ?? null,
      webhookToken: parsed?.webhookToken ?? null,
      rejectedReason: parsed?.rejectedReason ?? result.text.slice(0, 500),
      httpStatus: result.status,
    };
  }

  const root = result.json as Record<string, unknown>;
  if (root.success === false) {
    const parsed = parseVizzionPayTransferResponse(result.json);
    return {
      kind: "failed",
      gatewayStatus: parsed.status,
      receiptUrl: parsed.receiptUrl,
      webhookToken: parsed.webhookToken,
      rejectedReason: parsed.rejectedReason ?? "Solicitação recusada pelo provedor.",
      httpStatus: result.status,
    };
  }

  const parsed = parseVizzionPayTransferResponse(result.json);
  logVizzionPayWithdrawEvent("withdraw_transfer_parsed", {
    identifier: w.id,
    withdrawId: parsed.withdrawId,
    withdrawStatus: parsed.status,
    rejectedReason: parsed.rejectedReason,
  });

  const gatewayId = parsed.withdrawId ?? w.id;
  const internal = mapVizzionPayWithdrawStatusToInternal(parsed.status);

  if (internal === "failed") {
    return {
      kind: "failed",
      gatewayStatus: parsed.status,
      receiptUrl: parsed.receiptUrl,
      webhookToken: parsed.webhookToken,
      rejectedReason: parsed.rejectedReason ?? "Transferência não concluída.",
    };
  }

  if (internal === "processed") {
    return {
      kind: "processed",
      gatewayTransactionId: gatewayId,
      gatewayStatus: parsed.status,
      receiptUrl: parsed.receiptUrl,
      webhookToken: parsed.webhookToken,
    };
  }

  /** Comprovante sem erro: tratar como concluído mesmo se o status vier genérico. */
  if (internal === "processing" && parsed.receiptUrl?.trim() && !parsed.rejectedReason?.trim()) {
    logVizzionPayWithdrawEvent("withdraw_transfer_receipt_implies_processed", {
      identifier: w.id,
      withdrawStatus: parsed.status,
    });
    return {
      kind: "processed",
      gatewayTransactionId: gatewayId,
      gatewayStatus: parsed.status,
      receiptUrl: parsed.receiptUrl,
      webhookToken: parsed.webhookToken,
    };
  }

  return {
    kind: "processing",
    gatewayTransactionId: gatewayId,
    gatewayStatus: parsed.status,
    receiptUrl: parsed.receiptUrl,
    webhookToken: parsed.webhookToken,
  };
}

export { VizzionPayTransferApiError };
