import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  elevated?: boolean;
};

export function Card({ children, elevated }: CardProps) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: elevated ? 20 : 14,
        boxShadow: elevated
          ? "0 14px 38px rgba(0, 0, 0, 0.35), 0 4px 12px var(--brand-shadow)"
          : "0 8px 24px rgba(0, 0, 0, 0.22)",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}
