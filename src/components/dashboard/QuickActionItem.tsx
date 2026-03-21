import type { ElementType } from "react";
import Link from "next/link";

type QuickActionItemProps = {
  href: string;
  label: string;
  Icon: ElementType<{ size?: number; color?: string; strokeWidth?: number }>;
};

export function QuickActionItem({ href, label, Icon }: QuickActionItemProps) {
  return (
    <Link
      href={href}
      style={{
        display: "grid",
        justifyItems: "center",
        gap: 8,
        padding: 6,
        borderRadius: 14,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 46,
          height: 46,
          borderRadius: 999,
          background: "var(--brand-light)",
          display: "grid",
          placeItems: "center",
          boxShadow: "0 6px 16px rgba(17, 24, 39, 0.06)",
        }}
      >
        <Icon size={22} color="var(--brand)" strokeWidth={2.25} />
      </div>

      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "rgba(17,24,39,0.60)",
          textAlign: "center",
          lineHeight: 1.1,
        }}
      >
        {label}
      </div>
    </Link>
  );
}

