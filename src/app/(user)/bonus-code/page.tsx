import { Gift } from "lucide-react";
import { Page } from "@/components/layout/Page";
import { Card } from "@/components/ui/Card";
import { BonusCodeRedeemClient } from "@/components/bonus/BonusCodeRedeemClient";

export default function BonusCodePage() {
  return (
    <Page title="Resgatar código bônus" backHref="/profile" headerTone="brand">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width: 72,
              height: 72,
              borderRadius: 999,
              background: "var(--brand-light)",
              border: "2px solid var(--brand-border)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Gift size={36} color="var(--brand)" strokeWidth={2} />
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: "var(--brand)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              padding: "4px 10px",
              borderRadius: 999,
              background: "var(--brand-light)",
              border: "1px solid var(--brand-border)",
            }}
          >
            Bônus disponível
          </span>
        </div>

        <div style={{ width: "100%", maxWidth: "var(--container-max)" }}>
          <Card>
          <div
            style={{
              padding: 24,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
              textAlign: "center",
              background: "rgba(236,253,245,0.5)",
              borderRadius: 14,
            }}
          >
            <div
              style={{
                fontSize: 20,
                fontWeight: 900,
                color: "rgba(17,24,39,0.95)",
                lineHeight: 1.2,
              }}
            >
              Resgate seu código bônus
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "rgba(17,24,39,0.78)",
                lineHeight: 1.45,
              }}
            >
              Utilize seu código para desbloquear benefícios exclusivos e aumentar seus ganhos.
            </div>
          </div>
          </Card>
        </div>

        <BonusCodeRedeemClient />

        <div
          style={{
            padding: "4px 8px 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            color: "rgba(107,114,128,1)",
            lineHeight: 1.45,
            textAlign: "center",
          }}
        >
          <div>Os códigos bônus são válidos por tempo limitado.</div>
          <div>Verifique se o código foi digitado corretamente.</div>
          <div>Novos bônus poderão ser disponibilizados pela plataforma.</div>
        </div>
      </div>
    </Page>
  );
}

