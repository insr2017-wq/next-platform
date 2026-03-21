import fs from "node:fs";
import path from "node:path";
/* Cliente deve vir do output customizado do schema (generated/prisma), não de @prisma/client no node_modules. */
import { PrismaClient } from "../../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function getDatabaseUrl(): string {
  const env = process.env.DATABASE_URL;
  if (env && !env.startsWith("file:")) return env;
  let filePath: string;
  if (env && env.startsWith("file:")) {
    const raw = env.slice(5).trim();
    filePath = path.isAbsolute(raw)
      ? path.resolve(raw)
      : path.resolve(process.cwd(), raw);
  } else {
    filePath = path.resolve(process.cwd(), "prisma", "dev.db");
  }
  return "file:" + filePath;
}

function ensureDatabaseDir(url: string): void {
  if (!url.startsWith("file:")) return;
  const raw = url.slice(5).trim();
  const filePath = path.resolve(raw);
  const dir = path.dirname(filePath);
  if (dir && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (process.env.NODE_ENV === "development") {
    console.log("[db] SQLite path:", filePath, "| dir exists:", fs.existsSync(dir));
  }
}

function makePrismaClient() {
  const url = getDatabaseUrl();
  ensureDatabaseDir(url);
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
}

export const prisma =
  globalForPrisma.prisma ?? makePrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
