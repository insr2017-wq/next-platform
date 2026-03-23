import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  elevated?: boolean;
};

export function Card({ children, elevated }: CardProps) {
  return (
    <div
      style={{
        background: elevated
          ? "linear-gradient(160deg, rgba(255,255,255,0.97) 0%, rgba(235,246,255,0.95) 100%)"
          : "var(--surface)",
        border: "1px solid var(--border)",
        backdropFilter: "blur(8px)",
        borderRadius: elevated ? 24 : 18,
        boxShadow: elevated
          ? "0 20px 44px rgba(10, 41, 99, 0.22), 0 6px 16px rgba(10, 41, 99, 0.13)"
          : "0 10px 24px rgba(10, 41, 99, 0.12)",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

