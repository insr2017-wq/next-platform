"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavIcon } from "@/components/icons/NavIcon";

type BottomNavProps = {
  items: Array<{
    href: string;
    label: string;
    icon?: "home" | "invite" | "profile";
  }>;
};

export function BottomNav({ items }: BottomNavProps) {
  const pathname = usePathname();
  return (
    <nav
      style={{
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        bottom: 10,
        width: "min(calc(100% - 18px), var(--container-max))",
        height: "var(--bottom-nav-height)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        border: "1px solid rgba(var(--brand-rgb), 0.12)",
        borderRadius: 20,
        background: "rgba(28,28,30,0.94)",
        backdropFilter: "blur(10px)",
        boxShadow: "0 12px 30px rgba(0,0,0,0.45)",
        zIndex: 30,
      }}
    >
      {items.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: "grid",
              justifyItems: "center",
              gap: 4,
              fontSize: 11,
              padding: "8px 10px",
              borderRadius: 12,
              fontWeight: isActive ? 900 : 700,
              color: isActive ? "var(--brand)" : "var(--text-muted)",
              background: isActive ? "rgba(var(--brand-rgb), 0.1)" : "transparent",
            }}
          >
            {item.icon ? <NavIcon name={item.icon} active={isActive} /> : null}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

