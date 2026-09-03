"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Início", icon: Home, href: "/home" },
  { label: "Produtos", icon: ShoppingBag, href: "/vip" },
  { label: "Equipe", icon: Users, href: "/invite" },
  { label: "Perfil", icon: User, href: "/profile" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-20 items-center justify-around border-t border-border bg-background/80 px-4 pb-4 backdrop-blur-lg">
      {navItems.map((item) => {
        const active =
          item.href === "/home"
            ? pathname === "/home"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 text-muted transition-colors hover:text-primary",
              active && "text-primary",
            )}
          >
            <item.icon className="h-6 w-6" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
