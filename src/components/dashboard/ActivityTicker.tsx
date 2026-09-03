"use client";

import { Card } from "@/components/ui/Card";

type Activity = {
  id: string;
  text: string;
};

const MOCK_ACTIVITIES: Activity[] = [
  { id: "a1", text: "(11) 9****1234 recarregou R$50" },
  { id: "a2", text: "(21) 9****5678 sacou R$120" },
  { id: "a3", text: "(31) 9****9876 recarregou R$100" },
  { id: "a4", text: "(41) 9****4455 sacou R$80" },
  { id: "a5", text: "(51) 9****8899 recarregou R$200" },
  { id: "a6", text: "(61) 9****3344 recarregou R$150" },
  { id: "a7", text: "(71) 9****6677 sacou R$200" },
  { id: "a8", text: "(81) 9****1122 recarregou R$300" },
  { id: "a9", text: "(85) 9****5566 recarregou R$500" },
];

export function ActivityTicker() {
  const items = [...MOCK_ACTIVITIES, ...MOCK_ACTIVITIES];

  return (
    <Card>
      <div
        style={{
          padding: 8,
          background: "rgba(var(--brand-rgb), 0.08)",
          borderRadius: 999,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
            overflow: "hidden",
            borderRadius: 999,
          }}
        >
          <div className="ticker-track">
            {items.map((a) => (
              <span key={a.id + Math.random().toString(36).slice(2)}>{a.text}</span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

