import { PrismaPg } from "@prisma/adapter-pg";
/* Cliente deve vir do output customizado do schema (generated/prisma), não de @prisma/client no node_modules. */
import { PrismaClient } from "../../generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
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
  return url;
}

function makePrismaClient(): PrismaClient {
  const url = requirePostgresUrl();
  const adapter = new PrismaPg({
    connectionString: url,
    max: process.env.VERCEL ? 1 : 10,
  });
  return new PrismaClient({ adapter });
}

export const prisma =
  globalForPrisma.prisma ?? (globalForPrisma.prisma = makePrismaClient());
