import { getAppBaseUrl } from "@/lib/app-base-url";
import { generateValidCpfDigits } from "@/lib/cpf";

/**
 * E-mail sintético para o gateway: a plataforma não possui campo de e-mail no cadastro.
 * Evita host `localhost` / IP (comum quando `NEXT_PUBLIC_APP_URL` não está definido em produção),
 * usando opcionalmente `VIZZIONPAY_CLIENT_EMAIL_DOMAIN` ou o host do `VERCEL_URL`.
 */
export function buildSyntheticClientEmail(userId: string, _publicId: string | null): string {
  const envDomain = process.env.VIZZIONPAY_CLIENT_EMAIL_DOMAIN?.trim();
  if (envDomain) {
    const host = envDomain
      .replace(/^https?:\/\//i, "")
      .split("/")[0]
      ?.split(":")[0];
    if (host && host.includes(".")) {
      return `pix+${userId}@${host}`;
    }
  }
  const base = getAppBaseUrl();
  try {
    const host = new URL(base).hostname;
    if (host && host !== "localhost" && host !== "127.0.0.1" && host.includes(".")) {
      return `pix+${userId}@${host}`;
    }
  } catch {
    // ignore
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    try {
      const h = new URL(vercel.startsWith("http") ? vercel : `https://${vercel}`).hostname;
      if (h) return `pix+${userId}@${h}`;
    } catch {
      // ignore
    }
  }
  return `pix+${userId}@deposito.plataforma`;
}

/**
 * Resolve nome do pagador: nome completo ou titular do Pix (perfil).
 */
export function resolveClientName(user: { fullName: string; holderName: string | null }): string {
  const a = user.fullName.trim();
  if (a) return a;
  const b = (user.holderName ?? "").trim();
  if (b) return b;
  return "Cliente";
}

/**
 * Documento enviado ao gateway no depósito Pix: CPF aleatório válido.
 * Não exige CPF do usuário e não grava o valor gerado na conta.
 */
export function resolveCpfDocumentForPixGateway(
  _userId?: string,
  _user?: { holderCpf: string | null },
): string {
  return generateValidCpfDigits();
}

export type CreateVizzionPayDepositResult = {
  depositId: string;
  identifier: string;
  gatewayTransactionId: string | null;
  orderId: string | null;
  gatewayStatus: string | null;
  pixCode: string;
  qrCodeImageRaw: string | null;
};

/** @deprecated Use createPixDeposit — respeita o gateway ativo do painel. */
export async function createVizzionPayPixDeposit(
  userId: string,
  amountInput: number
): Promise<CreateVizzionPayDepositResult> {
  const { createPixDeposit } = await import("@/lib/create-pix-deposit");
  return createPixDeposit(userId, amountInput);
}
