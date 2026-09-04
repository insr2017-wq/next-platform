"use client";

type Tab = {
  id: string;
  label: string;
  meta?: string;
};

type TabsProps = {
  tabs: Tab[];
  value: string;
  onChange: (id: string) => void;
};

export function Tabs({ tabs, value, onChange }: TabsProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 10,
      }}
    >
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            style={{
              textAlign: "left",
              padding: 12,
              borderRadius: 14,
              border: active ? "1px solid var(--brand)" : "1px solid var(--border)",
              background: active ? "var(--brand)" : "var(--surface)",
              color: active ? "var(--on-brand)" : "var(--text)",
              cursor: "pointer",
              display: "grid",
              gap: 6,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 900 }}>{t.label}</div>
              <div
                aria-hidden="true"
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 999,
                  border: active ? "6px solid var(--on-brand)" : "2px solid var(--text-muted)",
                  boxSizing: "border-box",
                  alignSelf: "center",
                }}
              />
            </div>
            {t.meta ? (
              <div style={{ fontSize: 12, opacity: active ? 0.9 : 0.75 }}>{t.meta}</div>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
