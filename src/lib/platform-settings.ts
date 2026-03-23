import { prisma } from "@/lib/db";

function isPrismaUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code: string }).code === "P2002"
  );
}

const GLOBAL_ID = "global";

export type PlatformSettingsData = {
  minDeposit: number;
  minWithdrawal: number;
  commissionLevel1: number;
  commissionLevel2: number;
  commissionLevel3: number;
  withdrawalFeePercent: number;
  welcomeModalEnabled: boolean;
  welcomeModalTitle: string;
  welcomeModalText: string;
  welcomeModalLink: string;
  earningsTestMode: boolean;
  earningsTestIntervalMinutes: number;
  vizzionpayPublicKey: string;
  vizzionpaySecretKey: string;
};

const DEFAULTS: PlatformSettingsData & { updatedAt: Date } = {
  minDeposit: 10,
  minWithdrawal: 20,
  commissionLevel1: 10,
  commissionLevel2: 5,
  commissionLevel3: 2,
  withdrawalFeePercent: 0,
  welcomeModalEnabled: false,
  welcomeModalTitle: "Boas-vindas",
  welcomeModalText: "",
  welcomeModalLink: "",
  earningsTestMode: false,
  earningsTestIntervalMinutes: 10,
  vizzionpayPublicKey: "",
  vizzionpaySecretKey: "",
  updatedAt: new Date(),
};

function normalizeRow(
  row: {
    minDeposit?: unknown;
    minWithdrawal?: unknown;
    commissionLevel1?: unknown;
    commissionLevel2?: unknown;
    commissionLevel3?: unknown;
    withdrawalFeePercent?: unknown;
    welcomeModalEnabled?: unknown;
    welcomeModalTitle?: unknown;
    welcomeModalText?: unknown;
    welcomeModalLink?: unknown;
    earningsTestMode?: unknown;
    earningsTestIntervalMinutes?: unknown;
    vizzionpayPublicKey?: unknown;
    vizzionpaySecretKey?: unknown;
    updatedAt?: Date | null;
  } | null
): PlatformSettingsData & { updatedAt: Date } {
  if (!row) {
    return { ...DEFAULTS };
  }
  const n = (v: unknown, fallback: number) => {
    const x = Number(v);
    return Number.isFinite(x) ? x : fallback;
  };
  const u = row.updatedAt instanceof Date ? row.updatedAt : new Date();
  const b = (v: unknown, fallback: boolean) =>
    typeof v === "boolean" ? v : typeof v === "string" ? v === "true" : fallback;
  const minutes = (v: unknown, fallback: number) => {
    if (v == null) return fallback;
    const x = Number(v);
    if (!Number.isFinite(x)) return fallback;
    // intervalo deve ser positivo e razoável
    const bounded = Math.max(1, Math.min(60, x));
    return bounded;
  };

  const trimmedString = (v: unknown, fallback: string) => {
    if (typeof v !== "string") return fallback;
    return v.trim();
  };

  return {
    minDeposit: n(row.minDeposit, DEFAULTS.minDeposit),
    minWithdrawal: n(row.minWithdrawal, DEFAULTS.minWithdrawal),
    commissionLevel1: n(row.commissionLevel1, DEFAULTS.commissionLevel1),
    commissionLevel2: n(row.commissionLevel2, DEFAULTS.commissionLevel2),
    commissionLevel3: n(row.commissionLevel3, DEFAULTS.commissionLevel3),
    withdrawalFeePercent: Math.max(0, Math.min(100, n(row.withdrawalFeePercent, DEFAULTS.withdrawalFeePercent))),
    welcomeModalEnabled: b(row.welcomeModalEnabled, DEFAULTS.welcomeModalEnabled),
    welcomeModalTitle:
      typeof row.welcomeModalTitle === "string" ? row.welcomeModalTitle.trim() : DEFAULTS.welcomeModalTitle,
    welcomeModalText:
      typeof row.welcomeModalText === "string" ? row.welcomeModalText.trim() : DEFAULTS.welcomeModalText,
    welcomeModalLink:
      typeof row.welcomeModalLink === "string" ? row.welcomeModalLink.trim() : DEFAULTS.welcomeModalLink,
    earningsTestMode: b(row.earningsTestMode, DEFAULTS.earningsTestMode),
    earningsTestIntervalMinutes: minutes(
      row.earningsTestIntervalMinutes,
      DEFAULTS.earningsTestIntervalMinutes,
    ),
    vizzionpayPublicKey: trimmedString(row.vizzionpayPublicKey, DEFAULTS.vizzionpayPublicKey),
    vizzionpaySecretKey: trimmedString(row.vizzionpaySecretKey, DEFAULTS.vizzionpaySecretKey),
    updatedAt: u,
  };
}

/**
 * Lê as configurações. Cria o registro global se possível; em falha total, retorna defaults em memória.
 */
export async function getPlatformSettings(): Promise<
  PlatformSettingsData & { updatedAt: Date }
> {
  try {
    let row = await prisma.platformSettings.findUnique({
      where: { id: GLOBAL_ID },
    });

    if (!row) {
      try {
        row = await prisma.platformSettings.create({
          data: {
            id: GLOBAL_ID,
            minDeposit: DEFAULTS.minDeposit,
            minWithdrawal: DEFAULTS.minWithdrawal,
            commissionLevel1: DEFAULTS.commissionLevel1,
            commissionLevel2: DEFAULTS.commissionLevel2,
            commissionLevel3: DEFAULTS.commissionLevel3,
            withdrawalFeePercent: DEFAULTS.withdrawalFeePercent,
            welcomeModalEnabled: DEFAULTS.welcomeModalEnabled,
            welcomeModalTitle: DEFAULTS.welcomeModalTitle,
            welcomeModalText: DEFAULTS.welcomeModalText,
            welcomeModalLink: DEFAULTS.welcomeModalLink,
            vizzionpayPublicKey: DEFAULTS.vizzionpayPublicKey,
            vizzionpaySecretKey: DEFAULTS.vizzionpaySecretKey,
          },
        });
      } catch (e) {
        if (isPrismaUniqueViolation(e)) {
          row = await prisma.platformSettings.findUnique({
            where: { id: GLOBAL_ID },
          });
        }
      }
    }

    return normalizeRow(row);
  } catch (e) {
    console.error("getPlatformSettings:", e);
    return { ...DEFAULTS, updatedAt: new Date() };
  }
}
