"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPlatformSettings } from "@/lib/platform-settings";
import { DepositClient } from "./DepositClient";

export default async function DepositPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [user, platformSettings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { balance: true, holderCpf: true },
    }),
    getPlatformSettings(),
  ]);

  const initialBalance = Number(user?.balance ?? 0);
  const minDeposit = Number(platformSettings.minDeposit ?? 0);

  return (
    <DepositClient
      initialBalance={initialBalance}
      minDeposit={minDeposit}
      initialHolderCpf={user?.holderCpf ?? null}
    />
  );
}

