/**
 * Supabase "Transaction pooler" (porta 6543 / host pooler.supabase.com) usa PgBouncer.
 * Sem `pgbouncer=true`, o Prisma/pg costuma falhar com prepared statements / conexão intermitente.
 * @see https://www.prisma.io/docs/orm/overview/databases/supabase
 */
export function normalizePostgresUrlForPrisma(connectionString: string): string {
  const s = connectionString.trim();
  if (!s || s.startsWith("file:")) return s;

  const lower = s.toLowerCase();
  const looksLikeSupabasePooler =
    lower.includes("pooler.supabase.com") ||
    /:6543([/?]|$)/.test(s) ||
    (lower.includes("supabase") && /:6543/.test(s));

  if (!looksLikeSupabasePooler) return s;
  if (/[?&]pgbouncer=true(?:&|$)/.test(s)) return s;

  return s.includes("?") ? `${s}&pgbouncer=true` : `${s}?pgbouncer=true`;
}
