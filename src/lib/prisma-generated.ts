/**
 * Re-export do Prisma Client gerado (`generator output = ../generated/prisma`).
 * Importar `Prisma` / `PrismaClient` daqui evita o path alias `@prisma/client` → generated,
 * que no build da Vercel pode colidir com o pacote npm `@prisma/client` e gerar
 * MODULE_NOT_FOUND (`@prisma/client/default`).
 */
export { Prisma, PrismaClient } from "../../generated/prisma/client";
