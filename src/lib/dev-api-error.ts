/** Detalhe de erro só em desenvolvimento (nunca expor stack em produção). */
export function devErrorDetail(e: unknown): string | undefined {
  if (process.env.NODE_ENV !== "development") return undefined;
  if (e instanceof Error) return e.message;
  return String(e);
}

export function logDevApiError(scope: string, e: unknown): void {
  if (process.env.NODE_ENV === "development") {
    console.error(`[API ${scope}]`, e);
  }
}
