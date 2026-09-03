import { createVizzionPayPixDeposit } from "@/lib/deposit-vizzionpay";
import { fetchVizzionPayPixStatusByDeposit } from "@/lib/vizzionpay-pix-query";
import { detectVizzionPayPixPaidPayload } from "@/lib/vizzionpay-pix-paid-detect";
import type { CreateDepositParams, CreateDepositResult, DepositProvider, DepositStatus } from "./types";

export const vizzionPayDepositProvider: DepositProvider = {
  id: "vizzionpay",

  async createDeposit(params: CreateDepositParams): Promise<CreateDepositResult> {
    const result = await createVizzionPayPixDeposit(params.userId, params.amount);
    return {
      depositId: result.depositId,
      identifier: result.identifier,
      gatewayProvider: "vizzionpay",
      gatewayTransactionId: result.gatewayTransactionId,
      orderId: result.orderId,
      gatewayStatus: result.gatewayStatus,
      pixCode: result.pixCode,
      qrCodeImageRaw: result.qrCodeImageRaw,
      redirectUrl: null,
    };
  },

  async queryDeposit(orderId: string): Promise<DepositStatus | null> {
    const queried = await fetchVizzionPayPixStatusByDeposit({
      depositId: orderId,
      gatewayTransactionId: null,
    });
    if (!queried) return null;
    return {
      orderId,
      status: "unknown",
      statusCode: null,
      paid: detectVizzionPayPixPaidPayload(queried.json),
      gatewayTransactionId: null,
    };
  },

  validateWebhookSignature(_payload: unknown): boolean {
    return true;
  },
};
