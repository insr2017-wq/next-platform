import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPlatformSettings } from "@/lib/platform-settings";
import { devErrorDetail, logDevApiError } from "@/lib/dev-api-error";

const GLOBAL_ID = "global";

function parseNonNegative(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v) && v >= 0) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = parseFloat(v.replace(",", "."));
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return null;
}

function parsePercent(v: unknown): number | null {
  const n = parseNonNegative(v);
  if (n === null) return null;
  if (n > 100) return null;
  return n;
}

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }
  try {
    const s = await getPlatformSettings();
    return NextResponse.json({
      minDeposit: s.minDeposit,
      minWithdrawal: s.minWithdrawal,
      commissionLevel1: s.commissionLevel1,
      commissionLevel2: s.commissionLevel2,
      commissionLevel3: s.commissionLevel3,
      withdrawalFeePercent: s.withdrawalFeePercent,
      welcomeModalEnabled: s.welcomeModalEnabled,
      welcomeModalTitle: s.welcomeModalTitle,
      welcomeModalText: s.welcomeModalText,
      welcomeModalLink: s.welcomeModalLink,
      earningsTestMode: s.earningsTestMode,
      earningsTestIntervalMinutes: s.earningsTestIntervalMinutes,
      vizzionpayPublicKey: s.vizzionpayPublicKey,
      vizzionpaySecretConfigured: Boolean(s.vizzionpaySecretKey?.trim()),
      updatedAt: s.updatedAt.toISOString(),
    });
  } catch (e) {
    console.error("GET platform-settings:", e);
    return NextResponse.json({ error: "Erro ao carregar." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const b = (body ?? {}) as Record<string, unknown>;

  const minDeposit = parseNonNegative(b.minDeposit);
  const minWithdrawal = parseNonNegative(b.minWithdrawal);
  const c1 = parsePercent(b.commissionLevel1);
  const c2 = parsePercent(b.commissionLevel2);
  const c3 = parsePercent(b.commissionLevel3);
  const withdrawalFeePercentRaw = parsePercent(b.withdrawalFeePercent);
  const withdrawalFeePercent = withdrawalFeePercentRaw ?? 0;
  const earningsTestMode =
    typeof b.earningsTestMode === "boolean"
      ? b.earningsTestMode
      : typeof b.earningsTestMode === "string"
        ? b.earningsTestMode === "true"
        : false;

  const welcomeModalEnabled =
    typeof b.welcomeModalEnabled === "boolean"
      ? b.welcomeModalEnabled
      : typeof b.welcomeModalEnabled === "string"
        ? b.welcomeModalEnabled === "true"
        : false;

  const welcomeModalTitle =
    typeof b.welcomeModalTitle === "string" ? b.welcomeModalTitle.trim() : "";

  const welcomeModalText =
    typeof b.welcomeModalText === "string" ? b.welcomeModalText.trim() : "";

  const welcomeModalLink =
    typeof b.welcomeModalLink === "string" ? b.welcomeModalLink.trim() : "";
  const earningsTestIntervalMinutesRaw = b.earningsTestIntervalMinutes;
  const earningsTestIntervalMinutes =
    typeof earningsTestIntervalMinutesRaw === "number" ||
    typeof earningsTestIntervalMinutesRaw === "string"
      ? Math.max(
          1,
          Math.min(60, Number(earningsTestIntervalMinutesRaw.toString().replace(",", "."))),
        )
      : 10;

  const vizzionpayPublicKeyCandidate =
    typeof b.vizzionpayPublicKey === "string" ? b.vizzionpayPublicKey.trim() : "";
  const vizzionpaySecretKeyCandidate =
    typeof b.vizzionpaySecretKey === "string" ? b.vizzionpaySecretKey.trim() : "";

  if (minDeposit === null) {
    return NextResponse.json({ error: "Mínimo de depósito inválido." }, { status: 400 });
  }
  if (minWithdrawal === null) {
    return NextResponse.json({ error: "Mínimo de saque inválido." }, { status: 400 });
  }
  if (c1 === null || c2 === null || c3 === null) {
    return NextResponse.json(
      { error: "Taxas/comissões devem ser porcentagens entre 0 e 100." },
      { status: 400 }
    );
  }

  try {
    const current = await getPlatformSettings();

    const vizzionpayPublicKey =
      vizzionpayPublicKeyCandidate.length > 0
        ? vizzionpayPublicKeyCandidate
        : current.vizzionpayPublicKey;
    const vizzionpaySecretKey =
      vizzionpaySecretKeyCandidate.length > 0
        ? vizzionpaySecretKeyCandidate
        : current.vizzionpaySecretKey;

    await prisma.platformSettings.upsert({
      where: { id: GLOBAL_ID },
      create: {
        id: GLOBAL_ID,
        minDeposit,
        minWithdrawal,
        commissionLevel1: c1,
        commissionLevel2: c2,
        commissionLevel3: c3,
        withdrawalFeePercent,
        welcomeModalEnabled,
        welcomeModalTitle,
        welcomeModalText,
        welcomeModalLink,
        earningsTestMode,
        earningsTestIntervalMinutes,
        vizzionpayPublicKey,
        vizzionpaySecretKey,
      },
      update: {
        minDeposit,
        minWithdrawal,
        commissionLevel1: c1,
        commissionLevel2: c2,
        commissionLevel3: c3,
        withdrawalFeePercent,
        welcomeModalEnabled,
        welcomeModalTitle,
        welcomeModalText,
        welcomeModalLink,
        earningsTestMode,
        earningsTestIntervalMinutes,
        vizzionpayPublicKey,
        vizzionpaySecretKey,
      },
    });
  } catch (e) {
    logDevApiError("admin/platform-settings PUT", e);
    return NextResponse.json(
      {
        error:
          "Erro ao salvar. Verifique se a tabela PlatformSettings existe (rode as migrações).",
        ...(devErrorDetail(e) ? { detalhe: devErrorDetail(e) } : {}),
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, message: "Configurações salvas." });
}
