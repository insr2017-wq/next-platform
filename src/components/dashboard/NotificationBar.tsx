import { Card } from "@/components/ui/Card";

type NotificationBarProps = {
  text: string;
};

export function NotificationBar({ text }: NotificationBarProps) {
  return (
    <Card>
      <div
        style={{
          padding: "10px 12px",
          background: "#ecfdf5",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 34,
            height: 34,
            borderRadius: 999,
            background: "var(--brand-light)",
            border: "1px solid var(--brand-border)",
            display: "grid",
            placeItems: "center",
            color: "var(--brand)",
            fontWeight: 900,
          }}
        >
          🔔
        </div>
        <div style={{ fontSize: 13, fontWeight: 800, color: "rgba(17,24,39,0.82)" }}>
          {text}
        </div>
      </div>
    </Card>
  );
}

