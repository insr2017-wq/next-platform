export type VizzionPayConfig = {
  publicKey: string;
  secretKey: string;
};

/** URL padrão do Pix receber (host atual da VizzionPay). */
const DEFAULT_RECEIVE_URL = "https://app.vizzionpay.com.br/api/v1/gateway/pix/receive";

/**
 * Domínio antigo `app.vizzionpay.com` responde 301 para `.com.br`.
 * O `fetch` ao seguir 301/302 troca POST por GET na requisição seguinte, e a rota da API
 * devolve 405 — por isso a URL final deve ser sempre `.com.br` (ou override explícito).
 */
function normalizeVizzionPayReceiveUrl(url: string): string {
  return url.replace(/^https:\/\/app\.vizzionpay\.com\//i, "https://app.vizzionpay.com.br/");
}

export function getVizzionPayReceiveUrl(): string {
  const fromEnv = process.env.VIZZIONPAY_PIX_RECEIVE_URL?.trim();
  const raw = fromEnv || DEFAULT_RECEIVE_URL;
  return normalizeVizzionPayReceiveUrl(raw);
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
