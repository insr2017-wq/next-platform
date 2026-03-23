import { prisma } from "@/lib/db";
import { markDepositPaid } from "@/lib/payment-service";
import { detectVizzionPayPixPaidPayload } from "@/lib/vizzionpay-pix-paid-detect";
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

function pickStringLoose(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

/** Metadata pode vir como objeto ou string JSON (gateways comuns). */
function parseMetadataRecord(raw: unknown): Record<string, unknown> | null {
  if (isRecord(raw)) return raw;
  if (typeof raw === "string" && raw.trim()) {
    try {
      const p = JSON.parse(raw) as unknown;
      return isRecord(p) ? p : null;
    } catch {
      return null;
    }
  }
  return null;
}

function layersFromPayload(json: unknown): Record<string, unknown>[] {
  if (!isRecord(json)) return [];
  const out: Record<string, unknown>[] = [json];
  if (isRecord(json.data)) out.push(json.data);
  if (isRecord(json.payload)) out.push(json.payload);
  if (isRecord(json.data) && isRecord(json.data.body)) out.push(json.data.body);
  if (isRecord(json.event)) {
    out.push(json.event);
    if (isRecord(json.event.data)) out.push(json.event.data);
  }
  if (isRecord(json.object)) out.push(json.object);
  if (isRecord(json.resource)) out.push(json.resource);
  if (isRecord(json.result)) out.push(json.result);
  if (isRecord(json.payment)) out.push(json.payment);
  if (isRecord(json.transaction)) out.push(json.transaction);
  return out;
}

/** Campos que a documentação / fluxo pedem para casar o webhook ao depósito. */
export type VizzionPayWebhookCanonical = {
  metadataDepositId: string | null;
  identifier: string | null;
  transactionId: string | null;
  orderId: string | null;
  paidAt: Date | null;
};

function findDepositIdInMetadataTree(meta: Record<string, unknown>, depth = 0): string | null {
  if (depth > 5) return null;
  for (const k of ["depositId", "deposit_id", "depositID", "internalDepositId", "internal_deposit_id"]) {
    const v = pickStringLoose(meta[k]);
    if (v) return v;
  }
  for (const v of Object.values(meta)) {
    if (isRecord(v)) {
      const inner = findDepositIdInMetadataTree(v, depth + 1);
      if (inner) return inner;
    }
  }
  return null;
}

function extractMetadataDepositId(json: unknown): string | null {
  for (const layer of layersFromPayload(json)) {
    const meta = parseMetadataRecord(layer.metadata);
    if (!meta) continue;
    const direct =
      pickStringLoose(meta.depositId) ??
      pickStringLoose(meta.deposit_id) ??
      pickStringLoose(meta.depositID);
    if (direct) return direct;
    const nested = findDepositIdInMetadataTree(meta);
    if (nested) return nested;
  }
  return null;
}

function extractIdentifierField(json: unknown): string | null {
  const keys = [
    "identifier",
    "external_reference",
    "externalReference",
    "merchant_reference",
    "merchantReference",
    "integration_reference",
    "reference",
  ];
  for (const layer of layersFromPayload(json)) {
    const v = pickString(layer, keys);
    if (v) return v;
  }
  return null;
}

function extractTransactionIdField(json: unknown): string | null {
  const keys = ["transactionId", "transaction_id", "gatewayTransactionId", "gateway_transaction_id"];
  for (const layer of layersFromPayload(json)) {
    const t = pickString(layer, keys);
    if (t) return t;
    if (isRecord(layer.payment)) {
      const p = pickString(layer.payment, [...keys, "id"]);
      if (p) return p;
    }
  }
  return null;
}

function extractOrderIdField(json: unknown): string | null {
  for (const layer of layersFromPayload(json)) {
    const o = pickString(layer, ["orderId", "order_id"]);
    if (o) return o;
    if (isRecord(layer.order)) {
      const id = pickString(layer.order, ["id"]);
      if (id) return id;
    }
    if (isRecord(layer.payment) && isRecord(layer.payment.order)) {
      const id = pickString(layer.payment.order, ["id"]);
      if (id) return id;
    }
  }
  return null;
}

function extractPaidAtField(json: unknown): Date | null {
  const keys = ["paidAt", "paid_at", "confirmedAt", "confirmed_at", "paidDate", "paid_date"];
  for (const layer of layersFromPayload(json)) {
    const s = pickString(layer, keys);
    if (s) {
      const ms = Date.parse(s);
      if (Number.isFinite(ms)) return new Date(ms);
    }
  }
  return null;
}

export function extractVizzionPayWebhookCanonical(json: unknown): VizzionPayWebhookCanonical {
  return {
    metadataDepositId: extractMetadataDepositId(json),
    identifier: extractIdentifierField(json),
    transactionId: extractTransactionIdField(json),
    orderId: extractOrderIdField(json),
    paidAt: extractPaidAtField(json),
  };
}

const KNOWN_ID_KEYS = [
  "identifier",
  "depositId",
  "deposit_id",
  "externalReference",
  "external_reference",
  "externalId",
  "external_id",
  "reference",
  "referenceId",
  "reference_id",
  "orderId",
  "order_id",
  "paymentId",
  "payment_id",
  "chargeId",
  "charge_id",
  "merchant_reference",
  "integration_id",
  "custom_id",
];

function looksLikePrismaCuid(s: string): boolean {
  const t = s.trim();
  return t.length >= 20 && t.length <= 36 && /^c[a-z0-9]{8,}$/i.test(t);
}

function collectKnownIdKeysDeep(obj: unknown, out: Set<string>, depth = 0): void {
  if (depth > 12 || !isRecord(obj)) return;
  for (const k of KNOWN_ID_KEYS) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) out.add(v.trim());
    if (typeof v === "number" && Number.isFinite(v)) out.add(String(v));
  }
  const meta = parseMetadataRecord(obj.metadata);
  if (meta) {
    for (const k of KNOWN_ID_KEYS) {
      const v = meta[k];
      if (typeof v === "string" && v.trim()) out.add(v.trim());
      if (typeof v === "number" && Number.isFinite(v)) out.add(String(v));
    }
    for (const k of ["depositId", "deposit_id", "id", "identifier", "reference"]) {
      const v = meta[k];
      if (typeof v === "string" && v.trim()) out.add(v.trim());
      if (typeof v === "number" && Number.isFinite(v)) out.add(String(v));
    }
  }
  for (const v of Object.values(obj)) {
    if (isRecord(v)) collectKnownIdKeysDeep(v, out, depth + 1);
    else if (Array.isArray(v)) {
      for (const item of v) collectKnownIdKeysDeep(item, out, depth + 1);
    }
  }
}

