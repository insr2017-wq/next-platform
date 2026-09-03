import { prisma } from "@/lib/db";
import { markDepositPaid } from "@/lib/payment-service";
import { getVqPayConfig } from "@/lib/vqpay/vqpay-config";
import { isVqPayPaymentPaid } from "@/lib/vqpay/vqpay-client";
import { verifySignature, webhookPayloadForSignature } from "@/lib/vqpay/vqpay-sign";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function pickString(obj: Record<string, unknown>, key: string): string | null {
  const v = obj[key];
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

export type VqPayPaymentWebhookResult =
  | { ok: true; depositId: string; alreadyProcessed: boolean }
  | { ok: false; reason: string };

export async function processVqPayPaymentWebhook(payload: unknown): Promise<VqPayPaymentWebhookResult> {
  const cfg = await getVqPayConfig();
  if (!cfg) return { ok: false, reason: "not_configured" };

  if (!isRecord(payload)) return { ok: false, reason: "invalid_payload" };

  const receivedSignature = pickString(payload, "signature");
  if (!receivedSignature) return { ok: false, reason: "missing_signature" };

  const forVerify = webhookPayloadForSignature(payload);
  if (!forVerify || !verifySignature(forVerify, cfg.paymentSecret, receivedSignature)) {
    return { ok: false, reason: "invalid_signature" };
  }

  const orderId = pickString(payload, "order_id");
  if (!orderId) return { ok: false, reason: "missing_order_id" };

  const paymentId = pickString(payload, "payment_id");
  const status = pickString(payload, "status");
  const statusCodeRaw = payload.status_code;
  const statusCode =
    typeof statusCodeRaw === "number"
      ? statusCodeRaw
      : typeof statusCodeRaw === "string"
        ? parseInt(statusCodeRaw, 10)
        : null;

  const deposit = await prisma.deposit.findFirst({
    where: { id: orderId, gatewayProvider: "vqpay" },
    select: { id: true, status: true, gatewayTransactionId: true },
  });

  if (!deposit) return { ok: false, reason: "deposit_not_found" };

  if (deposit.status === "paid") {
    return { ok: true, depositId: deposit.id, alreadyProcessed: true };
  }

  if (paymentId && deposit.gatewayTransactionId === paymentId && deposit.status === "paid") {
    return { ok: true, depositId: deposit.id, alreadyProcessed: true };
  }

  const terminalFail = ["FAIL", "CANCEL", "TIMEOUT"].includes((status ?? "").toUpperCase());
  if (terminalFail) {
    await prisma.deposit.update({
      where: { id: deposit.id },
      data: {
        status: "failed",
        gatewayProvider: "vqpay",
        ...(paymentId ? { gatewayTransactionId: paymentId } : {}),
      },
    });
    return { ok: true, depositId: deposit.id, alreadyProcessed: false };
  }

  if (!isVqPayPaymentPaid(status, statusCode)) {
    return { ok: false, reason: "not_paid_yet" };
  }

  const paidAtMs = pickString(payload, "timestamp");
  const paidAt = paidAtMs && Number.isFinite(Number(paidAtMs)) ? new Date(Number(paidAtMs)) : new Date();

  await markDepositPaid({
    depositId: deposit.id,
    gatewayProvider: "vqpay",
    gatewayTransactionId: paymentId ?? deposit.gatewayTransactionId ?? undefined,
    paidAt,
  });

  return { ok: true, depositId: deposit.id, alreadyProcessed: false };
}
