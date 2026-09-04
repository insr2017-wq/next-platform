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

export function maskSecret(value: string): string {
  const v = value.trim();
  if (!v) return "";
  if (v.length <= 4) return "••••";
  return `${"•".repeat(Math.max(4, v.length - 4))}${v.slice(-4)}`;
}

function emptyRecord(id: GatewayId): GatewayRecord {
  return {
    id,
    label: LABELS[id],
    enabled: true,
    publicKey: "",
    secretKey: "",
    extra: {},
  };
}

/** Tabela PaymentGatewayConfig não existe neste schema; credenciais vêm do .env. */
export async function getGatewayRecord(_id: GatewayId): Promise<GatewayRecord | null> {
  return null;
}

export async function upsertGatewayRecord(_input: GatewayRecord): Promise<void> {
  // Gateway ativo da plataforma: GatewaySettings + variáveis de ambiente.
}

export async function listGateways(): Promise<GatewayRecord[]> {
  return [emptyRecord("vizzionpay"), emptyRecord("vqpay")];
}
