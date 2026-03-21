"use client";

import { usePathname } from "next/navigation";
import { AdminHeader } from "./AdminHeader";
import { SessionGate } from "@/components/auth/SessionGate";

const TITLE_MAP: Record<string, string> = {
  "/admin": "Admin",
  "/admin/dashboard": "Dashboard",
  "/admin/users": "Usuários",
  "/admin/deposits": "Depósitos",
  "/admin/withdrawals": "Saques",
  "/admin/bonus-codes": "Códigos bônus",
  "/admin/products": "Produtos",
  "/admin/checkins": "Check-ins",
  "/admin/referrals": "Equipe / Convites",
  "/admin/settings": "Configurações",
};

type AdminLayoutClientProps = {
  children: React.ReactNode;
  notificationCount?: number;
};

export function AdminLayoutClient({ children, notificationCount = 0 }: AdminLayoutClientProps) {
  const pathname = usePathname();
  const title =
    pathname?.startsWith("/admin/users/") && pathname !== "/admin/users"
      ? "Gerenciar usuário"
      : TITLE_MAP[pathname ?? ""] ?? "Admin";

  return (
    <div style={{ minHeight: "100vh", background: "var(--app-bg)" }}>
      <SessionGate />
      <AdminHeader title={title} notificationCount={notificationCount} />
      <main
        style={{
          maxWidth: "var(--container-max)",
          margin: "0 auto",
          padding: "var(--gutter)",
          paddingBottom: 24,
        }}
      >
        {children}
      </main>
    </div>
  );
}
