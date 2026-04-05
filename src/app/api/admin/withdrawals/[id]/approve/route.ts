import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseUserIpFromWithdrawalExternalReference } from "@/lib/client-ip";
import { getVizzionPayConfig, shouldSkipVizzionPayWithdrawTransfer } from "@/lib/vizzionpay-config";
import {
  executeVizzionPayWithdrawalTransfer,
  VizzionPayTransferApiError,
} from "@/lib/vizzionpay-withdraw-transfer";
import { logVizzionPayWithdrawError, logVizzionPayWithdrawEvent } from "@/lib/vizzionpay-withdraw-log";

function requireAdmin(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }
  return null;
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

  const withdrawal = await prisma.withdrawal.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      userId: true,
      requestedAmount: true,
      amount: true,
      netAmount: true,
      pixKeyType: true,
      pixKey: true,
      holderName: true,
      holderCpf: true,
      externalReference: true,
    },
  });

  if (!withdrawal) {
    return NextResponse.json({ error: "Saque não encontrado." }, { status: 404 });
  }

  if (withdrawal.status !== "pending") {
    return NextResponse.json(
      { error: "Este saque não está mais pendente de aprovação." },
      { status: 400 }
    );
  }

  const cfg = await getVizzionPayConfig();
  const skipApi = shouldSkipVizzionPayWithdrawTransfer();

  if (!cfg) {
    if (!skipApi) {
      return NextResponse.json(
        {
          error:
            "Gateway de pagamento não configurado para saques automáticos. Configure as chaves do VizzionPay no painel admin (ou via VIZZIONPAY_PUBLIC_KEY/VIZZIONPAY_SECRET_KEY), ou use VIZZIONPAY_SKIP_WITHDRAW=true apenas em desenvolvimento.",
        },
        { status: 503 }
      );
    }
    await prisma.withdrawal.update({
      where: { id: withdrawal.id },
      data: {
        status: "processed",
        processedAt: new Date(),
        gatewayProvider: null,
      },
    });
    logVizzionPayWithdrawEvent("withdraw_approve_skipped_no_gateway", { withdrawalId: withdrawal.id });
    return NextResponse.json({
      success: true,
      message: "Saque aprovado (modo sem integração — apenas desenvolvimento).",
    });
  }

  if (skipApi) {
    await prisma.withdrawal.update({
      where: { id: withdrawal.id },
      data: {
        status: "processed",
        processedAt: new Date(),
        gatewayProvider: "vizzionpay",
      },
    });
    logVizzionPayWithdrawEvent("withdraw_approve_skipped_env_flag", { withdrawalId: withdrawal.id });
    return NextResponse.json({
      success: true,
      message: "Saque aprovado (VIZZIONPAY_SKIP_WITHDRAW ativo — transferência não enviada).",
    });
  }

  try {
    const outcome = await executeVizzionPayWithdrawalTransfer({
      id: withdrawal.id,
      netAmount: Number(withdrawal.netAmount),
      pixKeyType: withdrawal.pixKeyType,
      pixKey: withdrawal.pixKey,
      holderName: withdrawal.holderName,
      holderCpf: withdrawal.holderCpf,
      requesterIp: "72.60.246.61",
    });

    if (outcome.kind === "processed") {
      logVizzionPayWithdrawEvent("withdraw_approve_provider_extras", {
        withdrawalId: withdrawal.id,
        receiptUrlPresent: Boolean(outcome.receiptUrl),
        webhookTokenPresent: Boolean(outcome.webhookToken),
        gatewayStatus: outcome.gatewayStatus,
      });
      await prisma.withdrawal.update({
        where: { id: withdrawal.id },
        data: {
          status: "processed",
          processedAt: new Date(),
          gatewayProvider: "vizzionpay",
          gatewayTransactionId: outcome.gatewayTransactionId,
          externalReference: withdrawal.id,
        },
      });
      return NextResponse.json({
        success: true,
        message: "Saque aprovado e transferência concluída no provedor.",
      });
    }

    if (outcome.kind === "processing") {
      logVizzionPayWithdrawEvent("withdraw_approve_provider_extras", {
        withdrawalId: withdrawal.id,
        receiptUrlPresent: Boolean(outcome.receiptUrl),
        webhookTokenPresent: Boolean(outcome.webhookToken),
        gatewayStatus: outcome.gatewayStatus,
      });
      await prisma.withdrawal.update({
        where: { id: withdrawal.id },
        data: {
          status: "processing",
          gatewayProvider: "vizzionpay",
          gatewayTransactionId: outcome.gatewayTransactionId,
          externalReference: withdrawal.id,
        },
      });
      return NextResponse.json({
        success: true,
        message:
          "Saque aprovado. A transferência está em processamento no provedor; o status será atualizado pelo retorno ou pelo webhook.",
      });
    }

    const refund =
      withdrawal.requestedAmount > 0 ? withdrawal.requestedAmount : Number(withdrawal.amount);

    logVizzionPayWithdrawEvent("withdraw_approve_immediate_fail", {
      withdrawalId: withdrawal.id,
      rejectedReason: outcome.rejectedReason,
      gatewayStatus: outcome.gatewayStatus,
    });
    await prisma.$transaction(async (tx) => {
      await tx.withdrawal.update({
        where: { id: withdrawal.id },
        data: {
          status: "failed",
          processedAt: new Date(),
          gatewayProvider: "vizzionpay",
        },
      });
      await tx.user.update({
        where: { id: withdrawal.userId },
        data: { balance: { increment: refund } },
      });
    });

    logVizzionPayWithdrawEvent("withdraw_approve_failed_refunded", {
      withdrawalId: withdrawal.id,
      refund,
      reason: outcome.rejectedReason,
    });

    return NextResponse.json(
      {
        success: false,
        error:
          "O provedor recusou a transferência imediatamente. O valor foi devolvido ao saldo do usuário.",
        detail: outcome.rejectedReason ?? undefined,
      },
      { status: 409 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logVizzionPayWithdrawError("withdraw_approve_exception", {
      withdrawalId: withdrawal.id,
      message: msg,
    });

    const refund =
      withdrawal.requestedAmount > 0 ? withdrawal.requestedAmount : Number(withdrawal.amount);

    if (e instanceof VizzionPayTransferApiError || msg.includes("FETCH_FAILED")) {
      await prisma.$transaction(async (tx) => {
        await tx.withdrawal.update({
          where: { id: withdrawal.id },
          data: {
            status: "failed",
            processedAt: new Date(),
            gatewayProvider: "vizzionpay",
          },
        });
        await tx.user.update({
          where: { id: withdrawal.userId },
          data: { balance: { increment: refund } },
        });
      });
      return NextResponse.json(
        {
          success: false,
          error:
            "Não foi possível conectar ao provedor de pagamento. O valor foi devolvido ao saldo do usuário. Tente novamente mais tarde.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: "Não foi possível aprovar o saque no momento." },
      { status: 500 }
    );
  }
}
