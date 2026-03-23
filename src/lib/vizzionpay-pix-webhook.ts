import { prisma } from "@/lib/db";
import { markDepositPaid } from "@/lib/payment-service";
import { logVizzionPayPixError, logVizzionPayPixEvent, logVizzionPayPixWarn, truncateForLog } from "@/lib/vizzionpay-pix-log";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function pickString(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function collectDepositIdCandidates(json: unknown, out: Set<string>): void {
  if (!isRecord(json)) return;
  for (const k of ["identifier", "depositId", "deposit_id", "externalReference", "external_reference", "reference"]) {
    const v = json[k];
    if (typeof v === "string" && v.length >= 20) out.add(v);
  }
  const meta = json.metadata;
  if (isRecord(meta)) {
    const d = pickString(meta, ["depositId", "deposit_id", "id"]);
    if (d && d.length >= 20) out.add(d);
  }
  const data = json.data;
  if (isRecord(data)) {
    collectDepositIdCandidates(data, out);
    const order = data.order;
    if (isRecord(order)) collectDepositIdCandidates(order, out);
    const payment = data.payment;
    if (isRecord(payment)) collectDepositIdCandidates(payment, out);
  }
}

function extractGatewayTransactionId(json: unknown): string | null {
  if (!isRecord(json)) return null;
  const direct =
    pickString(json, ["transactionId", "transaction_id", "gatewayTransactionId", "id"]) ??
    (isRecord(json.data) ? pickString(json.data, ["transactionId", "transaction_id", "id"]) : null);
  return direct;
}

function deepPaidStatus(obj: unknown, depth = 0): boolean {
  if (depth > 8 || !isRecord(obj)) return false;
  for (const [k, v] of Object.entries(obj)) {
    if (
      (k === "status" || k === "paymentStatus" || k === "payment_status") &&
      typeof v === "string" &&
      /paid|pago|approved|completed|confirmed|aprovado|success|paid_out/i.test(v)
    ) {
      return true;
    }
    if (k === "paid" && v === true) return true;
    if (typeof v === "object" && v !== null && deepPaidStatus(v, depth + 1)) return true;
  }
  return false;
}

function detectPaid(json: unknown): boolean {
  if (!isRecord(json)) return false;
  if (json.paid === true) return true;
  if (json.success === true && deepPaidStatus(json)) return true;
  const status =
    pickString(json, ["status", "paymentStatus", "payment_status", "state", "event"]) ??
    (isRecord(json.data) ? pickString(json.data, ["status", "paymentStatus", "payment_status", "state"]) : null);
  if (status && /paid|pago|approved|completed|confirmed|aprovado|success/i.test(status)) return true;
  if (isRecord(json.data) && json.data.paid === true) return true;
  if (deepPaidStatus(json)) return true;
  return false;
}

async function resolveDepositId(json: unknown): Promise<string | null> {
  const candidates = new Set<string>();
  collectDepositIdCandidates(json, candidates);

  for (const id of candidates) {
    const row = await prisma.deposit.findUnique({
      where: { id },
      select: { id: true, status: true, gatewayProvider: true },
    });
    if (row && row.gatewayProvider === "vizzionpay") return row.id;
    if (row) return row.id;
  }

  const txnId = extractGatewayTransactionId(json);
  if (txnId) {
    const row = await prisma.deposit.findFirst({
      where: { gatewayTransactionId: txnId, gatewayProvider: "vizzionpay" },
      select: { id: true },
    });
    if (row) return row.id;
  }

  return null;
}

/** Processa confirmação de Pix (chamado após responder 200 ao gateway). */
export async function processVizzionPayPixWebhook(json: unknown): Promise<void> {
  logVizzionPayPixEvent("webhook_pix_received", {
    bodyPreview: truncateForLog(JSON.stringify(json), 6_000),
  });

  const depositId = await resolveDepositId(json);
  if (!depositId) {
    logVizzionPayPixWarn("webhook_pix_deposit_not_resolved", {
      hint: "Confira se o payload traz identifier/metadata.depositId ou transactionId salvo no depósito.",
    });
    return;
  }

  if (!detectPaid(json)) {
    logVizzionPayPixEvent("webhook_pix_ignored_not_paid", { depositId });
    return;
  }

  try {
    await markDepositPaid({
      depositId,
      gatewayProvider: "vizzionpay",
      gatewayTransactionId: extractGatewayTransactionId(json) ?? undefined,
    });
    logVizzionPayPixEvent("webhook_pix_deposit_marked_paid", { depositId });
  } catch (e) {
    logVizzionPayPixError("webhook_pix_mark_paid_failed", {
      depositId,
      message: e instanceof Error ? e.message : String(e),
    });
  }
}
