import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { formatWithdrawalExternalReferenceForRequesterIp, getClientIpFromHeaders } from "@/lib/client-ip";
import { prisma } from "@/lib/db";
import { getPlatformSettings } from "@/lib/platform-settings";

function parseAmount(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v) && v > 0) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = parseFloat(v.replace(",", "."));
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export async function POST(request: Request) {
  const requesterIp = getClientIpFromHeaders(request.headers);
  const session = await getSession();
  if (!session || session.role !== "user") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const b = (body ?? {}) as {
    amount?: unknown;
    pixKeyType?: string;
    pixKey?: string;
    holderName?: string;
    holderCpf?: string;
  };

  const amountRaw = parseAmount(b.amount);
  if (amountRaw === null) {
    return NextResponse.json({ error: "Informe um valor válido para o saque." }, { status: 400 });
  }

  // `amount` recebido do client é o VALOR SOLICITADO/GROSS.
  const requestedAmount = Math.round(amountRaw * 100) / 100;
  if (requestedAmount <= 0) {
    return NextResponse.json({ error: "Informe um valor maior que zero." }, { status: 400 });
  }

  const pixKeyType = typeof b.pixKeyType === "string" ? b.pixKeyType.trim() : "";
  const pixKey = typeof b.pixKey === "string" ? b.pixKey.trim() : "";
  const holderName = typeof b.holderName === "string" ? b.holderName.trim() : "";
  const holderCpf = typeof b.holderCpf === "string" ? b.holderCpf.trim() : "";

  if (!holderName) return NextResponse.json({ error: "Informe o nome do titular." }, { status: 400 });
  if (!holderCpf) return NextResponse.json({ error: "Informe o CPF do titular." }, { status: 400 });
  if (!pixKeyType) return NextResponse.json({ error: "Informe o tipo de chave Pix." }, { status: 400 });
  if (!pixKey) return NextResponse.json({ error: "Informe a chave Pix." }, { status: 400 });

  // Normaliza dígitos para consistência (principalmente para cpf/telefone).
  const pixKeyDigits = pixKey.replace(/\D/g, "");
  const holderCpfDigits = holderCpf.replace(/\D/g, "");

  // Regra de permissão (servidor sempre): deposito confirmado pago OU patrocinado.
  const [user, paidDepositCount, settings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, balance: true, sponsoredUser: true, banned: true },
    }),
    prisma.deposit.count({
      where: { userId: session.userId, status: "paid" },
    }),
    getPlatformSettings(),
  ]);

  if (!user) return NextResponse.json({ error: "Conta inválida." }, { status: 403 });
  if (user.banned) return NextResponse.json({ error: "Conta suspensa." }, { status: 403 });

  const hasPaidDeposit = paidDepositCount > 0;
  const canWithdraw = Boolean(user.sponsoredUser) || hasPaidDeposit;
  if (!canWithdraw) {
    return NextResponse.json(
      {
        error:
          "Para realizar saques, é necessário ter ao menos um depósito confirmado ou estar liberado pela administração.",
      },
      { status: 403 }
    );
  }

  const minWithdrawalRaw = Number(settings.minWithdrawal ?? 0);
  const minWithdrawal = Number.isFinite(minWithdrawalRaw) ? Math.max(0, minWithdrawalRaw) : 0;
  if (requestedAmount < minWithdrawal) {
    return NextResponse.json(
      { error: `O valor mínimo para saque é ${formatBRL(minWithdrawal)}.` },
      { status: 400 }
    );
  }

  const feePercentRaw = Number(settings.withdrawalFeePercent ?? 0);
  const feePercent = Number.isFinite(feePercentRaw) ? Math.max(0, Math.min(100, feePercentRaw)) : 0;
  const feeAmount = Math.round((requestedAmount * feePercent) / 100 * 100) / 100;
  const netAmount = Math.round((requestedAmount - feeAmount) * 100) / 100;

  // Dedução + criação do saque precisam ser atômicas.
  try {
    const created = await prisma.$transaction(async (tx) => {
      // Proteção contra saldo insuficiente em concorrência.
      const updated = await tx.user.updateMany({
        where: { id: session.userId, balance: { gte: requestedAmount } },
        data: { balance: { decrement: requestedAmount } },
      });

      if (updated.count !== 1) {
        // Se não decrementou, é porque o saldo não é suficiente (ou houve alteração concorrente).
        throw new Error("SALDO_INSUFICIENTE");
      }

      // Evita duplicidade exata (clique duplo) mantendo uma regra simples.
      const duplicate = await tx.withdrawal.findFirst({
        where: {
          userId: session.userId,
          status: "pending",
          requestedAmount,
          pixKeyType,
          pixKey: pixKeyDigits,
          holderCpf: holderCpfDigits,
        },
        select: { id: true },
      });
      if (duplicate) {
        throw new Error("SAQUE_DUPLICADO");
      }

      const withdrawal = await tx.withdrawal.create({
        data: {
          userId: session.userId,
          amount: netAmount,
          requestedAmount,
          feePercent,
          feeAmount,
          netAmount,
          pixKeyType,
          pixKey: pixKeyDigits,
          holderName,
          holderCpf: holderCpfDigits,
          status: "pending",
          externalReference: formatWithdrawalExternalReferenceForRequesterIp(requesterIp),
        },
        select: { id: true },
      });

      return withdrawal;
    });

    return NextResponse.json({ success: true, message: "Saque solicitado." });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "SALDO_INSUFICIENTE") {
      return NextResponse.json({ error: "Saldo insuficiente para este saque." }, { status: 400 });
    }
    if (msg === "SAQUE_DUPLICADO") {
      return NextResponse.json(
        { error: "Você já possui um saque pendente com esses dados." },
        { status: 409 }
      );
    }
    console.error("user/withdrawals POST:", e);
    return NextResponse.json(
      { error: "Não foi possível solicitar o saque no momento." },
      { status: 500 }
    );
  }
}

