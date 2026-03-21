"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { clearSessionMarker } from "@/components/auth/SessionGate";
import {
  LayoutDashboard,
  Users,
  ArrowDownToLine,
  ArrowUpFromLine,
  Gift,
  Package,
  CalendarCheck,
  UserPlus,
  Settings,
  X,
} from "lucide-react";

const MENU_ITEMS: { href: string; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Usuários", icon: Users },
  { href: "/admin/deposits", label: "Depósitos", icon: ArrowDownToLine },
  { href: "/admin/withdrawals", label: "Saques", icon: ArrowUpFromLine },
  { href: "/admin/bonus-codes", label: "Códigos bônus", icon: Gift },
  { href: "/admin/products", label: "Produtos", icon: Package },
  { href: "/admin/checkins", label: "Check-ins", icon: CalendarCheck },
  { href: "/admin/referrals", label: "Equipe / Convites", icon: UserPlus },
  { href: "/admin/settings", label: "Configurações", icon: Settings },
];

type AdminMenuProps = {
  open: boolean;
  onClose: () => void;
};

export function AdminMenu({ open, onClose }: AdminMenuProps) {
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);

  if (!open) return null;

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        clearSessionMarker();
        window.location.href = "/login";
      }
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <>
      <div
        role="presentation"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.35)",
          zIndex: 40,
        }}
      />
      <nav
        aria-label="Menu admin"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: "min(300px, 85vw)",
          maxWidth: 300,
          background: "var(--surface)",
          zIndex: 50,
          boxShadow: "4px 0 24px rgba(0,0,0,0.12)",
          display: "flex",
          flexDirection: "column",
          borderRadius: "0 12px 12px 0",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px var(--gutter)",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>
            Menu
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            style={{
              appearance: "none",
              border: "none",
              background: "transparent",
              padding: 8,
              cursor: "pointer",
              color: "#6b7280",
            }}
          >
            <X size={20} />
          </button>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: "8px 0" }}>
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px var(--gutter)",
                  fontSize: 15,
                  fontWeight: 600,
                  color: isActive ? "var(--brand)" : "var(--text)",
                  background: isActive ? "var(--brand-light)" : "transparent",
                  borderLeft: isActive ? "3px solid var(--brand)" : "3px solid transparent",
                  textDecoration: "none",
                }}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div
          style={{
            borderTop: "1px solid var(--border)",
            padding: 12,
          }}
        >
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
            style={{
              width: "100%",
              appearance: "none",
              border: "1px solid rgba(185,28,28,0.5)",
              background: "#fff",
              borderRadius: 14,
              padding: "12px 12px",
              cursor: loggingOut ? "not-allowed" : "pointer",
              color: loggingOut ? "rgba(185,28,28,0.5)" : "#b91c1c",
              fontWeight: 900,
              fontSize: 14,
            }}
          >
            {loggingOut ? "Saindo…" : "Sair da conta"}
          </button>
        </div>
      </nav>
    </>
  );
}
