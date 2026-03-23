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
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(10px)",
        boxShadow: "0 12px 30px rgba(17,24,39,0.16)",
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
              color: isActive ? "var(--brand)" : "rgba(17,24,39,0.55)",
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

