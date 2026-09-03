import { getGatewayRecord } from "@/lib/payment-gateway-store";

export type VqPayConfig = {
  appId: string;
  merchantNo: string;
  paymentSecret: string;
  payoutSecret: string;
  baseUrl: string;
};

function fromEnv(): VqPayConfig | null {
  const appId = process.env.VQPAY_APP_ID?.trim();
  const merchantNo = process.env.VQPAY_MERCHANT_NO?.trim();
  const paymentSecret = process.env.VQPAY_PAYMENT_SECRET?.trim();
  const payoutSecret = process.env.VQPAY_PAYOUT_SECRET?.trim();
  const baseUrl = (process.env.VQPAY_BASE_URL?.trim() || "https://api.vortaqpay.com").replace(/\/$/, "");
  if (!appId || !merchantNo || !paymentSecret || !payoutSecret) return null;
  return { appId, merchantNo, paymentSecret, payoutSecret, baseUrl };
}

/** Sync: somente variáveis de ambiente (fallback). */
export function getVqPayConfigFromEnv(): VqPayConfig | null {
  return fromEnv();
}

export async function getVqPayConfig(): Promise<VqPayConfig | null> {
  try {
    const row = await getGatewayRecord("vqpay");
    if (row && !row.enabled) return null;
    const appId = row?.extra.appId?.trim() || row?.publicKey?.trim() || "";
    const merchantNo = row?.extra.merchantNo?.trim() || "";
    const paymentSecret = row?.extra.paymentSecret?.trim() || row?.secretKey?.trim() || "";
    const payoutSecret = row?.extra.payoutSecret?.trim() || "";
    const baseUrl = (row?.extra.baseUrl?.trim() || "https://api.vortaqpay.com").replace(/\/$/, "");
    if (appId && merchantNo && paymentSecret && payoutSecret) {
      return { appId, merchantNo, paymentSecret, payoutSecret, baseUrl };
    }
  } catch {
    // fallback env
  }
  return fromEnv();
}

export async function isVqPayConfigured(): Promise<boolean> {
  return (await getVqPayConfig()) !== null;
}
