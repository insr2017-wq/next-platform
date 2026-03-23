import { AdminPlatformSettingsForm } from "@/components/admin/AdminPlatformSettingsForm";
import { getPlatformSettings } from "@/lib/platform-settings";

function safeIso(d: Date | undefined | null): string {
  if (d instanceof Date && !Number.isNaN(d.getTime())) {
    return d.toISOString();
  }
  return new Date().toISOString();
}

export default async function AdminSettingsPage() {
  let s = await getPlatformSettings();
  if (!s || typeof s !== "object") {
    s = {
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
  }

  return (
    <AdminPlatformSettingsForm
      initial={{
        minDeposit: Number(s.minDeposit) || 10,
        minWithdrawal: Number(s.minWithdrawal) || 20,
        commissionLevel1: Number(s.commissionLevel1) || 10,
        commissionLevel2: Number(s.commissionLevel2) || 5,
        commissionLevel3: Number(s.commissionLevel3) || 2,
        withdrawalFeePercent: Number(s.withdrawalFeePercent) || 0,
        welcomeModalEnabled: Boolean((s as any).welcomeModalEnabled),
        welcomeModalTitle: typeof (s as any).welcomeModalTitle === "string" ? (s as any).welcomeModalTitle : "Boas-vindas",
        welcomeModalText: typeof (s as any).welcomeModalText === "string" ? (s as any).welcomeModalText : "",
        welcomeModalLink: typeof (s as any).welcomeModalLink === "string" ? (s as any).welcomeModalLink : "",
        earningsTestMode: Boolean(s.earningsTestMode),
        earningsTestIntervalMinutes:
          Number(s.earningsTestIntervalMinutes) || 10,
        vizzionpayPublicKey:
          typeof (s as any).vizzionpayPublicKey === "string" ? (s as any).vizzionpayPublicKey : "",
        updatedAt: safeIso(s.updatedAt),
      }}
    />
  );
}
