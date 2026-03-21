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
        border: isPrimary ? "1px solid var(--brand)" : "1px solid var(--border)",
        background: isPrimary ? "var(--brand)" : "transparent",
        color: isPrimary ? "#fff" : "var(--text)",
        borderRadius: 14,
        padding: "12px 14px",
        fontWeight: 700,
        width: fullWidth ? "100%" : undefined,
        cursor: "pointer",
        ...style,
      }}
    />
  );
}

