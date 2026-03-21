"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { WithdrawClient } from "./WithdrawClient";
import { getPlatformSettings } from "@/lib/platform-settings";

export default async function WithdrawPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [user, paidDepositsCount, settings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        balance: true,
        sponsoredUser: true,
        pixKeyType: true,
        pixKey: true,
        holderName: true,
        holderCpf: true,
      },
    }),
    prisma.deposit.count({
      where: { userId: session.userId, status: "paid" },
    }),
    getPlatformSettings(),
  ]);

  const initialBalance = Number(user?.balance ?? 0);
  const hasPaidDeposit = paidDepositsCount > 0;
  const canWithdraw = Boolean(user?.sponsoredUser) || hasPaidDeposit;

  const blockedMessage =
    "Para realizar saques, é necessário ter ao menos um depósito confirmado ou estar liberado pela administração.";

  const withdrawalFeePercentRaw = Number(settings.withdrawalFeePercent ?? 0);
  const withdrawalFeePercent = Number.isFinite(withdrawalFeePercentRaw)
    ? Math.max(0, Math.min(100, withdrawalFeePercentRaw))
    : 0;

  return (
    <WithdrawClient
      initialBalance={initialBalance}
      canWithdraw={canWithdraw}
      blockedMessage={blockedMessage}
      initialPixKeyType={user?.pixKeyType ?? null}
      initialPixKey={user?.pixKey ?? null}
      initialHolderName={user?.holderName ?? null}
      initialHolderCpf={user?.holderCpf ?? null}
      withdrawalFeePercent={withdrawalFeePercent}
    />
  );
}

