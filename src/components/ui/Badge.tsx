import type { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  tone?: "neutral" | "warning" | "success";
};

export function Badge({ children, tone = "neutral" }: BadgeProps) {
  const styles =
    tone === "warning"
      ? { bg: "#fef3c7", fg: "#92400e", border: "#fde68a" }
      : tone === "success"
        ? { bg: "#dcfce7", fg: "#166534", border: "#bbf7d0" }
        : { bg: "#f3f4f6", fg: "#374151", border: "#e5e7eb" };

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

