import { Link, useRouterState } from "@tanstack/react-router";
import { Home, LayoutGrid, Star, User } from "lucide-react";

const items = [
  { to: "/dashboard", label: "Início", icon: Home },
  { to: "/vip", label: "Os Produtos", icon: LayoutGrid },
  { to: "/equipe", label: "Minha Equipe", icon: Star },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-md border-t border-border bg-card">
      {items.map(({ to, label, icon: Icon }) => {
        const active = pathname === to;
        return (
          <Link key={to} to={to} className="flex flex-1 flex-col items-center gap-1 py-2.5">
            <Icon
              className={active ? "h-6 w-6 text-primary" : "h-6 w-6 text-muted-foreground"}
              fill={active ? "currentColor" : "none"}
            />
            <span className={active ? "text-xs font-semibold text-primary" : "text-xs text-muted-foreground"}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
