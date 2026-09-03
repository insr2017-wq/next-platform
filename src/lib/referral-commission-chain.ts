import type { Prisma } from "@/lib/prisma-generated";

export type InviterChain = {
  l1: string | null;
  l2: string | null;
  l3: string | null;
  /** true quando não havia linha em `Referral` e o indicador veio de `User.referredBy` */
  usedReferredByFallback: boolean;
};

/**
 * Resolve a cadeia de indicadores (níveis 1–3) para creditar comissão na compra de produto.
 *
 * - L1: usa `Referral` (registro mais antigo); se faltar, usa `User.referredBy` + `inviteCode`
 *   (corrige casos em que o convite existia mas a linha em `Referral` não foi criada).
 * - L2/L3: apenas via `Referral`, sempre com `orderBy: createdAt asc` para ser determinístico.
 * - Evita auto-indicação e ciclos óbvios (mesmo id repetido na cadeia).
 */
export async function resolveInviterChainForProductPurchase(
  tx: Prisma.TransactionClient,
  buyerId: string
): Promise<InviterChain> {
  const referralL1 = await tx.referral.findFirst({
    where: { invitedUserId: buyerId },
    orderBy: { createdAt: "asc" },
    select: { inviterId: true },
  });

  let l1 = referralL1?.inviterId ?? null;
  let usedReferredByFallback = false;

  if (!l1) {
    const buyer = await tx.user.findUnique({
      where: { id: buyerId },
      select: { referredBy: true },
    });
    const code = buyer?.referredBy?.trim();
    if (code) {
      const inviter = await tx.user.findFirst({
        where: { inviteCode: code },
        select: { id: true },
      });
      if (inviter && inviter.id !== buyerId) {
        l1 = inviter.id;
        usedReferredByFallback = true;
      }
    }
  }

  if (!l1 || l1 === buyerId) {
    return {
      l1: null,
      l2: null,
      l3: null,
      usedReferredByFallback: false,
    };
  }

  const refL2 = await tx.referral.findFirst({
    where: { invitedUserId: l1 },
    orderBy: { createdAt: "asc" },
    select: { inviterId: true },
  });
  let l2 = refL2?.inviterId ?? null;
  if (l2 === buyerId || l2 === l1) {
    l2 = null;
  }

  let l3: string | null = null;
  if (l2) {
    const refL3 = await tx.referral.findFirst({
      where: { invitedUserId: l2 },
      orderBy: { createdAt: "asc" },
      select: { inviterId: true },
    });
    l3 = refL3?.inviterId ?? null;
    if (l3 === buyerId || l3 === l1 || l3 === l2) {
      l3 = null;
    }
  }

  return { l1, l2, l3, usedReferredByFallback };
}
