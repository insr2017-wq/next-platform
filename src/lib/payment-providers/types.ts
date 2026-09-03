export type DepositProviderId = "vizzionpay" | "vqpay";

export type CreateDepositParams = {
  userId: string;
  amount: number;
};

export type DepositStatus = {
  orderId: string;
  status: string;
  statusCode: number | null;
  paid: boolean;
  gatewayTransactionId: string | null;
};

export type CreateDepositResult = {
  depositId: string;
  identifier: string;
  gatewayProvider: DepositProviderId;
  gatewayTransactionId: string | null;
  orderId: string | null;
  gatewayStatus: string | null;
  pixCode: string | null;
  qrCodeImageRaw: string | null;
  redirectUrl: string | null;
};

export interface DepositProvider {
  readonly id: DepositProviderId;
  createDeposit(params: CreateDepositParams): Promise<CreateDepositResult>;
  queryDeposit(orderId: string): Promise<DepositStatus | null>;
  validateWebhookSignature(payload: unknown): boolean;
}

export function parseDepositProviderId(value: unknown): DepositProviderId | null {
  if (value === "vizzionpay" || value === "vqpay") return value;
  return null;
}
