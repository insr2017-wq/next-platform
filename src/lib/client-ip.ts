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

const USER_IP_PREFIX = "user_ip:";

/** Lê IP gravado em `Withdrawal.externalReference` na solicitação (`user_ip:…`). */
export function parseUserIpFromWithdrawalExternalReference(ref: string | null | undefined): string | null {
  if (!ref || !ref.startsWith(USER_IP_PREFIX)) return null;
  const ip = ref.slice(USER_IP_PREFIX.length).trim();
  return ip.length > 0 ? ip : null;
}

/** Persiste o IP do solicitante sem coluna extra no banco (compatível com DB sem migration). */
export function formatWithdrawalExternalReferenceForRequesterIp(ip: string | null | undefined): string | null {
  const t = ip?.trim();
  if (!t) return null;
  return `${USER_IP_PREFIX}${t}`;
}
