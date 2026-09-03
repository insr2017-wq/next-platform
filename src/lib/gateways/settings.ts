import { prisma } from "@/lib/db";
import { VIZZION_PAY_ID } from "@/lib/gateways/types";

const GLOBAL_ID = "global";

function defaultActiveGatewayFromEnv(): string {
  const fromEnv = process.env.DEFAULT_ACTIVE_GATEWAY?.trim();
  return fromEnv || VIZZION_PAY_ID;
}

export async function ensureGatewaySettingsTable(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "GatewaySettings" (
      "id" TEXT NOT NULL,
      "activeGateway" TEXT NOT NULL,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "GatewaySettings_pkey" PRIMARY KEY ("id")
    )
  `);
}

export async function readStoredActiveGateway(): Promise<string | null> {
  try {
    await ensureGatewaySettingsTable();
    const row = await prisma.gatewaySettings.findUnique({
      where: { id: GLOBAL_ID },
      select: { activeGateway: true },
    });
    const value = row?.activeGateway?.trim();
    return value || null;
  } catch (e) {
    console.error("[gateway-settings] readStoredActiveGateway:", e);
    return null;
  }
}

export async function writeStoredActiveGateway(activeGateway: string): Promise<void> {
  await ensureGatewaySettingsTable();
  await prisma.gatewaySettings.upsert({
    where: { id: GLOBAL_ID },
    create: { id: GLOBAL_ID, activeGateway },
    update: { activeGateway },
  });
}

export function getDefaultActiveGatewayId(): string {
  return defaultActiveGatewayFromEnv();
}
