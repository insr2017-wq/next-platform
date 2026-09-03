import { createVqPayPixDeposit } from "@/lib/deposit-vqpay";
import { getVqPayConfigFromEnv } from "@/lib/vqpay/vqpay-config";
import { isVqPayPaymentPaid, queryPayment } from "@/lib/vqpay/vqpay-client";
import { verifySignature, webhookPayloadForSignature } from "@/lib/vqpay/vqpay-sign";
import type { CreateDepositParams, CreateDepositResult, DepositProvider, DepositStatus } from "./types";

export const vqPayDepositProvider: DepositProvider = {
  id: "vqpay",

  async createDeposit(params: CreateDepositParams): Promise<CreateDepositResult> {
    const result = await createVqPayPixDeposit(params.userId, params.amount);
    return {
      depositId: result.depositId,
      identifier: result.identifier,
      gatewayProvider: "vqpay",
      gatewayTransactionId: result.gatewayTransactionId,
      orderId: result.orderId,
      gatewayStatus: result.gatewayStatus,
      pixCode: null,
      qrCodeImageRaw: null,
      redirectUrl: result.redirectUrl,
    };
  },

  async queryDeposit(orderId: string): Promise<DepositStatus | null> {
    const queried = await queryPayment(orderId);
    if (!queried) return null;
    return {
      orderId,
      status: queried.status ?? "unknown",
      statusCode: queried.statusCode,
      paid: isVqPayPaymentPaid(queried.status, queried.statusCode),
      gatewayTransactionId: queried.paymentId,
    };
  },

  validateWebhookSignature(payload: unknown): boolean {
    const cfg = getVqPayConfigFromEnv();
    if (!cfg) return false;
    if (typeof payload !== "object" || payload === null || Array.isArray(payload)) return false;
    const obj = payload as Record<string, unknown>;
    const received = typeof obj.signature === "string" ? obj.signature : "";
    if (!received.trim()) return false;
    const forVerify = webhookPayloadForSignature(payload);
    if (!forVerify) return false;
    return verifySignature(forVerify, cfg.paymentSecret, received);
  },
};
