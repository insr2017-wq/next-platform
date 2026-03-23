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
        border: isPrimary ? "1px solid rgba(35,149,255,0.45)" : "1px solid rgba(163,193,230,0.5)",
        background: isPrimary
          ? "linear-gradient(135deg, var(--brand-2) 0%, var(--brand) 100%)"
          : "rgba(255,255,255,0.86)",
        color: isPrimary ? "#eef6ff" : "var(--text)",
        borderRadius: 16,
        padding: "12px 16px",
        fontWeight: 800,
        width: fullWidth ? "100%" : undefined,
        cursor: "pointer",
        boxShadow: isPrimary
          ? "0 10px 20px rgba(14,84,189,0.28)"
          : "0 6px 14px rgba(11,45,106,0.1)",
        ...style,
      }}
    />
  );
}

