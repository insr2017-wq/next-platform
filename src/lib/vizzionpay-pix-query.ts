import { getVizzionPayConfig } from "@/lib/vizzionpay-config";
import { detectVizzionPayPixPaidPayload } from "@/lib/vizzionpay-pix-paid-detect";
import { logVizzionPayPixEvent, truncateForLog } from "@/lib/vizzionpay-pix-log";

const BASE = "https://app.vizzionpay.com.br/api/v1/gateway/pix";

/**
 * Consulta status do Pix no gateway (várias URLs comuns; override via `VIZZIONPAY_PIX_QUERY_URL` com
 * `{identifier}`, `{gatewayTransactionId}`, `{gatewayRef}` (tx ou order salvo em gatewayTransactionId).
 */
export async function fetchVizzionPayPixStatusByDeposit(params: {
  depositId: string;
  gatewayTransactionId: string | null;
}): Promise<{ json: unknown; httpStatus: number; url: string } | null> {
  const cfg = await getVizzionPayConfig();
  if (!cfg) return null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-public-key": cfg.publicKey,
    "x-secret-key": cfg.secretKey,
  };

  const urls: string[] = [];
  const gatewayRef = params.gatewayTransactionId?.trim() || null;

  const envTpl = process.env.VIZZIONPAY_PIX_QUERY_URL?.trim();
  if (envTpl) {
    urls.push(
      envTpl
        .replace(/\{identifier\}/g, encodeURIComponent(params.depositId))
        .replace(/\{gatewayTransactionId\}/g, encodeURIComponent(params.gatewayTransactionId ?? ""))
        .replace(/\{gatewayRef\}/g, encodeURIComponent(gatewayRef ?? ""))
    );
  }
  urls.push(
    `${BASE}/receive/status?identifier=${encodeURIComponent(params.depositId)}`,
    `${BASE}/receive/${encodeURIComponent(params.depositId)}`,
    `${BASE}/receive?identifier=${encodeURIComponent(params.depositId)}`
  );
  if (gatewayRef) {
    urls.push(
      `${BASE}/transaction/${encodeURIComponent(gatewayRef)}`,
      `${BASE}/transactions/${encodeURIComponent(gatewayRef)}`
    );
  }

  let lastOk: { json: unknown; httpStatus: number; url: string } | null = null;

  for (const url of urls) {
    if (!url || url.includes("undefined")) continue;
    try {
      const res = await fetch(url, { method: "GET", headers, cache: "no-store" });
      const text = await res.text();
      let json: unknown = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = null;
      }
      logVizzionPayPixEvent("pix_status_query_get", {
        url,
        httpStatus: res.status,
        bodyPreview: truncateForLog(text, 1_500),
      });
      if (json !== null && res.ok) {
        if (detectVizzionPayPixPaidPayload(json)) {
          return { json, httpStatus: res.status, url };
        }
        lastOk = { json, httpStatus: res.status, url };
      }
    } catch {
      // tenta próxima URL
    }
  }
  
  return lastOk;
}
