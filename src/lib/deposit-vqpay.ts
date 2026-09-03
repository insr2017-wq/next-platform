import { prisma } from "@/lib/db";
import { getPlatformSettings } from "@/lib/platform-settings";
import { getAppBaseUrl } from "@/lib/app-base-url";
import { generateRandomValidCpf } from "@/lib/cpf";
import { createPixPayment } from "@/lib/vqpay/vqpay-client";
import { VqPayApiError } from "@/lib/vqpay/vqpay-errors";
import { getVqPayConfig } from "@/lib/vqpay/vqpay-config";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function onlyDigits(v: string): string {
  return v.replace(/\D/g, "");
}

function resolveClientName(user: { fullName: string; holderName: string | null }): string {
  const a = user.fullName.trim();
  if (a) return a;
  const b = (user.holderName ?? "").trim();
  if (b) return b;
  return "Cliente";
}

function buildSyntheticClientEmail(userId: string): string {
  const envDomain = process.env.VQPAY_CLIENT_EMAIL_DOMAIN?.trim();
  if (envDomain) {
    const host = envDomain
      .replace(/^https?:\/\//i, "")
      .split("/")[0]
      ?.split(":")[0];
    if (host && host.includes(".")) return `pix+${userId}@${host}`;
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
  return `pix+${userId}@deposito.plataforma`;
}

export type CreateVqPayDepositResult = {
  depositId: string;
  identifier: string;
  gatewayTransactionId: string | null;
  orderId: string | null;
  gatewayStatus: string | null;
  redirectUrl: string | null;
};

export async function createVqPayPixDeposit(
  userId: string,
  amountInput: number
): Promise<CreateVqPayDepositResult> {
  if (!(await getVqPayConfig())) {
    throw new Error("VQPAY_NOT_CONFIGURED");
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
    },
  });

  if (!user) throw new Error("USER_NOT_FOUND");
  if (user.banned) throw new Error("USER_BANNED");

  const deposit = await prisma.deposit.create({
    data: {
      userId,
      amount,
      status: "pending",
      gatewayProvider: "vqpay",
    },
    select: { id: true },
  });

  const identifier = deposit.id;
  const baseUrl = getAppBaseUrl();
  const notificationUrl = `${baseUrl}/api/webhooks/vqpay/payment`;
  const successRedirectUrl = `${baseUrl}/deposit?paid=1`;

  const phoneDigits = onlyDigits(user.phone);
  const clientPhone = phoneDigits.length >= 10 ? phoneDigits : `55${phoneDigits}`.replace(/\D/g, "");

  try {
    const result = await createPixPayment({
      orderId: identifier,
      amount,
      notificationUrl,
      successRedirectUrl,
      payer: {
        name: resolveClientName(user),
        document: generateRandomValidCpf(),
        email: buildSyntheticClientEmail(user.id),
        phone: clientPhone.length >= 10 ? clientPhone : undefined,
      },
      extend: user.id,
    });

    if (!result.redirectUrl) {
      await prisma.deposit.update({
        where: { id: deposit.id },
        data: { status: "failed", gatewayProvider: "vqpay", externalReference: identifier },
      });
      throw new Error("GATEWAY_RESPONSE_INVALID");
    }

    await prisma.deposit.update({
      where: { id: deposit.id },
      data: {
        status: "pending",
        gatewayProvider: "vqpay",
        gatewayTransactionId: result.paymentId,
        externalReference: identifier,
        redirectUrl: result.redirectUrl,
      },
    });

    return {
      depositId: deposit.id,
      identifier,
      gatewayTransactionId: result.paymentId,
      orderId: identifier,
      gatewayStatus: result.status,
      redirectUrl: result.redirectUrl,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (
      msg === "AMOUNT_INVALID" ||
      msg === "MIN_DEPOSIT_NOT_MET" ||
      msg === "USER_NOT_FOUND" ||
      msg === "USER_BANNED" ||
      msg === "VQPAY_NOT_CONFIGURED"
    ) {
      throw e;
    }

    if (e instanceof VqPayApiError) {
      await prisma.deposit
        .update({
          where: { id: deposit.id },
          data: { status: "failed", gatewayProvider: "vqpay", externalReference: identifier },
        })
        .catch(() => {});
      throw new Error("GATEWAY_REQUEST_FAILED");
    }

    if (msg === "GATEWAY_RESPONSE_INVALID") throw e;

    await prisma.deposit
      .update({
        where: { id: deposit.id },
        data: { status: "failed", gatewayProvider: "vqpay", externalReference: identifier },
      })
      .catch(() => {});
    throw e;
  }
}
