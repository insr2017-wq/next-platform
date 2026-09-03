import { prisma } from "@/lib/db";
import { getPlatformSettings } from "@/lib/platform-settings";
import {
  buildSyntheticClientEmail,
  resolveClientName,
  resolveCpfDocumentForPixGateway,
  type CreateVizzionPayDepositResult,
} from "@/lib/deposit-vizzionpay";
import { getVizzionPayConfig, getVizzionPayDepositProductId } from "@/lib/vizzionpay-config";
import { GatewayApiError, gatewayErrorToLegacyCode } from "@/lib/gateways/errors";
import { gatewayManager } from "@/lib/gateways/manager";
import { isMisticPayConfigured, misticPayWebhookUrl } from "@/lib/gateways/misticpay";
import { vizzionPayDepositWebhookUrl } from "@/lib/gateways/vizzion-pay";
import { MISTICPAY_ID, VIZZION_PAY_ID } from "@/lib/gateways/types";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function onlyDigits(v: string): string {
  return v.replace(/\D/g, "");
}

function webhookUrlForGateway(gatewayId: string): string {
  if (gatewayId === MISTICPAY_ID) return misticPayWebhookUrl();
  return vizzionPayDepositWebhookUrl();
}

/**
 * Cria depósito Pix no gateway ativo (Vizzion Pay ou MisticPay).
 * Não credita saldo — a confirmação vem pelo webhook (ou verificação manual).
 */
export async function createPixDeposit(
  userId: string,
  amountInput: number
): Promise<CreateVizzionPayDepositResult> {
  const gateway = await gatewayManager.getActiveGateway();
  if (gateway.id === VIZZION_PAY_ID) {
    if (!(await getVizzionPayConfig())) {
      throw new Error("VIZZIONPAY_NOT_CONFIGURED");
    }
    if (!getVizzionPayDepositProductId()) {
      throw new Error("VIZZIONPAY_DEPOSIT_PRODUCT_NOT_CONFIGURED");
    }
  }
  if (gateway.id === MISTICPAY_ID && !isMisticPayConfigured()) {
    throw new Error("GATEWAY_NOT_CONFIGURED");
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

  const cpfDocument = resolveCpfDocumentForPixGateway(userId, user);
  const phoneDigits = onlyDigits(user.phone);
  const clientPhone = phoneDigits.length >= 10 ? phoneDigits : `55${phoneDigits}`.replace(/\D/g, "");

  const deposit = await prisma.deposit.create({
    data: {
      userId,
      amount,
      status: "pending",
      gatewayProvider: gateway.id,
    },
    select: { id: true },
  });

  const identifier = deposit.id;

  try {
    const result = await gateway.createDeposit({
      amount,
      payerName: resolveClientName(user),
      payerDocument: cpfDocument,
      transactionId: identifier,
      description: "Pagamento",
      webhookUrl: webhookUrlForGateway(gateway.id),
      payerEmail: buildSyntheticClientEmail(user.id, user.publicId),
      payerPhone: clientPhone,
    });

    await prisma.deposit.update({
      where: { id: deposit.id },
      data: {
        status: "pending",
        gatewayProvider: gateway.id,
        gatewayTransactionId: result.gatewayTransactionId,
        externalReference: identifier,
        pixCode: result.pixCode,
        qrCodeImage: result.qrCodeImage,
      },
    });

    return {
      depositId: deposit.id,
      identifier,
      gatewayTransactionId: result.gatewayTransactionId,
      orderId: result.orderId ?? null,
      gatewayStatus: result.status,
      pixCode: result.pixCode,
      qrCodeImageRaw: result.qrCodeImage,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (
      msg === "AMOUNT_INVALID" ||
      msg === "MIN_DEPOSIT_NOT_MET" ||
      msg === "USER_NOT_FOUND" ||
      msg === "USER_BANNED" ||
      msg === "VIZZIONPAY_NOT_CONFIGURED" ||
      msg === "VIZZIONPAY_DEPOSIT_PRODUCT_NOT_CONFIGURED" ||
      msg === "DEPOSIT_AMOUNT_INCOMPATIBLE_WITH_PRODUCT_UNIT" ||
      msg === "USER_CPF_REQUIRED_FOR_PIX" ||
      msg === "USER_CPF_INVALID_FOR_PIX"
    ) {
      await prisma.deposit
        .update({
          where: { id: deposit.id },
          data: { status: "failed", gatewayProvider: gateway.id, externalReference: identifier },
        })
        .catch(() => {});
      throw e;
    }

    await prisma.deposit
      .update({
        where: { id: deposit.id },
        data: { status: "failed", gatewayProvider: gateway.id, externalReference: identifier },
      })
      .catch(() => {});

    if (e instanceof GatewayApiError) {
      throw new Error(gatewayErrorToLegacyCode(e));
    }
    if (msg.startsWith("GATEWAY_")) throw e;
    throw e;
  }
}
