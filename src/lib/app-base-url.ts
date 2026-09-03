import { canonicalizePublicOrigin } from "@/lib/site-origin";

/**
 * URL base pública da aplicação (callbacks, links absolutos).
 * Preferência: NEXT_PUBLIC_APP_URL → APP_URL → VERCEL_URL (com https).
 * `www.xbot0.xyz` é normalizado para `https://xbot0.xyz`.
 */
export function getAppBaseUrl(): string {
  const explicit =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.APP_URL?.trim() || "";
  if (explicit) {
    try {
      return canonicalizePublicOrigin(new URL(explicit).origin);
    } catch {
      // continua
    }
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.startsWith("http") ? vercel : `https://${vercel}`;
    try {
      return canonicalizePublicOrigin(new URL(host).origin);
    } catch {
      // continua
    }
  }
  return "http://localhost:3000";
}
