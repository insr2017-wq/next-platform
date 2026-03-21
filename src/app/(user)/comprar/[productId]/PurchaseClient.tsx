"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type Props = { productId: string; productName: string; priceLabel: string };

export function PurchaseClient({ productId, productName, priceLabel }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function buy() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/user/products/${productId}/purchase`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Erro na compra.");
        return;
      }
      router.push("/my-products");
      router.refresh();
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {error ? (
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            background: "#fef2f2",
            color: "#b91c1c",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      ) : null}
      <Button
        type="button"
        fullWidth
        disabled={loading}
        onClick={buy}
        style={{
          borderRadius: 999,
          padding: "16px",
          fontSize: 15,
          fontWeight: 900,
          boxShadow: "0 10px 20px var(--brand-shadow)",
        }}
      >
        {loading ? "Processando…" : `Confirmar compra — ${priceLabel}`}
      </Button>
      <p style={{ margin: 0, fontSize: 12, color: "#6b7280", textAlign: "center" }}>
        O valor será debitado do seu saldo. Certifique-se de ter saldo suficiente.
      </p>
    </div>
  );
}
