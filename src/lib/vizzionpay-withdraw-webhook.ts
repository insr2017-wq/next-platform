import { prisma } from "@/lib/db";
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
      where: { gatewayTransactionId: idFromPayload, gatewayProvider: "vizzionpay" },
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
  const internal = mapVizzionPayWithdrawStatusToInternal(parsed.status);

  const w = await prisma.withdrawal.findUnique({
    where: { id: row.id },
    select: {
      id: true,
      status: true,
      userId: true,
      requestedAmount: true,
      amount: true,
    },
  });
  if (!w) return;

  if (w.status === "processed" || w.status === "failed") {
    logVizzionPayWithdrawEvent("withdraw_webhook_idempotent_skip", { withdrawalId: w.id, status: w.status });
    return;
  }

  const baseData = {
    gatewayStatus: parsed.status,
    gatewayReceiptUrl: parsed.receiptUrl ?? undefined,
    gatewayWebhookToken: parsed.webhookToken ?? undefined,
    gatewayFailureReason: parsed.rejectedReason ?? undefined,
    gatewayTransactionId: parsed.withdrawId ?? undefined,
  };

  if (internal === "processed") {
    await prisma.withdrawal.update({
      where: { id: w.id },
      data: {
        status: "processed",
        processedAt: new Date(),
        gatewayProvider: "vizzionpay",
        ...baseData,
      },
    });
    logVizzionPayWithdrawEvent("withdraw_webhook_marked_processed", { withdrawalId: w.id });
    return;
  }

  if (internal === "failed") {
    const refund = w.requestedAmount > 0 ? w.requestedAmount : w.amount;
    await prisma.$transaction(async (tx) => {
      await tx.withdrawal.update({
        where: { id: w.id },
        data: {
          status: "failed",
          processedAt: new Date(),
          gatewayProvider: "vizzionpay",
          ...baseData,
        },
      });
      await tx.user.update({
        where: { id: w.userId },
        data: { balance: { increment: refund } },
      });
    });
    logVizzionPayWithdrawEvent("withdraw_webhook_marked_failed_refunded", {
      withdrawalId: w.id,
      refund,
    });
    return;
  }

  await prisma.withdrawal.update({
    where: { id: w.id },
    data: {
      status: "processing",
      gatewayProvider: "vizzionpay",
      ...baseData,
    },
  });
  logVizzionPayWithdrawEvent("withdraw_webhook_marked_processing", { withdrawalId: w.id });
}
