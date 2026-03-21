import { prisma } from "@/lib/db";

function isSqliteFileDb(): boolean {
  const url = process.env.DATABASE_URL?.trim() ?? "";
  if (!url) return false;
  return url.toLowerCase().startsWith("file:");
}

async function ensureUserColumnSqlite(
  name: string,
  addSql: string
): Promise<void> {
  const rows = await prisma.$queryRawUnsafe<{ name: string }[]>(
    'PRAGMA table_info("User")'
  );
  if (!Array.isArray(rows)) return;
  if (rows.some((r) => r.name === name)) return;
  await prisma.$executeRawUnsafe(addSql);
  if (process.env.NODE_ENV === "development") {
    console.info(`[schema] Coluna "${name}" adicionada à tabela User.`);
  }
}

/**
 * Bancos criados pela migração inicial antiga não tinham a coluna `banned`.
 * Garante a coluna no SQLite sem quebrar quem já tem (db push / migrações novas).
 */
export async function ensureUserBannedColumnSqlite(): Promise<void> {
  if (!isSqliteFileDb()) return;
  try {
    await ensureUserColumnSqlite(
      "banned",
      'ALTER TABLE "User" ADD COLUMN "banned" INTEGER NOT NULL DEFAULT 0'
    );
  } catch (e) {
    console.error("[ensureUserBannedColumnSqlite]", e);
    throw e;
  }
}

/**
 * Garante a coluna publicId e preenche IDs aleatórios para usuários existentes.
 */
export async function ensureUserPublicIdColumnAndBackfill(): Promise<void> {
  if (!isSqliteFileDb()) return;
  try {
    await ensureUserColumnSqlite(
      "publicId",
      'ALTER TABLE "User" ADD COLUMN "publicId" TEXT'
    );
  } catch (e) {
    console.error("[ensureUserPublicIdColumnAndBackfill] ensure column:", e);
    throw e;
  }

  // Backfill: gerar IDs para quem está sem publicId (null/empty).
  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [{ publicId: null }, { publicId: "" }],
      },
      select: { id: true },
    });
    for (const u of users) {
      // tenta algumas vezes; colisão é improvável com unique
      for (let i = 0; i < 50; i++) {
        const n = Math.floor(1000 + Math.random() * 9000);
        const publicId = `ID${n}`;
        const exists = await prisma.user.findFirst({
          where: { publicId },
          select: { id: true },
        });
        if (exists) continue;
        try {
          await prisma.user.update({
            where: { id: u.id },
            data: { publicId },
          });
          break;
        } catch {
          // corrida/colisão: tenta novamente
        }
      }
    }
  } catch (e) {
    console.error("[ensureUserPublicIdColumnAndBackfill] backfill:", e);
    throw e;
  }
}

/**
 * Garante colunas de chave Pix no User (SQLite). Para uso futuro em saques/recebimentos.
 */
export async function ensureUserPixColumnsSqlite(): Promise<void> {
  if (!isSqliteFileDb()) return;
  try {
    await ensureUserColumnSqlite(
      "pixKeyType",
      'ALTER TABLE "User" ADD COLUMN "pixKeyType" TEXT'
    );
  } catch (e) {
    console.error("[ensureUserPixColumnsSqlite] pixKeyType:", e);
    throw e;
  }
  try {
    await ensureUserColumnSqlite(
      "pixKey",
      'ALTER TABLE "User" ADD COLUMN "pixKey" TEXT'
    );
  } catch (e) {
    console.error("[ensureUserPixColumnsSqlite] pixKey:", e);
    throw e;
  }
  try {
    await ensureUserColumnSqlite(
      "holderName",
      'ALTER TABLE "User" ADD COLUMN "holderName" TEXT'
    );
  } catch (e) {
    console.error("[ensureUserPixColumnsSqlite] holderName:", e);
    throw e;
  }
  try {
    await ensureUserColumnSqlite(
      "holderCpf",
      'ALTER TABLE "User" ADD COLUMN "holderCpf" TEXT'
    );
  } catch (e) {
    console.error("[ensureUserPixColumnsSqlite] holderCpf:", e);
    throw e;
  }
}

/** Check-in diário (calendário): última data e slot do ciclo de 7. */
export async function ensureUserCheckInColumnsSqlite(): Promise<void> {
  if (!isSqliteFileDb()) return;
  try {
    await ensureUserColumnSqlite(
      "checkInLastDate",
      'ALTER TABLE "User" ADD COLUMN "checkInLastDate" TEXT'
    );
  } catch (e) {
    console.error("[ensureUserCheckInColumnsSqlite] checkInLastDate:", e);
    throw e;
  }
  try {
    await ensureUserColumnSqlite(
      "checkInLastSlot",
      'ALTER TABLE "User" ADD COLUMN "checkInLastSlot" INTEGER NOT NULL DEFAULT 0'
    );
  } catch (e) {
    console.error("[ensureUserCheckInColumnsSqlite] checkInLastSlot:", e);
    throw e;
  }
}

/**
 * Garante a coluna sponsoredUser na tabela User (SQLite).
 * Usada para liberar saques via administração.
 */
export async function ensureUserSponsoredUserColumnSqlite(): Promise<void> {
  if (!isSqliteFileDb()) return;
  try {
    await ensureUserColumnSqlite(
      "sponsoredUser",
      'ALTER TABLE "User" ADD COLUMN "sponsoredUser" INTEGER NOT NULL DEFAULT 0'
    );
  } catch (e) {
    console.error("[ensureUserSponsoredUserColumnSqlite]", e);
    throw e;
  }
}
