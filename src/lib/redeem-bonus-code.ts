import { prisma } from "@/lib/db";
import { randomBonusAmount } from "@/lib/bonus-amount";

export type RedeemBonusResult =
  | { ok: true; amount: number }
  | { ok: false; error: string };

/**
 * Resgata um código bônus para o usuário: gera valor aleatório [min,max], registra em
 * BonusCodeRedemption e credita saldo. Use no fluxo do app (ex.: API do usuário).
 */
export async function redeemBonusCodeForUser(
  userId: string,
  rawCode: string
): Promise<RedeemBonusResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) {
    return { ok: false, error: "Informe o código." };
  }

  const bonus = await prisma.bonusCode.findUnique({
    where: { code },
  });
  if (!bonus || !bonus.isActive) {
    return { ok: false, error: "Código inválido ou inativo." };
  }

  const used = await prisma.bonusCodeRedemption.count({
    where: { bonusCodeId: bonus.id },
  });
  if (bonus.maxRedemptions > 0 && used >= bonus.maxRedemptions) {
    return { ok: false, error: "Este código já atingiu o limite de resgates." };
  }

  const already = await prisma.bonusCodeRedemption.findUnique({
    where: {
      bonusCodeId_userId: { bonusCodeId: bonus.id, userId },
    },
  });
  if (already) {
    return { ok: false, error: "Você já resgatou este código." };
  }

  const amount = randomBonusAmount(bonus.minAmount, bonus.maxAmount);

  try {
    await prisma.$transaction([
      prisma.bonusCodeRedemption.create({
        data: { bonusCodeId: bonus.id, userId, amount },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { balance: { increment: amount } },
      }),
    ]);
  } catch {
    return { ok: false, error: "Não foi possível concluir o resgate. Tente novamente." };
  }

  return { ok: true, amount };
}
