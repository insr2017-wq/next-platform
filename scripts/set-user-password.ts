/**
 * Define a senha de um usuário existente pelo telefone (apenas dígitos ou formato BR).
 * Uso (na raiz do projeto, com DATABASE_URL no .env):
 *   npx tsx scripts/set-user-password.ts 89981478520 "novaSenha"
 */
import "dotenv/config";
import { prisma } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";
import { phoneLookupVariants } from "../src/lib/phone-auth";

function digits(raw: string): string {
  return raw.replace(/\D/g, "").trim();
}

async function main() {
  const phoneArg = process.argv[2];
  const password = process.argv[3];
  if (!phoneArg || !password) {
    console.error('Uso: npx tsx scripts/set-user-password.ts <telefone> "<senha>"');
    process.exit(1);
  }

  const variants = phoneLookupVariants(digits(phoneArg));
  if (variants.length === 0) {
    console.error("Telefone inválido.");
    process.exit(1);
  }

  const user = await prisma.user.findFirst({
    where: { phone: { in: variants } },
    select: { id: true, phone: true, role: true },
  });

  if (!user) {
    console.error("Usuário não encontrado para:", variants);
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  console.log("OK — senha atualizada.");
  console.log("  id:", user.id);
  console.log("  phone:", user.phone);
  console.log("  role:", user.role);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
