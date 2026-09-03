import { prisma } from "@/lib/db";
import { applyNormalizedWebhookEvent } from "@/lib/gateways/apply-webhook";
import { VIZZION_PAY_ID, vizzionPayProviderValues } from "@/lib/gateways/types";
import { mapVizzionPayWithdrawStatusToInternal } from "@/lib/vizzionpay-withdraw-transfer";
import { parseVizzionPayTransferResponse } from "@/lib/vizzionpay-transfer-api";
import { logVizzionPayWithdrawEvent, logVizzionPayWithdrawWarn, truncateForWithdrawLog } from "@/lib/vizzionpay-withdraw-log";

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

export function normalizeVizzionPayWithdrawWebhookPayload(raw: unknown): unknown {
  let v = raw;
  if (typeof v === "string" && v.trim()) {
    try {
      v = JSON.parse(v) as unknown;
    } catch {
      return raw;
    }
  }
  if (Array.isArray(v) && v.length > 0) return normalizeVizzionPayWithdrawWebhookPayload(v[0]);
  if (!isRecord(v)) return v;
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

async function findWithdrawalForWebhook(json: unknown): Promise<{ id: string } | null> {
  const parsed = parseVizzionPayTransferResponse(json);
  const idFromPayload =
    pickString(isRecord(json) ? json : {}, ["identifier", "withdrawalId", "withdrawal_id"]) ??
    parsed.withdrawId;

  if (idFromPayload) {
    const byId = await prisma.withdrawal.findUnique({
      where: { id: idFromPayload },
      select: { id: true },
    });
    if (byId) return byId;

    const byGateway = await prisma.withdrawal.findFirst({
      where: { gatewayTransactionId: idFromPayload, gatewayProvider: { in: vizzionPayProviderValues() } },
      select: { id: true },
    });
    if (byGateway) return byGateway;
  }

  return null;
}

export async function processVizzionPayWithdrawWebhook(json: unknown): Promise<void> {
  logVizzionPayWithdrawEvent("withdraw_webhook_received", {
    bodyPreview: truncateForWithdrawLog(JSON.stringify(json), 5_000),
  });

  const normalized = normalizeVizzionPayWithdrawWebhookPayload(json);
  const row = await findWithdrawalForWebhook(normalized);
  if (!row) {
    logVizzionPayWithdrawWarn("withdraw_webhook_withdrawal_not_found", {});
    return;
  }

  const parsed = parseVizzionPayTransferResponse(normalized);
  logVizzionPayWithdrawEvent("withdraw_webhook_parsed", {
    withdrawId: parsed.withdrawId,
    providerStatus: parsed.status,
    rejectedReason: parsed.rejectedReason,
    receiptUrlPresent: Boolean(parsed.receiptUrl),
  });
  let internal = mapVizzionPayWithdrawStatusToInternal(parsed.status);
  /** Comprovante sem motivo de recusa costuma indicar Pix já enviado / pago. */
  if (
    internal === "processing" &&
    Boolean(parsed.receiptUrl?.trim()) &&
    !parsed.rejectedReason?.trim()
  ) {
    internal = "processed";
    logVizzionPayWithdrawEvent("withdraw_webhook_receipt_implies_processed", {
      withdrawalId: row.id,
      providerStatus: parsed.status,
    });
  }

  const eventStatus =
    internal === "processed" ? "completed" : internal === "failed" ? "failed" : "pending";

  await applyNormalizedWebhookEvent(
    {
      gatewayTransactionId: parsed.withdrawId ?? row.id,
      type: "withdraw",
      status: eventStatus,
      amount: null,
      fee: null,
      e2e: null,
      gateway: VIZZION_PAY_ID,
    },
    { withdrawalId: row.id }
  );

  if (eventStatus === "completed") {
    logVizzionPayWithdrawEvent("withdraw_webhook_marked_processed", { withdrawalId: row.id });
    return;
  }
  if (eventStatus === "failed") {
    logVizzionPayWithdrawEvent("withdraw_webhook_marked_failed_refunded", {
      withdrawalId: row.id,
    });
    return;
  }
  logVizzionPayWithdrawEvent("withdraw_webhook_marked_processing", { withdrawalId: row.id });
}
