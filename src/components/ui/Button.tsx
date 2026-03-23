import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  fullWidth?: boolean;
};

export function Button({
  variant = "primary",
  fullWidth,
  style,
  ...props
}: ButtonProps) {
  const isPrimary = variant === "primary";
  return (
    <button
      {...props}
      style={{
        appearance: "none",
        border: isPrimary ? "1px solid rgba(var(--brand-rgb), 0.35)" : "1px solid var(--border)",
        background: isPrimary
          ? "linear-gradient(160deg, var(--brand) 0%, var(--brand-2) 100%)"
          : "var(--surface)",
        color: isPrimary ? "#fff" : "var(--text)",
        borderRadius: 16,
        padding: "12px 15px",
        fontWeight: 800,
        width: fullWidth ? "100%" : undefined,
        cursor: "pointer",
        boxShadow: isPrimary ? "0 8px 18px rgba(var(--brand-rgb), 0.25)" : "none",
        ...style,
      }}
    />
  );
}

