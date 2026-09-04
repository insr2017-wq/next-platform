import type { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  tone?: "neutral" | "warning" | "success";
};

export function Badge({ children, tone = "neutral" }: BadgeProps) {
  const styles =
    tone === "warning"
      ? { bg: "rgba(var(--brand-rgb), 0.16)", fg: "var(--accent)", border: "var(--brand-border)" }
      : tone === "success"
        ? { bg: "rgba(34, 197, 94, 0.14)", fg: "#86efac", border: "rgba(34, 197, 94, 0.28)" }
        : { bg: "var(--surface-soft)", fg: "var(--text-muted)", border: "var(--border)" };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        background: styles.bg,
        color: styles.fg,
        border: `1px solid ${styles.border}`,
      }}
    >
      {children}
    </span>
  );
}
