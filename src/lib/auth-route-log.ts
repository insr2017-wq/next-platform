/**
 * Logs de diagnóstico para rotas de auth (Vercel / produção).
 * Nunca registrar senha ou hash.
 */

export function authRouteLog(
  route: string,
  message: string,
  data?: Record<string, unknown>
): void {
  const ts = new Date().toISOString();
  const extra = data && Object.keys(data).length ? JSON.stringify(data) : "";
  console.info(`[${ts}] [${route}] ${message}`, extra);
}

/** Resumo do body de cadastro sem dados sensíveis. */
export function summarizeRegisterBody(body: unknown): Record<string, unknown> {
  const b = (body ?? {}) as Record<string, unknown>;
  const phone = typeof b.phone === "string" ? b.phone : "";
  const digits = phone.replace(/\D/g, "");
  return {
    hasPhone: digits.length > 0,
    phoneDigitsLen: digits.length,
    hasPassword: typeof b.password === "string" && b.password.length > 0,
    passwordsMatch:
      typeof b.password === "string" && typeof b.confirmPassword === "string"
        ? b.password === b.confirmPassword
        : null,
    inviteCodePresent: typeof b.inviteCode === "string" && b.inviteCode.trim().length > 0,
    fullNameLen: typeof b.fullName === "string" ? b.fullName.trim().length : 0,
  };
}

/** Resumo do body de login (sem segredos). */
export function summarizeLoginBody(body: unknown): Record<string, unknown> {
  const b = (body ?? {}) as Record<string, unknown>;
  const phone = typeof b.phone === "string" ? b.phone : "";
  const digits = phone.replace(/\D/g, "");
  return {
    hasPhone: digits.length > 0,
    phoneDigitsLen: digits.length,
    hasPassword: typeof b.password === "string" && b.password.length > 0,
  };
}
