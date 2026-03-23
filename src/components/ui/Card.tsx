import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  elevated?: boolean;
};

export function Card({ children, elevated }: CardProps) {
  return (
    <div
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(247,252,249,0.96) 100%)",
        border: "1px solid rgba(var(--brand-rgb), 0.12)",
        borderRadius: elevated ? 20 : 14,
        boxShadow: elevated
          ? "0 14px 38px rgba(17, 24, 39, 0.12), 0 4px 12px rgba(var(--brand-rgb), 0.12)"
          : "0 8px 24px rgba(17, 24, 39, 0.08)",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

