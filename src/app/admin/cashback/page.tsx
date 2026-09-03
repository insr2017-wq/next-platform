import { getPlatformSettings } from "@/lib/platform-settings";
import { AdminCashbackForm } from "@/components/admin/AdminCashbackForm";

export default async function AdminCashbackPage() {
  const s = await getPlatformSettings();
  return (
    <div>
      <p style={{ margin: "0 0 16px", color: "#6b7280", fontSize: 14 }}>
        Defina o percentual, a faixa e o valor mínimo. Essas regras valem para o crédito real e
        para os exemplos exibidos ao usuário.
      </p>
      <AdminCashbackForm
        initial={{
          cashbackPercent: s.cashbackPercent,
          cashbackBandAmount: s.cashbackBandAmount,
          cashbackMinInvest: s.cashbackMinInvest,
        }}
      />
    </div>
  );
}
