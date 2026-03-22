import { prisma } from "@/lib/db";
import { getPlatformSettings } from "@/lib/platform-settings";
import { getAppBaseUrl } from "@/lib/app-base-url";
import { getVizzionPayConfig } from "@/lib/vizzionpay-config";
import {
  explainVizzionPayParseFailure,
  parseVizzionPayPixReceiveResponse,
  postVizzionPayPixReceive,
  VizzionPayPixApiError,
  type VizzionPayPixReceiveRequest,
} from "@/lib/vizzionpay-pix-api";
import {
  buildClientLogSnapshot,
  logVizzionPayPixError,
  logVizzionPayPixEvent,
  logVizzionPayPixWarn,
  truncateForLog,
} from "@/lib/vizzionpay-pix-log";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function onlyDigits(v: string): string {
  return v.replace(/\D/g, "");
}

function extractEmailHost(email: string): string {
  const i = email.lastIndexOf("@");
  return i >= 0 ? email.slice(i + 1) : "(sem @)";
}

/**
 * E-mail sintético para o gateway: a plataforma não possui campo de e-mail no cadastro.
 * Evita host `localhost` / IP (comum quando `NEXT_PUBLIC_APP_URL` não está definido em produção),
 * usando opcionalmente `VIZZIONPAY_CLIENT_EMAIL_DOMAIN` ou o host do `VERCEL_URL`.
 */
