import type { ReactNode } from "react";

type IconVariant = "purple" | "blue" | "pink";

const ICON_BG: Record<IconVariant, string> = {
  purple: "#7c3aed",
  blue: "#2563eb",
  pink: "#db2777",
};

type AdminStatCardProps = {
  title: string;
  value: string | number;
  secondary: string;
  icon: ReactNode;
  iconVariant?: IconVariant;
  href?: string;
};

export function AdminStatCard({
  title,
  value,
  secondary,
  icon,
  iconVariant = "blue",
  href,
}: AdminStatCardProps) {
  const bg = ICON_BG[iconVariant];
  const content = (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
        border: "1px solid var(--border)",
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 12,
        alignItems: "center",
        minHeight: 88,
      }}
    >
      <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#6b7280",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "var(--text)",
            letterSpacing: "-0.02em",
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "#6b7280",
            fontWeight: 500,
          }}
        >
          {secondary}
        </div>
      </div>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: bg,
          display: "grid",
          placeItems: "center",
          color: "#fff",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} style={{ textDecoration: "none", color: "inherit" }}>
        {content}
      </a>
    );
  }
  return content;
}
