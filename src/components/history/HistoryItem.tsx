import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type Tone = "success" | "warning" | "error" | "neutral";

type HistoryItemProps = {
  title: string;
  subtitle: string;
  meta: string;
  amount: string;
  status: string;
  tone?: Tone;
};

function resolveBadgeTone(tone: Tone): "success" | "warning" | "neutral" {
  if (tone === "success") return "success";
  if (tone === "warning") return "warning";
  return "neutral";
}

export function HistoryItem({
  title,
  subtitle,
  meta,
  amount,
  status,
  tone = "neutral",
}: HistoryItemProps) {
  const badgeTone = resolveBadgeTone(tone);

  const statusColor =
    tone === "success"
      ? "rgba(22,163,74,1)"
      : tone === "warning"
        ? "rgba(202,138,4,1)"
        : tone === "error"
          ? "rgba(75,85,99,1)"
          : "rgba(55,65,81,1)";

  return (
    <Card>
      <div
        style={{
          padding: 12,
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 8,
          alignItems: "center",
        }}
      >
        <div style={{ display: "grid", gap: 2 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 900,
              color: "rgba(17,24,39,0.95)",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "rgba(75,85,99,1)",
              fontWeight: 700,
            }}
          >
            {subtitle}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "rgba(148,163,184,1)",
            }}
          >
            {meta}
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gap: 6,
            justifyItems: "flex-end",
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 900,
              color: "rgba(17,24,39,0.95)",
            }}
          >
            {amount}
          </div>
          <Badge tone={badgeTone as "success" | "warning" | "neutral"}>
            <span style={{ color: statusColor }}>{status}</span>
          </Badge>
        </div>
      </div>
    </Card>
  );
}