function buildSyntheticClientEmail(userId: string, _publicId: string | null): string {
  const envDomain = process.env.VIZZIONPAY_CLIENT_EMAIL_DOMAIN?.trim();
  if (envDomain) {
    const host = envDomain
      .replace(/^https?:\/\//i, "")
      .split("/")[0]
      ?.split(":")[0];
    if (host && host.includes(".")) {
      return `pix+${userId}@${host}`;
    }
  }
  const base = getAppBaseUrl();
  try {
    const host = new URL(base).hostname;
    if (host && host !== "localhost" && host !== "127.0.0.1" && host.includes(".")) {
      return `pix+${userId}@${host}`;
    }
  } catch {
    // ignore
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    try {
      const h = new URL(vercel.startsWith("http") ? vercel : `https://${vercel}`).hostname;
      if (h) return `pix+${userId}@${h}`;
    } catch {
      // ignore
    }
  }
  return `pix+${userId}@deposito.plataforma`;
}

/**
 * Resolve nome do pagador: nome completo ou titular do Pix (perfil).
 */
function resolveClientName(user: { fullName: string; holderName: string | null }): string {
  const a = user.fullName.trim();
  if (a) return a;
  const b = (user.holderName ?? "").trim();
  if (b) return b;
  return "Cliente";
}

type DocumentSource = "cpf11" | "phone_tail" | "phone_only" | "placeholder";

function resolveClientDocumentWithSource(user: {
  phone: string;
  holderCpf: string | null;
}): { document: string; source: DocumentSource } {
  const cpf = onlyDigits(user.holderCpf ?? "");
  if (cpf.length === 11) return { document: cpf, source: "cpf11" };
  const phoneDigits = onlyDigits(user.phone);
  if (phoneDigits.length >= 10) return { document: phoneDigits.slice(-11), source: "phone_tail" };
  if (phoneDigits.length > 0) return { document: phoneDigits, source: "phone_only" };
  return { document: "00000000000", source: "placeholder" };
}

export type CreateVizzionPayDepositResult = {
  depositId: string;
  identifier: string;
  gatewayTransactionId: string | null;
  orderId: string | null;
  gatewayStatus: string | null;
  pixCode: string;
  qrCodeImageRaw: string | null;
};

/**
 * Cria registro interno `pending`, chama a VizzionPay e persiste Pix/QR.
 * Não credita saldo (confirmação virá depois via webhook/callback).
 */
export async function createVizzionPayPixDeposit(
  userId: string,
  amountInput: number
): Promise<CreateVizzionPayDepositResult> {
  if (!getVizzionPayConfig()) {
    throw new Error("VIZZIONPAY_NOT_CONFIGURED");
  }

  const settings = await getPlatformSettings();
  const amount = round2(Number(amountInput));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("AMOUNT_INVALID");
  }
  if (amount < settings.minDeposit) {
    throw new Error("MIN_DEPOSIT_NOT_MET");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      banned: true,
      fullName: true,
      holderName: true,
      phone: true,
      holderCpf: true,
      publicId: true,
    },
  });

  if (!user) throw new Error("USER_NOT_FOUND");
  if (user.banned) throw new Error("USER_BANNED");

  const phoneDigits = onlyDigits(user.phone);
  const clientPhone = phoneDigits.length >= 10 ? phoneDigits : `55${phoneDigits}`.replace(/\D/g, "");
  if (clientPhone.replace(/\D/g, "").length < 10) {
    logVizzionPayPixWarn("client_phone_suspeito", {
      userId,
      phoneDigitsLength: phoneDigits.length,
      normalizedLength: clientPhone.replace(/\D/g, "").length,
      hint: "Gateway pode exigir telefone celular válido (BR) com DDD.",
    });
  }

  const deposit = await prisma.deposit.create({
    data: {
      userId,
      amount,
      status: "pending",
      gatewayProvider: "vizzionpay",
    },
    select: { id: true },
  });

  const identifier = deposit.id;
  const baseUrl = getAppBaseUrl();
  const callbackUrl = `${baseUrl}/api/webhooks/vizzionpay/pix`;

  const clientEmail = buildSyntheticClientEmail(user.id, user.publicId);
  const docInfo = resolveClientDocumentWithSource(user);
  if (docInfo.source === "placeholder") {
    logVizzionPayPixWarn("client_document_placeholder", {
      userId,
      depositId: deposit.id,
      hint: "Documento enviado como 00000000000; o provedor pode rejeitar.",
    });
  }

  const payload: VizzionPayPixReceiveRequest = {
    identifier,
    amount,
    client: {
      name: resolveClientName(user),
      email: clientEmail,
      phone: clientPhone,
      document: docInfo.document,
    },
    products: [
      {
        name: "Recarga de saldo",
        description: "Recarga via Pix na plataforma",
        quantity: 1,
        price: amount,
      },
    ],
    metadata: {
      userId: user.id,
      depositId: deposit.id,
      publicId: user.publicId ?? "",
    },
    callbackUrl,
  };

  const clientLog = buildClientLogSnapshot({
    name: payload.client.name,
    email: payload.client.email,
    phone: payload.client.phone,
    document: payload.client.document,
    syntheticEmail: true,
    emailHost: extractEmailHost(clientEmail),
    documentSource: docInfo.source,
    phoneDigitsLength: phoneDigits.length,
  });

  logVizzionPayPixEvent("vizzionpay_request_payload", {
    identifier,
    amount,
    callbackUrl,
    appBaseUrlResolved: baseUrl,
    client: clientLog,
    metadata: payload.metadata,
    products: payload.products.map((p) => ({
      name: p.name,
      quantity: p.quantity,
      price: p.price,
      hasDescription: Boolean(p.description),
    })),
  });

  try {
    const result = await postVizzionPayPixReceive(payload);

    if (!result.ok) {
      const status = result.status;
      const isAuth = status === 401 || status === 403;
      logVizzionPayPixError("vizzionpay_http_error", {
        identifier,
        httpStatus: status,
        responseBody: truncateForLog(result.text, 8_000),
        classifiedAs: isAuth ? "auth" : "other",
      });
      await prisma.deposit.update({
        where: { id: deposit.id },
        data: { status: "failed", gatewayProvider: "vizzionpay", externalReference: identifier },
      });
      throw new Error(isAuth ? "GATEWAY_AUTH_FAILED" : "GATEWAY_REQUEST_FAILED");
    }

    const parsed = parseVizzionPayPixReceiveResponse(result.json);
    if (!parsed) {
      const reason = explainVizzionPayParseFailure(result.json);
      logVizzionPayPixError("vizzionpay_parse_failed", {
        identifier,
        parseReason: reason,
        rawJsonPreview: truncateForLog(JSON.stringify(result.json), 8_000),
      });
      await prisma.deposit.update({
        where: { id: deposit.id },
        data: { status: "failed", gatewayProvider: "vizzionpay", externalReference: identifier },
      });
      throw new Error("GATEWAY_RESPONSE_INVALID");
    }

    logVizzionPayPixEvent("vizzionpay_parse_ok", {
      identifier,
      transactionId: parsed.transactionId,
      orderId: parsed.orderId,
      gatewayStatus: parsed.status,
      pixCodeLength: parsed.pixCode.length,
      hasQrImage: Boolean(parsed.qrCodeImageRaw ?? parsed.pixBase64),
    });

    const gatewayTxId = parsed.transactionId ?? parsed.orderId;

    await prisma.deposit.update({
      where: { id: deposit.id },
      data: {
        status: "pending",
        gatewayProvider: "vizzionpay",
        gatewayTransactionId: gatewayTxId,
        externalReference: identifier,
        pixCode: parsed.pixCode,
        qrCodeImage: parsed.qrCodeImageRaw ?? parsed.pixBase64 ?? null,
      },
    });

    return {
      depositId: deposit.id,
      identifier,
      gatewayTransactionId: gatewayTxId,
      orderId: parsed.orderId,
      gatewayStatus: parsed.status,
      pixCode: parsed.pixCode,
      qrCodeImageRaw: parsed.qrCodeImageRaw ?? parsed.pixBase64 ?? null,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (e instanceof VizzionPayPixApiError) {
      logVizzionPayPixError("vizzionpay_fetch_network_error", {
        identifier,
        statusCode: e.statusCode,
        errorMessage: e.message,
        bodySnippet: truncateForLog(e.bodySnippet, 2_000),
      });
      await prisma.deposit
        .update({
          where: { id: deposit.id },
          data: { status: "failed", gatewayProvider: "vizzionpay", externalReference: identifier },
        })
        .catch(() => {});
      throw new Error("GATEWAY_REQUEST_FAILED");
    }
    if (
      msg === "AMOUNT_INVALID" ||
      msg === "MIN_DEPOSIT_NOT_MET" ||
      msg === "USER_NOT_FOUND" ||
      msg === "USER_BANNED" ||
      msg === "VIZZIONPAY_NOT_CONFIGURED"
    ) {
      throw e;
    }
    if (msg.startsWith("GATEWAY_")) throw e;

    logVizzionPayPixError("vizzionpay_unexpected_error", {
      identifier,
      errorMessage: msg || String(e),
    });

    await prisma.deposit
      .update({
        where: { id: deposit.id },
        data: { status: "failed", gatewayProvider: "vizzionpay", externalReference: identifier },
      })
      .catch(() => {});
    throw e;
  }
}
