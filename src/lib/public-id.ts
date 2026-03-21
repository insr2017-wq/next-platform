import { prisma } from "@/lib/db";

export function generatePublicId(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `ID${n}`;
}

export async function generateUniquePublicId(): Promise<string> {
  for (let i = 0; i < 200; i++) {
    const publicId = generatePublicId();
    const exists = await prisma.user.findFirst({
      where: { publicId },
      select: { id: true },
    });
    if (!exists) return publicId;
  }
  throw new Error("Não foi possível gerar um ID público único.");
}

