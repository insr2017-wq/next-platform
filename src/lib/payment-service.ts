import { prisma } from "@/lib/db";
import { getPlatformSettings } from "@/lib/platform-settings";

function normalizeDigits(v: string): string {
  return v.replace(/\D/g, "");
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

type CreateDepositRequestInput = {
  userId: string;
  amount: number;
  externalReference?: string;
  gatewayProvider?: string;
  // Placeholders ready for future gateway usage.
  pixCode?: string;
  qrCodeImage?: string | null;
};

type MarkDepositPaidInput = {
  depositId: string;
  gatewayTransactionId?: string;
  gatewayProvider?: string;
  paidAt?: Date;
};

type MarkDepositFailedInput = {
  depositId: string;
  gatewayTransactionId?: string;
  gatewayProvider?: string;
};

type CreateWithdrawalRequestInput = {
  userId: string;
  requestedAmount: number; // gross
  pixKeyType: string;
  pixKey: string;
  holderName: string;
  holderCpf: string;
};

type ApproveWithdrawalInput = {
  withdrawalId: string;
  gatewayTransactionId?: string;
  gatewayProvider?: string;
  externalReference?: string;
};

type RejectWithdrawalInput = {
  withdrawalId: string;
  gatewayTransactionId?: string;
  gatewayProvider?: string;
  externalReference?: string;
};

/**
 * Payment service layer (internal) ready for future gateway integration.
 * This module keeps business rules inside the platform (min values, balance updates, fee calc).
 *
 * Note: currently there is no real gateway webhook integration calling these functions.
 */
export async function createDepositRequest(input: CreateDepositRequestInput) {
  const settings = await getPlatformSettings();

  const amount = round2(Number(input.amount));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("AMOUNT_INVALID");
  }
  if (amount < settings.minDeposit) {
    throw new Error("MIN_DEPOSIT_NOT_MET");
  }

  // For the current app flow, deposits aren't actually created by an API endpoint.
  // This service is ready for when a gateway webhook creates/updates deposit records.
  const deposit = await prisma.deposit.create({
    data: {
      userId: input.userId,
      amount,
      status: "pending",
      gatewayProvider: input.gatewayProvider ?? null,
      externalReference: input.externalReference ?? null,
      pixCode: input.pixCode ?? null,
      qrCodeImage: input.qrCodeImage ?? null,
    },
    select: { id: true },
  });

  return deposit.id;
}

export async function markDepositPaid(input: MarkDepositPaidInput) {
  const paidAt = input.paidAt ?? new Date();

  await prisma.$transaction(async (tx) => {
    const deposit = await tx.deposit.findUnique({
      where: { id: input.depositId },
      select: { id: true, status: true, amount: true, userId: true },
    });
    if (!deposit) throw new Error("DEPOSIT_NOT_FOUND");

    // Idempotency: if already paid, do nothing.
    if (deposit.status === "paid") return;

    await tx.deposit.update({
      where: { id: input.depositId },
      data: {
        status: "paid",
        gatewayTransactionId: input.gatewayTransactionId ?? null,
        gatewayProvider: input.gatewayProvider ?? null,
        paidAt,
      },
    });

    await tx.user.update({
      where: { id: deposit.userId },
      data: { balance: { increment: deposit.amount } },
    });
  });
}

export async function markDepositFailed(input: MarkDepositFailedInput) {
  await prisma.$transaction(async (tx) => {
    const deposit = await tx.deposit.findUnique({
      where: { id: input.depositId },
      select: { id: true, status: true },
    });
    if (!deposit) throw new Error("DEPOSIT_NOT_FOUND");

    // Idempotency: don't override paid.
    if (deposit.status === "paid") return;

    await tx.deposit.update({
      where: { id: input.depositId },
      data: {
        status: "failed",
        gatewayTransactionId: input.gatewayTransactionId ?? null,
        gatewayProvider: input.gatewayProvider ?? null,
      },
    });
  });
}

