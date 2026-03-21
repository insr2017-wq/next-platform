export type VizzionPayConfig = {
  publicKey: string;
  secretKey: string;
};

const RECEIVE_URL = "https://app.vizzionpay.com/api/v1/gateway/pix/receive";

export function getVizzionPayReceiveUrl(): string {
  return RECEIVE_URL;
}

/**
 * Credenciais do gateway (somente servidor). Nunca expor no cliente.
 */
export function getVizzionPayConfig(): VizzionPayConfig | null {
  const publicKey = process.env.VIZZIONPAY_PUBLIC_KEY?.trim();
  const secretKey = process.env.VIZZIONPAY_SECRET_KEY?.trim();
  if (!publicKey || !secretKey) return null;
  return { publicKey, secretKey };
}
