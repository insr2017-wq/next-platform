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
            <div style={{ fontSize: 14, fontWeight: 900, color: "rgba(10,30,72,0.95)", letterSpacing: 0.2 }}>
              {title}
            </div>
          ) : null}
          {subtitle ? (
            <div style={{ fontSize: 12, opacity: 0.78, color: "rgba(15,31,69,0.72)" }}>{subtitle}</div>
          ) : null}
        </div>
      )}
      {children}
    </section>
  );
}

