import { PrismaPg } from "@prisma/adapter-pg";
/* Cliente deve vir do output customizado do schema (generated/prisma), não de @prisma/client no node_modules. */
import { PrismaClient } from "../../generated/prisma/client";
import { normalizePostgresUrlForPrisma } from "@/lib/database-url";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  dbUrlLogged: boolean | undefined;
};

function requirePostgresUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "DATABASE_URL não definido. Configure a connection string PostgreSQL (ex.: Supabase) em DATABASE_URL."
    );
  }
  if (url.startsWith("file:")) {
    throw new Error(
      "DATABASE_URL não pode usar SQLite (file:). Este projeto usa apenas PostgreSQL."
    );
  }
  return normalizePostgresUrlForPrisma(url);
}

function makePrismaClient(): PrismaClient {
  const raw = requirePostgresUrl();
  if (process.env.AUTH_DEBUG === "1" && !globalForPrisma.dbUrlLogged) {
    globalForPrisma.dbUrlLogged = true;
    try {
      const u = new URL(raw);
      console.info("[db] DATABASE_URL em uso:", {
        host: u.hostname,
        port: u.port || "(default)",
        database: u.pathname.replace(/^\//, "") || "(default)",
        pgbouncer: raw.includes("pgbouncer=true"),
      });
    } catch {
      console.info("[db] DATABASE_URL definido (não foi possível parsear host para log).");
    }
  }
  const adapter = new PrismaPg({
    connectionString: raw,
    max: process.env.VERCEL ? 1 : 10,
  });
  return new PrismaClient({ adapter });
}

export const prisma =
  globalForPrisma.prisma ?? (globalForPrisma.prisma = makePrismaClient());
