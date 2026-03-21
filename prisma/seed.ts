import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

function getDatabaseUrl(): string {
  const env = process.env.DATABASE_URL;
  if (env && !env.startsWith("file:")) return env;
  let filePath: string;
  if (env?.startsWith("file:")) {
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
}

const url = getDatabaseUrl();
ensureDatabaseDir(url);
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPhone = "11999999999";
  const adminPassword = "admin123";

  const existing = await prisma.user.findUnique({ where: { phone: adminPhone } });
  if (existing) {
    console.log("Admin user already exists (phone:", adminPhone, "). Skipping seed.");
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const inviteCode = "00000000"; // seed admin code; in production use generateInviteCode()

  await prisma.user.create({
    data: {
      fullName: "Admin",
      phone: adminPhone,
      passwordHash,
      role: "admin",
      balance: 0,
      inviteCode,
    },
  });

  console.log("Default admin user created.");
  console.log("  Phone:", adminPhone);
  console.log("  Password:", adminPassword);
  console.log("  Use these to log in and get redirected to /admin/dashboard");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
