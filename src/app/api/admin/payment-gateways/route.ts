import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  listGateways,
  maskSecret,
  upsertGatewayRecord,
  type GatewayId,
  type GatewayRecord,
} from "@/lib/payment-gateway-store";
import { getPlatformSettings } from "@/lib/platform-settings";
import { getVqPayConfigFromEnv } from "@/lib/vqpay/vqpay-config";

function requireAdmin(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }
  return null;
}

function publicView(row: GatewayRecord, envConfigured: boolean) {
  return {
    id: row.id,
    label: row.label,
    enabled: row.enabled,
    envFallback: envConfigured,
    publicKeyMasked: maskSecret(row.publicKey),
    secretKeyMasked: maskSecret(row.secretKey),
    extraMasked: Object.fromEntries(
      Object.entries(row.extra).map(([k, v]) => [k, maskSecret(v)]),
    ),
    hasPublicKey: Boolean(row.publicKey.trim()),
    hasSecretKey: Boolean(row.secretKey.trim()),
  };
}

export async function GET() {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const rows = await listGateways();
  const settings = await getPlatformSettings();
  const vizzionEnv = Boolean(
    process.env.VIZZIONPAY_PUBLIC_KEY?.trim() && process.env.VIZZIONPAY_SECRET_KEY?.trim(),
  );
  const vizzionDbSettings = Boolean(settings.vizzionpayPublicKey?.trim() && settings.vizzionpaySecretKey?.trim());

  return NextResponse.json({
    items: rows.map((row) =>
      publicView(
        row,
        row.id === "vizzionpay" ? vizzionEnv || vizzionDbSettings : Boolean(getVqPayConfigFromEnv()),
      ),
    ),
    encryptionNote:
      "As credenciais são gravadas em texto no banco (sem criptografia adicional). O fallback de variável de ambiente continua valendo se o painel estiver vazio.",
  });
}

export async function PUT(request: Request) {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const id = b.id === "vqpay" || b.id === "vizzionpay" ? (b.id as GatewayId) : null;
  if (!id) return NextResponse.json({ error: "Gateway inválido." }, { status: 400 });

  const current = (await listGateways()).find((g) => g.id === id);
  const extra = { ...(current?.extra ?? {}) };
  if (b.extra && typeof b.extra === "object" && !Array.isArray(b.extra)) {
    for (const [k, v] of Object.entries(b.extra as Record<string, unknown>)) {
      if (typeof v !== "string") continue;
      if (!v.trim()) continue;
      extra[k] = v.trim();
    }
  }

  const publicKey =
    typeof b.publicKey === "string" && b.publicKey.trim()
      ? b.publicKey.trim()
      : current?.publicKey ?? "";
  const secretKey =
    typeof b.secretKey === "string" && b.secretKey.trim()
      ? b.secretKey.trim()
      : current?.secretKey ?? "";

  const record: GatewayRecord = {
    id,
    label: typeof b.label === "string" && b.label.trim() ? b.label.trim() : current?.label ?? id,
    enabled: b.enabled !== false && b.enabled !== "false",
    publicKey,
    secretKey,
    extra,
  };

  try {
    await upsertGatewayRecord(record);
  } catch (e) {
    console.error("payment-gateways PUT", e);
    return NextResponse.json({ error: "Erro ao salvar. Rode as migrações." }, { status: 500 });
  }
  return NextResponse.json({ success: true, message: "Gateway atualizado." });
}
