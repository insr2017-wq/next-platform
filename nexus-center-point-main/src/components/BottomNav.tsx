import { Link } from "@tanstack/react-router";
import { Home, ShoppingBag, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Início", icon: Home, to: "/app" },
  { label: "Produtos", icon: ShoppingBag, to: "/app/products" },
  { label: "Equipe", icon: Users, to: "/app/team" },
  { label: "Perfil", icon: User, to: "/app/profile" },
];



export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-20 items-center justify-around border-t border-border bg-background/80 px-4 pb-4 backdrop-blur-lg">
      {navItems.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className={cn(
            "flex flex-col items-center gap-1 text-muted transition-colors hover:text-primary",
            "[&.active]:text-primary"
          )}
          activeOptions={{ exact: item.to === "/app" }}
        >
          <item.icon className="h-6 w-6" />
          <span className="text-[10px] font-medium">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
