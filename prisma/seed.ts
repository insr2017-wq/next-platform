import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db";
import { generateInviteCode } from "../src/lib/invite-code";

async function uniqueInviteCode(): Promise<string> {
  for (let i = 0; i < 40; i++) {
    const code = generateInviteCode();
    const taken = await prisma.user.findUnique({ where: { inviteCode: code } });
    if (!taken) return code;
  }
  throw new Error("Não foi possível gerar inviteCode único para o seed.");
}

/** Telefone fixo do único administrador da plataforma. */
const ADMIN_PHONE = "89981478520";

/**
 * Garante o usuário admin (telefone acima) e rebaixa qualquer outro admin para user.
 * Login em /login — admin vai para /admin/dashboard.
 *
 * Senha: ADMIN_SEED_PASSWORD no .env ou padrão em código.
 */
const SUPREMO_NAME = "Administrador supremo";

async function main() {
  const adminPhone = ADMIN_PHONE.replace(/\D/g, "").trim();
  const adminPassword = (process.env.ADMIN_SEED_PASSWORD ?? "230723").trim();

  if (adminPhone.length < 10) {
    throw new Error("Telefone admin inválido.");
  }
  if (adminPassword.length < 6) {
    throw new Error("ADMIN_SEED_PASSWORD deve ter ao menos 6 caracteres.");
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const existing = await prisma.user.findUnique({ where: { phone: adminPhone } });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: "admin",
        passwordHash,
        fullName: existing.fullName?.trim() ? existing.fullName : SUPREMO_NAME,
      },
    });
    console.log("Usuário existente promovido/atualizado como admin.");
  } else {
    const inviteCode = await uniqueInviteCode();
    await prisma.user.create({
      data: {
        fullName: SUPREMO_NAME,
        phone: adminPhone,
        passwordHash,
        role: "admin",
        balance: 0,
        inviteCode,
      },
    });
    console.log("Conta admin criada.");
  }

  const demoted = await prisma.user.updateMany({
    where: { role: "admin", phone: { not: adminPhone } },
    data: { role: "user" },
  });
  if (demoted.count > 0) {
    console.log(`Outros ${demoted.count} usuário(s) com role admin foram rebaixados para user (só ${adminPhone} é admin).`);
  }

  console.log("");
  console.log("Admin — entre em /login com:");
  console.log("  Telefone:", adminPhone);
  console.log("  Senha:   ", adminPassword);
  console.log("  (altere ADMIN_SEED_PASSWORD em produção)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
