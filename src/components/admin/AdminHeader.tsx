"use client";

import { useState } from "react";
import { Menu, Bell, User, MoreVertical } from "lucide-react";
import { AdminMenu } from "./AdminMenu";

type AdminHeaderProps = {
  title: string;
  notificationCount?: number;
};

export function AdminHeader({ title, notificationCount = 0 }: AdminHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 52,
            paddingLeft: "var(--gutter)",
            paddingRight: "var(--gutter)",
            maxWidth: "var(--container-max)",
            margin: "0 auto",
          }}
        >
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu"
            style={{
              appearance: "none",
              border: "none",
              background: "#f3f4f6",
              width: 40,
              height: 40,
              borderRadius: 10,
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              color: "var(--text)",
            }}
          >
            <Menu size={22} strokeWidth={2} />
          </button>

          <h1
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: "var(--text)",
              margin: 0,
              flex: 1,
              textAlign: "center",
            }}
          >
            {title}
          </h1>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ position: "relative" }}>
              <button
                type="button"
                aria-label="Notificações"
                style={{
                  appearance: "none",
                  border: "none",
                  background: "transparent",
                  padding: 8,
                  cursor: "pointer",
                  color: "var(--text)",
                }}
              >
                <Bell size={22} strokeWidth={2} />
              </button>
              {notificationCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    minWidth: 18,
                    height: 18,
                    borderRadius: 999,
                    background: "#dc2626",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 800,
                    display: "grid",
                    placeItems: "center",
                    padding: "0 4px",
                  }}
                >
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </div>
            <button
              type="button"
              aria-label="Perfil"
              style={{
                appearance: "none",
                border: "none",
                background: "var(--brand-light)",
                width: 36,
                height: 36,
                borderRadius: 999,
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                color: "var(--brand)",
              }}
            >
              <User size={18} strokeWidth={2} />
            </button>
            <button
              type="button"
              aria-label="Mais opções"
              style={{
                appearance: "none",
                border: "none",
                background: "transparent",
                padding: 8,
                cursor: "pointer",
                color: "var(--text)",
              }}
            >
              <MoreVertical size={20} strokeWidth={2} />
            </button>
          </div>
        </div>
      </header>
      <AdminMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
