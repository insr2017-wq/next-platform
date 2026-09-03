function normalizeStatus(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toUpperCase()
    .trim();
}

export function mapGatewayWithdrawStatus(
  provider: string | null | undefined
): "processing" | "processed" | "failed" {
  const s = normalizeStatus(provider ?? "");
  if (!s) return "processing";

  if (
    s === "FAILED" ||
    s === "FALHA" ||
    s === "CANCELED" ||
    s === "CANCELLED" ||
    s === "CANCELADO" ||
    s === "REJECTED" ||
    s === "RECUSADO" ||
    s === "ERROR" ||
    s === "DENIED" ||
    s === "NEGADO" ||
    s.includes("FALH") ||
    s.includes("NEGAD") ||
    s.includes("RECUS") ||
    s.includes("CANCEL")
  ) {
    return "failed";
  }

  if (
    s === "COMPLETED" ||
    s === "COMPLETO" ||
    s === "COMPLETE" ||
    s === "SUCCESS" ||
    s === "PAID" ||
    s === "PROCESSED" ||
    s.includes("COMPLET") ||
    s.includes("CONCLU")
  ) {
    return "processed";
  }

  return "processing";
}

export function mapGatewayDepositStatus(
  provider: string | null | undefined
): "pending" | "completed" | "failed" {
  const s = normalizeStatus(provider ?? "");
  if (
    s === "FAILED" ||
    s === "FALHA" ||
    s === "CANCELED" ||
    s === "CANCELLED" ||
    s.includes("FALH")
  ) {
    return "failed";
  }
  if (
    s === "COMPLETED" ||
    s === "COMPLETO" ||
    s === "COMPLETE" ||
    s === "PAID" ||
    s === "SUCCESS" ||
    s.includes("COMPLET") ||
    s.includes("PAGO") ||
    s.includes("PAID")
  ) {
    return "completed";
  }
  return "pending";
}

export function toNormalizedWebhookStatus(
  provider: string | null | undefined
): "pending" | "completed" | "failed" | "queued" {
  const s = normalizeStatus(provider ?? "");
  if (s === "QUEUED" || s === "FILA") return "queued";
  const deposit = mapGatewayDepositStatus(s);
  if (deposit === "completed") return "completed";
  if (deposit === "failed") return "failed";
  const withdraw = mapGatewayWithdrawStatus(s);
  if (withdraw === "processed") return "completed";
  if (withdraw === "failed") return "failed";
  return "pending";
}
