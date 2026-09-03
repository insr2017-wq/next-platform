import { prisma } from "@/lib/db";

export type GatewayId = "vizzionpay" | "vqpay";

export type GatewayExtra = Record<string, string>;

export type GatewayRecord = {
  id: GatewayId;
  label: string;
  enabled: boolean;
  publicKey: string;
  secretKey: string;
  extra: GatewayExtra;
};

const LABELS: Record<GatewayId, string> = {
  vizzionpay: "VizzionPay (Opção 1)",
  vqpay: "VQPay (Opção 2)",
};

function parseExtra(raw: string): GatewayExtra {
  try {
    const v = JSON.parse(raw || "{}") as unknown;
    if (!v || typeof v !== "object" || Array.isArray(v)) return {};
    const out: GatewayExtra = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (typeof val === "string") out[k] = val;
      else if (typeof val === "number" || typeof val === "boolean") out[k] = String(val);
    }
    return out;
  } catch {
    return {};
  }
}

export function maskSecret(value: string): string {
  const v = value.trim();
  if (!v) return "";
  if (v.length <= 4) return "••••";
  return `${"•".repeat(Math.max(4, v.length - 4))}${v.slice(-4)}`;
}

export async function getGatewayRecord(id: GatewayId): Promise<GatewayRecord | null> {
  try {
    const row = await prisma.paymentGatewayConfig.findUnique({ where: { id } });
    if (!row) return null;
    return {
      id,
      label: row.label || LABELS[id],
      enabled: row.enabled,
      publicKey: row.publicKey,
      secretKey: row.secretKey,
      extra: parseExtra(row.extraJson),
    };
  } catch {
    return null;
  }
}

export async function upsertGatewayRecord(input: GatewayRecord): Promise<void> {
  await prisma.paymentGatewayConfig.upsert({
    where: { id: input.id },
    create: {
      id: input.id,
      label: input.label,
      enabled: input.enabled,
      publicKey: input.publicKey,
      secretKey: input.secretKey,
      extraJson: JSON.stringify(input.extra ?? {}),
    },
    update: {
      label: input.label,
      enabled: input.enabled,
      publicKey: input.publicKey,
      secretKey: input.secretKey,
      extraJson: JSON.stringify(input.extra ?? {}),
    },
  });
}

export async function listGateways(): Promise<GatewayRecord[]> {
  const ids: GatewayId[] = ["vizzionpay", "vqpay"];
  const out: GatewayRecord[] = [];
  for (const id of ids) {
    const row = await getGatewayRecord(id);
    out.push(
      row ?? {
        id,
        label: LABELS[id],
        enabled: true,
        publicKey: "",
        secretKey: "",
        extra: {},
      },
    );
  }
  return out;
}
