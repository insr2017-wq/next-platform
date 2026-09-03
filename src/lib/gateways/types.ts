export const VIZZION_PAY_ID = "vizzion_pay";
export const VIZZION_PAY_LEGACY_PROVIDER = "vizzionpay";
export const MISTICPAY_ID = "misticpay";

export type GatewayId = string;

export type CreateDepositParams = {
  amount: number;
  payerName: string;
  payerDocument: string;
  transactionId: string;
  description: string;
  webhookUrl: string;
  payerEmail?: string;
  payerPhone?: string;
};

export type CreateDepositResult = {
  gatewayTransactionId: string;
  status: string;
  pixCode: string;
  qrCodeImage: string | null;
  orderId?: string | null;
};

export type CreateWithdrawParams = {
  amount: number;
  pixKey: string;
  pixKeyType: string;
  description: string;
  webhookUrl: string;
  holderName?: string;
  holderDocument?: string;
  requesterIp?: string | null;
  internalId?: string;
};

export type CreateWithdrawResult = {
  gatewayTransactionId: string;
  status: string;
  jobId?: string | null;
  rejectedReason?: string | null;
};

export type CheckTransactionResult = {
  gatewayTransactionId: string;
  status: string;
  raw: unknown;
};

export type NormalizedWebhookEvent = {
  gatewayTransactionId: string;
  type: "deposit" | "withdraw";
  status: "pending" | "completed" | "failed" | "queued";
  amount: number | null;
  fee: number | null;
  e2e: string | null;
  gateway: string;
};

export interface PaymentGateway {
  readonly id: string;
  createDeposit(params: CreateDepositParams): Promise<CreateDepositResult>;
  createWithdraw(params: CreateWithdrawParams): Promise<CreateWithdrawResult>;
  checkTransaction(gatewayTransactionId: string): Promise<CheckTransactionResult>;
  getBalance(): Promise<number>;
  parseWebhook(payload: unknown): NormalizedWebhookEvent | null;
}

export function isVizzionPayProvider(provider: string | null | undefined): boolean {
  return provider === VIZZION_PAY_ID || provider === VIZZION_PAY_LEGACY_PROVIDER;
}

export function resolveRegisteredGatewayId(provider: string | null | undefined): string | null {
  if (!provider?.trim()) return null;
  if (provider === VIZZION_PAY_LEGACY_PROVIDER) return VIZZION_PAY_ID;
  return provider.trim();
}

export function vizzionPayProviderValues(): string[] {
  return [VIZZION_PAY_ID, VIZZION_PAY_LEGACY_PROVIDER];
}
