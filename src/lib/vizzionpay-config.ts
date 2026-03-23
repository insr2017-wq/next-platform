import { getPlatformSettings } from "@/lib/platform-settings";

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

export async function getVizzionPayConfig(): Promise<VizzionPayConfig | null> {
  try {
    const s = await getPlatformSettings();
    const publicKeyDb = s.vizzionpayPublicKey?.trim() ?? "";
    const secretKeyDb = s.vizzionpaySecretKey?.trim() ?? "";
    if (publicKeyDb && secretKeyDb) return { publicKey: publicKeyDb, secretKey: secretKeyDb };
  } catch {
    // Se migrações não rodaram ainda, ou DB falhou, segue para fallback de env.
  }

  const publicKeyEnv = process.env.VIZZIONPAY_PUBLIC_KEY?.trim() ?? "";
  const secretKeyEnv = process.env.VIZZIONPAY_SECRET_KEY?.trim() ?? "";
  if (!publicKeyEnv || !secretKeyEnv) return null;
  return { publicKey: publicKeyEnv, secretKey: secretKeyEnv };
}

/**
 * ID do produto criado no painel VizzionPay para recarga de saldo (ativo / à venda).
 * O gateway rejeita IDs que não existam no catálogo do estabelecimento.
 */
export function getVizzionPayDepositProductId(): string | null {
  const id = process.env.VIZZIONPAY_DEPOSIT_PRODUCT_ID?.trim();
  return id || null;
}

/**
 * Preço unitário (R$) do produto no painel VizzionPay, quando o item é vendido por unidade fixa.
 * Se definido, o payload envia quantity = amount/unit (inteiro) e price = unit, para bater com o catálogo.
 */
export function getVizzionPayDepositProductUnitPrice(): number | null {
  const raw = process.env.VIZZIONPAY_DEPOSIT_PRODUCT_UNIT_PRICE?.trim();
  if (!raw) return null;
  const n = parseFloat(raw.replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100) / 100;
}

/** Se true, não envia `price` na linha do produto (só id, nome, descrição, quantidade); o total fica no `amount` da raiz. */
export function shouldOmitVizzionPayDepositProductPrice(): boolean {
  const v = process.env.VIZZIONPAY_DEPOSIT_PRODUCT_OMIT_PRICE?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

const DEFAULT_TRANSFERS_URL = "https://app.vizzionpay.com.br/api/v1/gateway/transfers";

function normalizeVizzionPayTransfersUrl(url: string): string {
  return url.replace(/^https:\/\/app\.vizzionpay\.com\//i, "https://app.vizzionpay.com.br/");
}

/** Endpoint de transferência Pix (cash out). */
export function getVizzionPayTransfersUrl(): string {
  const fromEnv = process.env.VIZZIONPAY_TRANSFERS_URL?.trim();
  const raw = fromEnv || DEFAULT_TRANSFERS_URL;
  return normalizeVizzionPayTransfersUrl(raw);
}

/** Se true, aprovação admin marca como processado sem chamar a API (apenas dev / emergência). */
export function shouldSkipVizzionPayWithdrawTransfer(): boolean {
  const v = process.env.VIZZIONPAY_SKIP_WITHDRAW?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}
