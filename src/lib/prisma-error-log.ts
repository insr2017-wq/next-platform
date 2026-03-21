import { Prisma } from "@/lib/prisma-generated";

/**
 * Registra erros de Prisma nos logs do servidor (inclui produção / Vercel).
 * Não envia detalhes sensíveis ao cliente — use só em catch de rotas API.
 */
export function logPrismaOrServerError(scope: string, e: unknown): void {
  const ts = new Date().toISOString();
  const prefix = `[${ts}] [${scope}]`;

  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    console.error(prefix, "PrismaClientKnownRequestError", {
      code: e.code,
      message: e.message,
      meta: e.meta,
    });
    return;
  }
  if (e instanceof Prisma.PrismaClientValidationError) {
    console.error(prefix, "Prisma validation:", e.message);
    return;
  }
  if (e instanceof Prisma.PrismaClientInitializationError) {
    console.error(prefix, "Prisma init (checar DATABASE_URL / SSL / rede):", e.message);
    return;
  }
  if (e instanceof Error) {
    console.error(prefix, e.message);
    if (e.stack) console.error(e.stack);
    return;
  }
  console.error(prefix, e);
}
