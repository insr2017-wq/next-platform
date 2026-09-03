/**
 * Host canônico do site. `www` redireciona para este (exceto webhooks).
 */
export const CANONICAL_SITE_HOST = "xbot0.xyz";
export const WWW_SITE_HOST = `www.${CANONICAL_SITE_HOST}`;
export const CANONICAL_SITE_ORIGIN = `https://${CANONICAL_SITE_HOST}`;
export const WWW_SITE_ORIGIN = `https://${WWW_SITE_HOST}`;

function hostnameOf(value: string): string {
  return value.split(":")[0]?.trim().toLowerCase() ?? "";
}

export function stripWwwHostname(hostname: string): string {
  const host = hostnameOf(hostname);
  return host.startsWith("www.") ? host.slice(4) : host;
}

/** Origem pública canônica (sem www) para links de convite e callbacks. */
export function canonicalizePublicOrigin(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (!trimmed) return trimmed;
  try {
    const u = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    const host = stripWwwHostname(u.hostname);
    if (host === CANONICAL_SITE_HOST) {
      return CANONICAL_SITE_ORIGIN;
    }
    return u.origin;
  } catch {
    return trimmed;
  }
}

function addOriginAndWwwTwin(set: Set<string>, origin: string) {
  try {
    const u = new URL(origin);
    set.add(u.origin);
    const host = u.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1") return;
    if (host.startsWith("www.")) {
      const apex = new URL(u.origin);
      apex.hostname = host.slice(4);
      set.add(apex.origin);
    } else {
      const www = new URL(u.origin);
      www.hostname = `www.${host}`;
      set.add(www.origin);
    }
  } catch {
    // ignore
  }
}

/** Origens de browser aceitas no CORS (apex + www + env + localhost em dev). */
export function getAllowedBrowserOrigins(): string[] {
  const set = new Set<string>([CANONICAL_SITE_ORIGIN, WWW_SITE_ORIGIN]);
  for (const key of ["NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_BASE_URL", "NEXT_PUBLIC_APP_BASE_URL"] as const) {
    const value = process.env[key]?.trim();
    if (value) addOriginAndWwwTwin(set, value);
  }
  if (process.env.NODE_ENV !== "production") {
    set.add("http://localhost:3000");
    set.add("http://localhost:3001");
    set.add("http://127.0.0.1:3000");
    set.add("http://127.0.0.1:3001");
  }
  return [...set];
}

export function isAllowedBrowserOrigin(origin: string | null): origin is string {
  if (!origin) return false;
  return getAllowedBrowserOrigins().includes(origin);
}

export function isWwwSiteHost(hostname: string): boolean {
  return hostnameOf(hostname) === WWW_SITE_HOST;
}

export function isWebhookPath(pathname: string): boolean {
  return pathname === "/webhooks" || pathname.startsWith("/webhooks/") || pathname.startsWith("/api/webhooks/");
}
