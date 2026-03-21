/**
 * Geração do link individual de convite.
 *
 * Regras:
 * - usa `NEXT_PUBLIC_BASE_URL` quando configurado (sem "fixar" domínio no código)
 * - caso contrário, usa a `origin` atual (dev/local)
 */
export function getPublicBaseUrl(): string {
  const env =
    (process.env.NEXT_PUBLIC_BASE_URL as string | undefined) ??
    (process.env.NEXT_PUBLIC_APP_BASE_URL as string | undefined);
  const trimmed = (env ?? "").trim().replace(/\/+$/, "");
  if (trimmed) return trimmed;

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  return "http://localhost:3000";
}

export function buildInviteLink(inviteCode: string): string {
  const code = (inviteCode ?? "").trim();
  const base = getPublicBaseUrl();
  return `${base}/register?invite=${encodeURIComponent(code)}`;
}

