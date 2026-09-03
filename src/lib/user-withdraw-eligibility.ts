import { prisma } from "@/lib/db";

/** Pelo menos um investimento/produto com ciclo ainda em andamento. */
export async function userHasActiveProduct(userId: string): Promise<boolean> {
  const n = await prisma.userProduct.count({
    where: { userId, earningStatus: "active" },
  });
  return n > 0;
}
