type Stat = {
  label: string;
  value: string;
};

type StatGridProps = {
  items: Stat[];
};

export function StatGrid({ items }: StatGridProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 10,
        padding: 12,
        borderRadius: 14,
        background: "#f9fafb",
        border: "1px solid var(--border)",
      }}
    >
      {items.map((s) => (
        <div key={s.label} style={{ display: "grid", gap: 2 }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>{s.label}</div>
          <div style={{ fontSize: 14, fontWeight: 800 }}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}

