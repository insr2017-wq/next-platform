import { prisma } from "@/lib/db";
import { getPlatformSettings } from "@/lib/platform-settings";
import { getAppBaseUrl } from "@/lib/app-base-url";
import { getVizzionPayConfig } from "@/lib/vizzionpay-config";
import {
  parseVizzionPayPixReceiveResponse,
  postVizzionPayPixReceive,
  type VizzionPayPixReceiveRequest,
} from "@/lib/vizzionpay-pix-api";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function onlyDigits(v: string): string {
  return v.replace(/\D/g, "");
}

/**
 * E-mail sintético para o gateway: a plataforma não possui campo de e-mail no cadastro.
 * Usa o host do domínio da app (`NEXT_PUBLIC_APP_URL` / `APP_URL`) quando possível.
 */
function buildSyntheticClientEmail(userId: string, publicId: string | null): string {
  const base = getAppBaseUrl();
  try {
    const host = new URL(base).hostname;
    if (host) return `pix+${userId}@${host}`;
  } catch {
    // ignore
  }
  return `pix+${userId}@deposito.plataforma`;
}

/**
 * Resolve nome do pagador: nome completo ou titular do Pix (perfil).
 */
function resolveClientName(user: { fullName: string; holderName: string | null }): string {
  const a = user.fullName.trim();
  if (a) return a;
  const b = (user.holderName ?? "").trim();
  if (b) return b;
  return "Cliente";
}

/**
 * CPF (11 dígitos) preferencial; se ausente, telefone cadastrado (11 dígitos em geral).
 */
function resolveClientDocument(user: { phone: string; holderCpf: string | null }): string {
  const cpf = onlyDigits(user.holderCpf ?? "");
  if (cpf.length === 11) return cpf;
  const phoneDigits = onlyDigits(user.phone);
  if (phoneDigits.length >= 10) return phoneDigits.slice(-11);
  return phoneDigits || "00000000000";
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

/**
 * Cria registro interno `pending`, chama a VizzionPay e persiste Pix/QR.
 * Não credita saldo (confirmação virá depois via webhook/callback).
 */
export async function createVizzionPayPixDeposit(
  userId: string,
  amountInput: number
): Promise<CreateVizzionPayDepositResult> {
  if (!getVizzionPayConfig()) {
    throw new Error("VIZZIONPAY_NOT_CONFIGURED");
  }

  const settings = await getPlatformSettings();
  const amount = round2(Number(amountInput));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("AMOUNT_INVALID");
  }
  if (amount < settings.minDeposit) {
    throw new Error("MIN_DEPOSIT_NOT_MET");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      banned: true,
      fullName: true,
      holderName: true,
      phone: true,
      holderCpf: true,
      publicId: true,
    },
  });

  if (!user) throw new Error("USER_NOT_FOUND");
  if (user.banned) throw new Error("USER_BANNED");

  const phoneDigits = onlyDigits(user.phone);
  const clientPhone = phoneDigits.length >= 10 ? phoneDigits : `55${phoneDigits}`.replace(/\D/g, "");

  const deposit = await prisma.deposit.create({
    data: {
      userId,
      amount,
      status: "pending",
      gatewayProvider: "vizzionpay",
    },
    select: { id: true },
  });

  const identifier = deposit.id;
  const baseUrl = getAppBaseUrl();
  const callbackUrl = `${baseUrl}/api/webhooks/vizzionpay/pix`;

  const payload: VizzionPayPixReceiveRequest = {
    identifier,
    amount,
    client: {
      name: resolveClientName(user),
      email: buildSyntheticClientEmail(user.id, user.publicId),
      phone: clientPhone,
      document: resolveClientDocument(user),
    },
    products: [
      {
        name: "Recarga de saldo",
        description: "Recarga via Pix na plataforma",
        quantity: 1,
        price: amount,
      },
    ],
    metadata: {
      userId: user.id,
      depositId: deposit.id,
      publicId: user.publicId ?? "",
    },
    callbackUrl,
  };

  try {
    const result = await postVizzionPayPixReceive(payload);

    if (!result.ok) {
      const status = result.status;
      const isAuth = status === 401 || status === 403;
      await prisma.deposit.update({
        where: { id: deposit.id },
        data: { status: "failed", gatewayProvider: "vizzionpay", externalReference: identifier },
      });
      throw new Error(isAuth ? "GATEWAY_AUTH_FAILED" : "GATEWAY_REQUEST_FAILED");
    }

    const parsed = parseVizzionPayPixReceiveResponse(result.json);
    if (!parsed) {
      await prisma.deposit.update({
        where: { id: deposit.id },
        data: { status: "failed", gatewayProvider: "vizzionpay", externalReference: identifier },
      });
      throw new Error("GATEWAY_RESPONSE_INVALID");
    }

    const gatewayTxId = parsed.transactionId ?? parsed.orderId;

    await prisma.deposit.update({
      where: { id: deposit.id },
      data: {
        status: "pending",
        gatewayProvider: "vizzionpay",
        gatewayTransactionId: gatewayTxId,
        externalReference: identifier,
        pixCode: parsed.pixCode,
        qrCodeImage: parsed.qrCodeImageRaw ?? parsed.pixBase64 ?? null,
      },
    });

    return {
      depositId: deposit.id,
      identifier,
      gatewayTransactionId: gatewayTxId,
      orderId: parsed.orderId,
      gatewayStatus: parsed.status,
      pixCode: parsed.pixCode,
      qrCodeImageRaw: parsed.qrCodeImageRaw ?? parsed.pixBase64 ?? null,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (
      msg === "AMOUNT_INVALID" ||
      msg === "MIN_DEPOSIT_NOT_MET" ||
      msg === "USER_NOT_FOUND" ||
      msg === "USER_BANNED" ||
      msg === "VIZZIONPAY_NOT_CONFIGURED"
    ) {
      throw e;
    }
    if (msg.startsWith("GATEWAY_")) throw e;

    await prisma.deposit
      .update({
        where: { id: deposit.id },
        data: { status: "failed", gatewayProvider: "vizzionpay", externalReference: identifier },
      })
      .catch(() => {});
    throw e;
  }
}
