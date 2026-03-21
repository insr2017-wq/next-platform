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
        border: "1px solid rgba(229,231,235,0.9)",
        borderRadius: elevated ? 20 : 14,
        boxShadow: elevated
          ? "0 12px 40px rgba(17, 24, 39, 0.12), 0 4px 12px rgba(17, 24, 39, 0.06)"
          : "0 8px 22px rgba(17, 24, 39, 0.07)",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

