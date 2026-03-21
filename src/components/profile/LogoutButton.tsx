"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { clearSessionMarker } from "@/components/auth/SessionGate";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        clearSessionMarker();
        window.location.href = "/login";
        return;
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      fullWidth
      onClick={handleLogout}
      disabled={loading}
      style={{
        color: "#b91c1c",
        borderColor: "rgba(185,28,28,0.5)",
        marginTop: 8,
      }}
    >
      {loading ? "Saindo…" : "Sair da conta"}
    </Button>
  );
}
