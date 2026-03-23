import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { detectVizzionPayPixPaidPayload } from "@/lib/vizzionpay-pix-paid-detect";
import { fetchVizzionPayPixStatusByDeposit } from "@/lib/vizzionpay-pix-query";
import { markDepositPaid } from "@/lib/payment-service";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  context: { params: Promise<{ depositId: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "user") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { depositId } = await context.params;
  if (!depositId?.trim()) {
    return NextResponse.json({ error: "Depósito inválido." }, { status: 400 });
  }

  const deposit = await prisma.deposit.findFirst({
    where: { id: depositId, userId: session.userId, gatewayProvider: "vizzionpay" },
  });

  if (!deposit) {
    return NextResponse.json({ error: "Depósito não encontrado." }, { status: 404 });
  }

  if (deposit.status === "paid") {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { balance: true },
    });
    return NextResponse.json({
      ok: true,
      alreadyPaid: true,
      balance: Number(user?.balance ?? 0),
      depositStatus: "paid",
    });
  }

  if (deposit.status !== "pending") {
    return NextResponse.json({ error: "Este depósito não pode ser confirmado." }, { status: 400 });
  }

  const queried = await fetchVizzionPayPixStatusByDeposit({
    depositId: deposit.id,
    gatewayTransactionId: deposit.gatewayTransactionId,
  });

  if (!queried || !detectVizzionPayPixPaidPayload(queried.json)) {
    return NextResponse.json(
      {
        error:
          "Ainda não foi possível confirmar o Pix no provedor. Aguarde alguns instantes e tente de novo, ou confira se o webhook está configurado.",
      },
      { status: 409 }
    );
  }

  await markDepositPaid({
    depositId: deposit.id,
    gatewayProvider: "vizzionpay",
    gatewayTransactionId: deposit.gatewayTransactionId ?? undefined,
  });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { balance: true },
  });

  return NextResponse.json({
    ok: true,
    balance: Number(user?.balance ?? 0),
    depositStatus: "paid",
  });
}
