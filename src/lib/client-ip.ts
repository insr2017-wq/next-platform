/**
 * IP do cliente em requisições HTTP (proxies / CDN).
 * Não usar como única camada de segurança.
 */
export function getClientIpFromHeaders(headers: Headers): string | null {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const cf = headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf;
  const trueClient = headers.get("true-client-ip")?.trim();
  if (trueClient) return trueClient;
  return null;
}

/** Fallback quando o IP não pôde ser determinado (provedor costuma exigir string IPv4). */
export const FALLBACK_CLIENT_IP = "0.0.0.0";
