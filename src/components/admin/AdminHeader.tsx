"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { AdminMenu } from "./AdminMenu";

type AdminHeaderProps = {
  title: string;
};

export function AdminHeader({ title }: AdminHeaderProps) {
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
              background: "var(--surface-soft)",
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

          <div style={{ width: 40, height: 40 }} aria-hidden="true" />
        </div>
      </header>
      <AdminMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