function collectDepositIdCandidates(json: unknown, out: Set<string>): void {
  collectKnownIdKeysDeep(json, out);
}

function collectCuidLikeStringsDeep(obj: unknown, out: Set<string>, depth = 0): void {
  if (depth > 14) return;
  if (typeof obj === "string") {
    const t = obj.trim();
    if (looksLikePrismaCuid(t)) out.add(t);
    return;
  }
  if (Array.isArray(obj)) {
    for (const item of obj) collectCuidLikeStringsDeep(item, out, depth + 1);
    return;
  }
  if (!isRecord(obj)) return;
  for (const v of Object.values(obj)) collectCuidLikeStringsDeep(v, out, depth + 1);
}

const TXN_ID_KEYS = [
  "transactionId",
  "transaction_id",
  "gatewayTransactionId",
  "gateway_transaction_id",
  "payment_id",
  "order_id",
  "orderId",
  "uuid",
  "gateway_id",
  "gatewayId",
];

function collectTxnIdKeysDeep(obj: unknown, out: Set<string>, depth = 0): void {
  if (depth > 12 || !isRecord(obj)) return;
  for (const k of TXN_ID_KEYS) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) out.add(v.trim());
    if (typeof v === "number" && Number.isFinite(v)) out.add(String(v));
  }
  for (const v of Object.values(obj)) {
    if (isRecord(v)) collectTxnIdKeysDeep(v, out, depth + 1);
    else if (Array.isArray(v)) {
      for (const item of v) collectTxnIdKeysDeep(item, out, depth + 1);
    }
  }
}

