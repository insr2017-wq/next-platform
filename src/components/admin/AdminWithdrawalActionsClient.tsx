"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type Props = {
  withdrawalId: string;
};

export function AdminWithdrawalActionsClient({ withdrawalId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  async function run(action: "approve" | "reject") {
    if (loading) return;
    setLoading(action);
    try {
      const res = await fetch(`/api/admin/withdrawals/${withdrawalId}/${action}`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const base = typeof data.error === "string" ? data.error : "Erro ao atualizar saque.";
        const detail = typeof data.detail === "string" && data.detail.trim() ? `\n${data.detail}` : "";
        throw new Error(base + detail);
      }
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao atualizar saque.";
      // Mantém o UI estável sem redesign; feedback mínimo.
      window.alert(msg);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
      <Button
        type="button"
        onClick={() => run("approve")}
        disabled={loading !== null}
        style={{
          padding: "8px 10px",
          borderRadius: 10,
          border: "none",
          background: "var(--brand)",
          color: "#fff",
          fontWeight: 900,
          fontSize: 12,
          whiteSpace: "nowrap",
        }}
      >
        {loading === "approve" ? "Aprovando…" : "Aprovar saque"}
      </Button>
      <Button
        type="button"
        onClick={() => run("reject")}
        disabled={loading !== null}
        style={{
          padding: "8px 10px",
          borderRadius: 10,
          border: "1px solid #fecaca",
          background: "#fff",
          color: "#b91c1c",
          fontWeight: 900,
          fontSize: 12,
          whiteSpace: "nowrap",
        }}
      >
        {loading === "reject" ? "Recusando…" : "Recusar saque"}
      </Button>
    </div>
  );
}

