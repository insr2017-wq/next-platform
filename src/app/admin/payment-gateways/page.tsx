import { listGateways, maskSecret } from "@/lib/payment-gateway-store";
import { getPlatformSettings } from "@/lib/platform-settings";
import { getVqPayConfigFromEnv } from "@/lib/vqpay/vqpay-config";
import { AdminPaymentGatewaysForm } from "@/components/admin/AdminPaymentGatewaysForm";

export default async function AdminPaymentGatewaysPage() {
  const [rows, settings] = await Promise.all([listGateways(), getPlatformSettings()]);
  const vizzionEnv = Boolean(
    process.env.VIZZIONPAY_PUBLIC_KEY?.trim() && process.env.VIZZIONPAY_SECRET_KEY?.trim(),
  );
  const vizzionDb = Boolean(settings.vizzionpayPublicKey?.trim() && settings.vizzionpaySecretKey?.trim());

  return (
    <AdminPaymentGatewaysForm
      encryptionNote="As credenciais ficam no banco em texto (sem criptografia extra). Se o campo do painel estiver vazio, o sistema usa .env."
      initialItems={rows.map((row) => ({
        id: row.id,
        label: row.label,
        enabled: row.enabled,
        envFallback: row.id === "vizzionpay" ? vizzionEnv || vizzionDb : Boolean(getVqPayConfigFromEnv()),
        publicKeyMasked: maskSecret(row.publicKey),
        secretKeyMasked: maskSecret(row.secretKey),
        extraMasked: Object.fromEntries(Object.entries(row.extra).map(([k, v]) => [k, maskSecret(v)])),
        hasPublicKey: Boolean(row.publicKey.trim()),
        hasSecretKey: Boolean(row.secretKey.trim()),
      }))}
    />
  );
}
