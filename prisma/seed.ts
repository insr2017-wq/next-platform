import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db";

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
