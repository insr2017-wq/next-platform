import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { GatewayApiError } from "@/lib/gateways/errors";
import { gatewayManager } from "@/lib/gateways/manager";
import { mapGatewayDepositStatus } from "@/lib/gateways/status";
import { resolveRegisteredGatewayId, isVizzionPayProvider } from "@/lib/gateways/types";
import { markDepositPaid } from "@/lib/payment-service";
import { detectVizzionPayPixPaidPayload } from "@/lib/vizzionpay-pix-paid-detect";
import { fetchVizzionPayPixStatusByDeposit } from "@/lib/vizzionpay-pix-query";

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
    where: { id: depositId, userId: session.userId },
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

  const gatewayId = resolveRegisteredGatewayId(deposit.gatewayProvider);
  const gateway = gatewayId ? gatewayManager.getGatewayById(gatewayId) : undefined;

  let paid = false;
  if (gateway && deposit.gatewayTransactionId) {
    try {
      const queried = await gateway.checkTransaction(deposit.gatewayTransactionId);
      paid = mapGatewayDepositStatus(queried.status) === "completed";
      if (!paid && detectVizzionPayPixPaidPayload(queried.raw)) paid = true;
    } catch (e) {
      if (e instanceof GatewayApiError && e.code === "RATE_LIMITED") {
        return NextResponse.json(
          { error: "O provedor limitou as consultas. Aguarde alguns instantes e tente de novo." },
          { status: 429 }
        );
      }
    }
  }

  if (!paid && isVizzionPayProvider(deposit.gatewayProvider)) {
    const queried = await fetchVizzionPayPixStatusByDeposit({
      depositId: deposit.id,
      gatewayTransactionId: deposit.gatewayTransactionId,
    });
    if (queried && detectVizzionPayPixPaidPayload(queried.json)) {
      paid = true;
    }
  }

  if (!paid) {
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
    gatewayProvider: gatewayId ?? deposit.gatewayProvider ?? undefined,
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
