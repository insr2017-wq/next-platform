import type { ReactNode } from "react";

type SectionProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
};

export function Section({ title, subtitle, children }: SectionProps) {
  return (
    <section style={{ display: "grid", gap: 10 }}>
      {(title || subtitle) && (
        <div style={{ display: "grid", gap: 4, paddingBottom: 2 }}>
          {title ? (
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>{title}</div>
          ) : null}
          {subtitle ? (
            <div style={{ fontSize: 12, opacity: 0.7, color: "var(--text-muted)" }}>{subtitle}</div>
          ) : null}
        </div>
      )}
      {children}
    </section>
  );
}

