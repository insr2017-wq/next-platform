import { Gift } from "lucide-react";
import { Card } from "@/components/ui/Card";

export function RewardCard() {
  return (
    <Card>
      <div
        style={{
          padding: 16,
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: 12,
          alignItems: "center",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 48,
            height: 48,
            borderRadius: 999,
            background: "var(--brand-light)",
            border: "1px solid var(--brand-border)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Gift size={24} color="var(--brand)" strokeWidth={2.2} />
        </div>
        <div style={{ display: "grid", gap: 4 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 900,
              color: "rgba(17,24,39,0.92)",
            }}
          >
            Garanta seu bônus diário
          </div>
          <div
            style={{
              fontSize: 13,
              color: "rgba(17,24,39,0.70)",
            }}
          >
            Quanto mais dias consecutivos, maiores os benefícios.
          </div>
        </div>
      </div>
    </Card>
  );
}