export async function createWithdrawalRequest(input: CreateWithdrawalRequestInput) {
  const settings = await getPlatformSettings();

  const requestedAmount = round2(Number(input.requestedAmount));
  if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
    throw new Error("AMOUNT_INVALID");
  }
  if (requestedAmount < settings.minWithdrawal) {
    throw new Error("MIN_WITHDRAWAL_NOT_MET");
  }

  const pixKeyType = input.pixKeyType.trim();
  const pixKeyDigits = normalizeDigits(input.pixKey.trim());
  const holderName = input.holderName.trim();
  const holderCpfDigits = normalizeDigits(input.holderCpf.trim());

  if (!pixKeyType || !pixKeyDigits || !holderName || !holderCpfDigits) {
    throw new Error("WITHDRAWAL_DATA_INVALID");
  }

  const [user, paidDepositCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: input.userId },
      select: { id: true, sponsoredUser: true, banned: true },
    }),
    prisma.deposit.count({
      where: { userId: input.userId, status: "paid" },
    }),
  ]);

  if (!user) throw new Error("USER_NOT_FOUND");
  if (user.banned) throw new Error("USER_BANNED");

  const canWithdraw = Boolean(user.sponsoredUser) || paidDepositCount > 0;
  if (!canWithdraw) {
    throw new Error("WITHDRAWAL_NOT_ALLOWED");
  }

  const feePercent = Math.max(0, Math.min(100, Number(settings.withdrawalFeePercent ?? 0)));
  const feeAmount = round2((requestedAmount * feePercent) / 100);
  const netAmount = round2(requestedAmount - feeAmount);

  const created = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.updateMany({
      where: { id: input.userId, balance: { gte: requestedAmount } },
      data: { balance: { decrement: requestedAmount } },
    });
    if (updated.count !== 1) throw new Error("SALDO_INSUFICIENTE");

    const duplicate = await tx.withdrawal.findFirst({
      where: {
        userId: input.userId,
        status: "pending",
        requestedAmount,
        pixKeyType,
        pixKey: pixKeyDigits,
        holderCpf: holderCpfDigits,
      },
      select: { id: true },
    });
    if (duplicate) throw new Error("SAQUE_DUPLICADO");

    const withdrawal = await tx.withdrawal.create({
      data: {
        userId: input.userId,
        requestedAmount,
        amount: netAmount,
        feePercent,
        feeAmount,
        netAmount,
        pixKeyType,
        pixKey: pixKeyDigits,
        holderName,
        holderCpf: holderCpfDigits,
        status: "pending",
      },
      select: { id: true },
    });

    return withdrawal;
  });

  return created.id;
}

export async function approveWithdrawal(input: ApproveWithdrawalInput) {
  await prisma.$transaction(async (tx) => {
    const w = await tx.withdrawal.findUnique({
      where: { id: input.withdrawalId },
      select: { id: true, status: true },
    });
    if (!w) throw new Error("WITHDRAWAL_NOT_FOUND");
    if (w.status !== "pending") return;

    await tx.withdrawal.update({
      where: { id: input.withdrawalId },
      data: {
        status: "processed",
        processedAt: new Date(),
        gatewayTransactionId: input.gatewayTransactionId ?? null,
        gatewayProvider: input.gatewayProvider ?? null,
        externalReference: input.externalReference ?? null,
      },
    });
  });
}

export async function rejectWithdrawal(input: RejectWithdrawalInput) {
  await prisma.$transaction(async (tx) => {
    const w = await tx.withdrawal.findUnique({
      where: { id: input.withdrawalId },
      select: {
        id: true,
        status: true,
        userId: true,
        requestedAmount: true,
        amount: true,
      },
    });
    if (!w) throw new Error("WITHDRAWAL_NOT_FOUND");
    if (w.status !== "pending") return;

    await tx.withdrawal.update({
      where: { id: input.withdrawalId },
      data: {
        status: "failed",
        processedAt: new Date(),
        gatewayTransactionId: input.gatewayTransactionId ?? null,
        gatewayProvider: input.gatewayProvider ?? null,
        externalReference: input.externalReference ?? null,
      },
    });

    await tx.user.update({
      where: { id: w.userId },
      data: { balance: { increment: w.requestedAmount ?? w.amount } },
    });
  });
}

// Aliases (nomes mais explícitos para futura integração webhook)
export async function markWithdrawalProcessed(input: ApproveWithdrawalInput) {
  return approveWithdrawal(input);
}

export async function markWithdrawalFailed(input: RejectWithdrawalInput) {
  return rejectWithdrawal(input);
}

