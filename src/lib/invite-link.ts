import { canonicalizePublicOrigin } from "@/lib/site-origin";

/**
 * Geração do link individual de convite.
 *
 * Regras:
 * - usa NEXT_PUBLIC_BASE_URL / NEXT_PUBLIC_APP_URL / APP_URL quando configurado
 * - caso contrário, usa a `origin` atual (dev/local)
 * - `www` é normalizado para o domínio raiz
 */
export function getPublicBaseUrl(): string {
  const env =
    process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    "";
  const trimmed = env.replace(/\/+$/, "");
  if (trimmed) {
    try {
      return canonicalizePublicOrigin(new URL(trimmed).origin);
    } catch {
      return canonicalizePublicOrigin(trimmed);
    }
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return canonicalizePublicOrigin(window.location.origin);
  }

  return "http://localhost:3000";
}

export function buildInviteLink(inviteCode: string): string {
  const code = (inviteCode ?? "").trim();
  const base = getPublicBaseUrl();
  return `${base}/register?invite=${encodeURIComponent(code)}`;
}

