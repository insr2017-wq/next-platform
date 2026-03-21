import { Card } from "@/components/ui/Card";

type ActivityBannerProps = {
  text: string;
};

export function ActivityBanner({ text }: ActivityBannerProps) {
  return (
    <Card>
      <div
        style={{
          padding: 12,
          display: "grid",
          gridTemplateColumns: "44px 1fr",
          gap: 10,
          alignItems: "center",
          background: "var(--brand-light)",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 34,
            height: 34,
            borderRadius: 999,
            background: "var(--brand)",
            color: "#fff",
            display: "grid",
            placeItems: "center",
            fontWeight: 900,
          }}
        >
          !
        </div>
        <div style={{ fontSize: 13, fontWeight: 800 }}>{text}</div>
      </div>
    </Card>
  );
}

