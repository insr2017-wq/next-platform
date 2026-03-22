import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createVizzionPayPixDeposit } from "@/lib/deposit-vizzionpay";
import { devErrorDetail, logDevApiError } from "@/lib/dev-api-error";
import { logVizzionPayPixError } from "@/lib/vizzionpay-pix-log";

function parseAmount(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v) && v > 0) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = parseFloat(v.replace(",", "."));
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "user") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const amountRaw = parseAmount((body as { amount?: unknown })?.amount);
  if (amountRaw === null) {
    return NextResponse.json({ error: "Informe um valor válido para a recarga." }, { status: 400 });
  }

  const amount = Math.round(amountRaw * 100) / 100;

  try {
    const result = await createVizzionPayPixDeposit(session.userId, amount);
    return NextResponse.json({
      ok: true,
      depositId: result.depositId,
      identifier: result.identifier,
      gatewayTransactionId: result.gatewayTransactionId,
      orderId: result.orderId,
      gatewayStatus: result.gatewayStatus,
      pixCode: result.pixCode,
      qrCodeImageRaw: result.qrCodeImageRaw,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    logDevApiError("user/deposit/pix", e);
    logVizzionPayPixError("api_user_deposit_pix_route", {
      errorCode: msg || "unknown",
      name: e instanceof Error ? e.name : typeof e,
    });

    if (msg === "AMOUNT_INVALID") {
      return NextResponse.json({ error: "Informe um valor válido para a recarga." }, { status: 400 });
    }
    if (msg === "MIN_DEPOSIT_NOT_MET") {
      return NextResponse.json(
        { error: "O valor informado não atinge o mínimo permitido para recarga." },
        { status: 400 }
      );
    }
    if (msg === "DEPOSIT_AMOUNT_INCOMPATIBLE_WITH_PRODUCT_UNIT") {
      return NextResponse.json(
        {
          error:
            "O valor da recarga não combina com o preço unitário do produto configurado no pagamento. Ajuste o valor ou a configuração.",
        },
        { status: 400 }
      );
    }
    if (msg === "USER_NOT_FOUND") {
      return NextResponse.json({ error: "Conta inválida." }, { status: 403 });
    }
    if (msg === "USER_BANNED") {
      return NextResponse.json({ error: "Conta suspensa." }, { status: 403 });
    }
    if (msg === "VIZZIONPAY_NOT_CONFIGURED") {
      return NextResponse.json(
        {
          error: "Pix indisponível no momento. Tente novamente mais tarde.",
          detail: devErrorDetail(e),
        },
        { status: 503 }
      );
    }
    if (msg === "VIZZIONPAY_DEPOSIT_PRODUCT_NOT_CONFIGURED") {
      return NextResponse.json(
        {
          error: "Pix indisponível no momento. Tente novamente mais tarde.",
          detail: devErrorDetail(e),
        },
        { status: 503 }
      );
    }
    if (msg === "GATEWAY_AUTH_FAILED") {
      return NextResponse.json(
        {
          error: "Não foi possível autenticar no provedor de pagamento. Tente novamente mais tarde.",
          detail: devErrorDetail(e),
        },
        { status: 502 }
      );
    }
    if (msg === "GATEWAY_REQUEST_FAILED" || msg === "GATEWAY_RESPONSE_INVALID") {
      return NextResponse.json(
        {
          error: "Não foi possível gerar o Pix no momento. Verifique os dados e tente novamente.",
          detail: devErrorDetail(e),
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        error: "Não foi possível gerar o Pix no momento. Tente novamente em instantes.",
        detail: devErrorDetail(e),
      },
      { status: 500 }
    );
  }
}