function collectTxnRootishId(json: unknown, out: Set<string>): void {
  const blocks: unknown[] = [json];
  if (isRecord(json)) {
    const d = json.data;
    if (isRecord(d)) {
      blocks.push(d);
      if (isRecord(d.payment)) blocks.push(d.payment);
      if (isRecord(d.order)) blocks.push(d.order);
      if (isRecord(d.pix)) blocks.push(d.pix);
    }
  }
  for (const b of blocks) {
    if (!isRecord(b)) continue;
    const v = b.id;
    if (typeof v === "string" && v.trim()) out.add(v.trim());
    if (typeof v === "number" && Number.isFinite(v)) out.add(String(v));
  }
}

function collectTransactionIdCandidates(json: unknown, out: Set<string>): void {
  collectTxnIdKeysDeep(json, out);
  collectTxnRootishId(json, out);
}

function extractGatewayTransactionIdFallback(json: unknown): string | null {
  const s = new Set<string>();
  collectTransactionIdCandidates(json, s);
  return [...s][0] ?? null;
}

const PIX_EMV_KEYS = ["code", "copyPaste", "copy_paste", "emv", "payload", "pixCode", "pix_code"];

function looksLikeBrPixCopyPaste(s: string): boolean {
  const t = s.trim();
  if (t.length < 32) return false;
  return t.startsWith("000201") || /^[0-9A-Za-z+/=]{50,}$/.test(t);
}

/** Código copia-e-cola Pix (EMV) — igual ao salvo em `Deposit.pixCode`. */
function extractPixCopyPasteDeep(obj: unknown, depth = 0): string | null {
  if (depth > 16) return null;
  if (typeof obj === "string") {
    const t = obj.trim();
    return looksLikeBrPixCopyPaste(t) ? t : null;
  }
  if (!isRecord(obj)) return null;
  for (const k of PIX_EMV_KEYS) {
    const v = obj[k];
    if (typeof v === "string" && looksLikeBrPixCopyPaste(v)) return v.trim();
  }
  if (isRecord(obj.pix)) {
    const inner = extractPixCopyPasteDeep(obj.pix, depth + 1);
    if (inner) return inner;
  }
  for (const v of Object.values(obj)) {
    if (isRecord(v)) {
      const inner = extractPixCopyPasteDeep(v, depth + 1);
      if (inner) return inner;
    } else if (Array.isArray(v)) {
      for (const item of v) {
        const inner = extractPixCopyPasteDeep(item, depth + 1);
        if (inner) return inner;
      }
    }
  }
  return null;
}

/**
 * Alguns gateways enviam o JSON como string, ou o payload útil em `body` string,
 * ou uma lista de eventos — normaliza para um objeto antes de extrair campos.
 */
export function normalizeVizzionPayWebhookPayload(raw: unknown): unknown {
  let v = raw;
  if (typeof v === "string" && v.trim()) {
    try {
      v = JSON.parse(v) as unknown;
    } catch {
      return raw;
    }
  }
  if (Array.isArray(v) && v.length > 0) {
    return normalizeVizzionPayWebhookPayload(v[0]);
  }
  if (!isRecord(v)) return v;
  if (typeof v.body === "string" && v.body.trim()) {
    try {
      const inner = JSON.parse(v.body) as unknown;
      if (isRecord(inner)) return inner;
    } catch {
      // ignore
    }
  }
  return v;
}

type ResolveResult = {
  depositId: string;
  resolvedBy: string;
};

