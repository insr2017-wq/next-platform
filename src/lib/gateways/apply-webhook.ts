import { prisma } from "@/lib/db";
import { markDepositFailed, markDepositPaid } from "@/lib/payment-service";
import {
  isVizzionPayProvider,
  type NormalizedWebhookEvent,
  vizzionPayProviderValues,
} from "@/lib/gateways/types";

export type ApplyWebhookExtra = {
  depositId?: string;
  withdrawalId?: string;
  paidAt?: Date | null;
};

function providerLookupValues(gateway: string): string[] {
  if (isVizzionPayProvider(gateway)) return vizzionPayProviderValues();
  return [gateway];
}

async function resolveDepositId(
  event: NormalizedWebhookEvent,
  extra?: ApplyWebhookExtra
): Promise<string | null> {
  if (extra?.depositId) return extra.depositId;

  const providers = providerLookupValues(event.gateway);
  const byTx = await prisma.deposit.findFirst({
    where: {
      gatewayTransactionId: event.gatewayTransactionId,
      gatewayProvider: { in: providers },
    },
    select: { id: true },
  });
  if (byTx) return byTx.id;

  const byExt = await prisma.deposit.findFirst({
    where: {
      externalReference: event.gatewayTransactionId,
      gatewayProvider: { in: providers },
    },
    select: { id: true },
  });
  if (byExt) return byExt.id;

  const byId = await prisma.deposit.findUnique({
    where: { id: event.gatewayTransactionId },
    select: { id: true },
  });
  return byId?.id ?? null;
}

async function resolveWithdrawalId(
  event: NormalizedWebhookEvent,
  extra?: ApplyWebhookExtra
): Promise<string | null> {
  if (extra?.withdrawalId) return extra.withdrawalId;

  const providers = providerLookupValues(event.gateway);
  const byTx = await prisma.withdrawal.findFirst({
    where: {
      gatewayTransactionId: event.gatewayTransactionId,
      gatewayProvider: { in: providers },
    },
    select: { id: true },
  });
  if (byTx) return byTx.id;

  const byId = await prisma.withdrawal.findUnique({
    where: { id: event.gatewayTransactionId },
    select: { id: true },
  });
  return byId?.id ?? null;
}

async function applyDepositEvent(
  event: NormalizedWebhookEvent,
  extra?: ApplyWebhookExtra
): Promise<void> {
  const depositId = await resolveDepositId(event, extra);
  if (!depositId) {
    console.warn("[gateway-webhook] depósito não encontrado", {
      gateway: event.gateway,
      gatewayTransactionId: event.gatewayTransactionId,
    });
    return;
  }

  if (event.status === "completed") {
    await markDepositPaid({
      depositId,
      gatewayProvider: event.gateway,
      gatewayTransactionId: event.gatewayTransactionId,
      paidAt: extra?.paidAt ?? new Date(),
    });
    return;
  }

  if (event.status === "failed") {
    await markDepositFailed({
      depositId,
      gatewayProvider: event.gateway,
      gatewayTransactionId: event.gatewayTransactionId,
    });
  }
}

async function applyWithdrawEvent(
  event: NormalizedWebhookEvent,
  extra?: ApplyWebhookExtra
): Promise<void> {
  const withdrawalId = await resolveWithdrawalId(event, extra);
  if (!withdrawalId) {
    console.warn("[gateway-webhook] saque não encontrado", {
      gateway: event.gateway,
      gatewayTransactionId: event.gatewayTransactionId,
    });
    return;
  }

  const w = await prisma.withdrawal.findUnique({
    where: { id: withdrawalId },
    select: {
      id: true,
      status: true,
      userId: true,
      requestedAmount: true,
      amount: true,
    },
  });
  if (!w) return;

  if (w.status === "processed" || w.status === "failed") return;

  if (event.status === "completed") {
    await prisma.withdrawal.update({
      where: { id: w.id },
      data: {
        status: "processed",
        processedAt: new Date(),
        gatewayProvider: event.gateway,
        gatewayTransactionId: event.gatewayTransactionId,
      },
    });
    return;
  }

  if (event.status === "failed") {
    const refund = w.requestedAmount > 0 ? w.requestedAmount : w.amount;
    await prisma.$transaction(async (tx) => {
      await tx.withdrawal.update({
        where: { id: w.id },
        data: {
          status: "failed",
          processedAt: new Date(),
          gatewayProvider: event.gateway,
          gatewayTransactionId: event.gatewayTransactionId,
        },
      });
      await tx.user.update({
        where: { id: w.userId },
        data: { balance: { increment: refund } },
      });
    });
    return;
  }

  await prisma.withdrawal.update({
    where: { id: w.id },
    data: {
      status: "processing",
      gatewayProvider: event.gateway,
      gatewayTransactionId: event.gatewayTransactionId,
    },
  });
}

/**
 * Atualiza depósito/saque a partir do payload já normalizado por `parseWebhook`.
 */
export async function applyNormalizedWebhookEvent(
  event: NormalizedWebhookEvent,
  extra?: ApplyWebhookExtra
): Promise<void> {
  if (event.type === "deposit") {
    await applyDepositEvent(event, extra);
    return;
  }
  await applyWithdrawEvent(event, extra);
}
