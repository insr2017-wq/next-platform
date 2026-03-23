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
        left: "max(10px, env(safe-area-inset-left))",
        right: "max(10px, env(safe-area-inset-right))",
        bottom: "max(8px, env(safe-area-inset-bottom))",
        height: "var(--bottom-nav-height)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        border: "1px solid rgba(200,224,255,0.58)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(238,246,255,0.92) 100%)",
        backdropFilter: "blur(12px)",
        borderRadius: 20,
        boxShadow: "0 16px 34px rgba(7,30,77,0.24)",
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
              gap: 5,
              fontSize: 11,
              padding: "8px 10px",
              fontWeight: isActive ? 900 : 700,
              color: isActive ? "var(--brand)" : "rgba(15,31,69,0.52)",
              letterSpacing: 0.3,
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