async function resolveDepositFromWebhook(
  canonical: VizzionPayWebhookCanonical,
  json: unknown
): Promise<ResolveResult | null> {
  const idCandidates: string[] = [];
  const pushId = (label: string, v: string | null | undefined) => {
    const t = v?.trim();
    if (!t) return;
    idCandidates.push(t);
  };

  pushId("metadata.depositId", canonical.metadataDepositId);
  pushId("identifier", canonical.identifier);

  const scanned = new Set<string>();
  collectDepositIdCandidates(json, scanned);
  collectCuidLikeStringsDeep(json, scanned);
  for (const s of scanned) {
    if (!idCandidates.includes(s)) idCandidates.push(s);
  }

  const seenId = new Set<string>();
  for (const id of idCandidates) {
    if (seenId.has(id)) continue;
    seenId.add(id);
    const fromCanonical = id === canonical.metadataDepositId || id === canonical.identifier;
    if (!fromCanonical && !looksLikePrismaCuid(id)) {
      logVizzionPayPixEvent("webhook_pix_lookup_skip", {
        step: "deposit.findUnique",
        reason: "skipped_non_cuid_scan",
        value: id,
      });
      continue;
    }
    const row = await prisma.deposit.findUnique({
      where: { id },
      select: { id: true },
    });
    if (row) {
      logVizzionPayPixEvent("webhook_pix_deposit_resolved", {
        depositId: row.id,
        resolvedBy: "deposit.id",
        matchedValue: id,
      });
      return { depositId: row.id, resolvedBy: "deposit.id" };
    }
    logVizzionPayPixEvent("webhook_pix_lookup_no_match", {
      step: "deposit.findUnique",
      field: "id",
      value: id,
    });
  }

  const txnRefs: string[] = [];
  const pushTxn = (label: string, v: string | null | undefined) => {
    const t = v?.trim();
    if (!t) return;
    txnRefs.push(t);
  };

  pushTxn("extracted.transactionId", canonical.transactionId);
  pushTxn("extracted.orderId", canonical.orderId);

  const scannedTxn = new Set<string>();
  collectTransactionIdCandidates(json, scannedTxn);
  for (const s of scannedTxn) {
    if (!txnRefs.includes(s)) txnRefs.push(s);
  }

  const seenRef = new Set<string>();
  for (const ref of txnRefs) {
    if (seenRef.has(ref)) continue;
    seenRef.add(ref);

    const byTx = await prisma.deposit.findFirst({
      where: { gatewayProvider: "vizzionpay", gatewayTransactionId: ref },
      select: { id: true },
    });
    if (byTx) {
      logVizzionPayPixEvent("webhook_pix_deposit_resolved", {
        depositId: byTx.id,
        resolvedBy: "gatewayTransactionId",
        matchedValue: ref,
      });
      return { depositId: byTx.id, resolvedBy: "gatewayTransactionId" };
    }
    logVizzionPayPixEvent("webhook_pix_lookup_no_match", {
      step: "deposit.findFirst",
      field: "gatewayTransactionId",
      value: ref,
    });

    const byOrd = await prisma.deposit.findFirst({
      where: { gatewayProvider: "vizzionpay", gatewayOrderId: ref },
      select: { id: true },
    });
    if (byOrd) {
      logVizzionPayPixEvent("webhook_pix_deposit_resolved", {
        depositId: byOrd.id,
        resolvedBy: "gatewayOrderId",
        matchedValue: ref,
      });
      return { depositId: byOrd.id, resolvedBy: "gatewayOrderId" };
    }
    logVizzionPayPixEvent("webhook_pix_lookup_no_match", {
      step: "deposit.findFirst",
      field: "gatewayOrderId",
      value: ref,
    });

    const byExt = await prisma.deposit.findFirst({
      where: { gatewayProvider: "vizzionpay", externalReference: ref },
      select: { id: true },
    });
    if (byExt) {
      logVizzionPayPixEvent("webhook_pix_deposit_resolved", {
        depositId: byExt.id,
        resolvedBy: "externalReference",
        matchedValue: ref,
      });
      return { depositId: byExt.id, resolvedBy: "externalReference" };
    }
    logVizzionPayPixEvent("webhook_pix_lookup_no_match", {
      step: "deposit.findFirst",
      field: "externalReference",
      value: ref,
    });
  }

  const pixCopy = extractPixCopyPasteDeep(json);
  if (pixCopy) {
    const byPix = await prisma.deposit.findFirst({
      where: {
        gatewayProvider: "vizzionpay",
        status: "pending",
        pixCode: pixCopy,
      },
      select: { id: true },
    });
    if (byPix) {
      logVizzionPayPixEvent("webhook_pix_deposit_resolved", {
        depositId: byPix.id,
        resolvedBy: "pixCode",
        pixCodeLength: pixCopy.length,
      });
      return { depositId: byPix.id, resolvedBy: "pixCode" };
    }
    logVizzionPayPixEvent("webhook_pix_lookup_no_match", {
      step: "deposit.findFirst",
      field: "pixCode",
      pixCodeLength: pixCopy.length,
    });
  }

  return null;
}

