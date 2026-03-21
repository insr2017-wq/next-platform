"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavIcon } from "@/components/icons/NavIcon";

type BottomNavProps = {
  items: Array<{
    href: string;
    label: string;
    icon?: "home" | "invite" | "vip" | "profile";
  }>;
};

export function BottomNav({ items }: BottomNavProps) {
  const pathname = usePathname();
  return (
    <nav
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        height: "var(--bottom-nav-height)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        borderTop: "1px solid var(--border)",
        background: "var(--bg)",
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
              padding: 8,
              fontWeight: isActive ? 900 : 700,
              color: isActive ? "var(--brand)" : "rgba(17,24,39,0.55)",
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

