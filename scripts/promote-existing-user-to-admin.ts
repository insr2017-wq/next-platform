/**
 * One-off: set role = admin for an EXISTING user by phone (no new rows).
 * Run from project root with DATABASE_URL set:
 *   cmd /c "npx tsx scripts/promote-existing-user-to-admin.ts"
 *   cmd /c "npx tsx scripts/promote-existing-user-to-admin.ts 89981478520"
 */
import "dotenv/config";
import { prisma } from "../src/lib/db";
import { phoneLookupVariants } from "../src/lib/phone-auth";

function digits(raw: string): string {
  return raw.replace(/\D/g, "").trim();
}

async function main() {
  const arg = process.argv[2] ?? "89981478520";
  const variants = phoneLookupVariants(digits(arg));
  if (variants.length === 0) {
    console.error("Invalid phone.");
    process.exit(1);
  }

  const user = await prisma.user.findFirst({
    where: { phone: { in: variants } },
  });

  if (!user) {
    console.error("No existing user found for phone variants:", variants);
    process.exit(1);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { role: "admin" },
  });

  console.log("OK — user is now admin.");
  console.log("  id:", user.id);
  console.log("  phone:", user.phone);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