/** Processa confirmação de Pix (chamado após responder 200 ao gateway). */
export async function processVizzionPayPixWebhook(json: unknown): Promise<void> {
  logVizzionPayPixEvent("webhook_pix_received", {
    bodyPreview: truncateForLog(JSON.stringify(json), 6_000),
  });

  const normalized = normalizeVizzionPayWebhookPayload(json);
  if (normalized !== json) {
    logVizzionPayPixEvent("webhook_pix_payload_normalized", {
      preview: truncateForLog(JSON.stringify(normalized), 2_000),
    });
  }

  const canonical = extractVizzionPayWebhookCanonical(normalized);

  logVizzionPayPixEvent("webhook_pix_fields_extracted", {
    metadataDepositId: canonical.metadataDepositId,
    identifier: canonical.identifier,
    transactionId: canonical.transactionId,
    orderId: canonical.orderId,
    paidAt: canonical.paidAt?.toISOString() ?? null,
  });

  const resolved = await resolveDepositFromWebhook(canonical, normalized);

  if (!resolved) {
    const root = isRecord(normalized) ? normalized : null;
    const debugCandidates = new Set<string>();
    collectDepositIdCandidates(normalized, debugCandidates);
    collectCuidLikeStringsDeep(normalized, debugCandidates);
    const txnDbg = new Set<string>();
    collectTransactionIdCandidates(normalized, txnDbg);
    const pixLen = extractPixCopyPasteDeep(normalized)?.length ?? 0;
    logVizzionPayPixWarn("webhook_pix_deposit_not_resolved", {
      hint:
        "Confira se o payload traz identifier/metadata.depositId, ids do gateway, ou o mesmo código Pix (EMV) do depósito. Deploy deve incluir normalização de body string/array e lookup por pixCode.",
      extracted: {
        metadataDepositId: canonical.metadataDepositId,
        identifier: canonical.identifier,
        transactionId: canonical.transactionId,
        orderId: canonical.orderId,
      },
      rootKeys: root ? Object.keys(root).slice(0, 40) : [],
      payloadType: Array.isArray(json) ? "array" : typeof json,
      cuidCandidates: [...debugCandidates].slice(0, 15),
      txnCandidates: [...txnDbg].slice(0, 15),
      pixCodeDetectedLength: pixLen,
    });
    return;
  }

  if (!detectVizzionPayPixPaidPayload(normalized)) {
    logVizzionPayPixEvent("webhook_pix_ignored_not_paid", {
      depositId: resolved.depositId,
      resolvedBy: resolved.resolvedBy,
    });
    return;
  }

  const gatewayTransactionId =
    canonical.transactionId ?? extractGatewayTransactionIdFallback(normalized) ?? undefined;
  const gatewayOrderId = canonical.orderId ?? undefined;

  try {
    await markDepositPaid({
      depositId: resolved.depositId,
      gatewayProvider: "vizzionpay",
      gatewayTransactionId,
      gatewayOrderId,
      paidAt: canonical.paidAt ?? new Date(),
    });
    logVizzionPayPixEvent("webhook_pix_deposit_marked_paid", {
      depositId: resolved.depositId,
      resolvedBy: resolved.resolvedBy,
      gatewayTransactionId: gatewayTransactionId ?? null,
      gatewayOrderId: gatewayOrderId ?? null,
    });
  } catch (e) {
    logVizzionPayPixError("webhook_pix_mark_paid_failed", {
      depositId: resolved.depositId,
      message: e instanceof Error ? e.message : String(e),
    });
  }
}
