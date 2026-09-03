"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cashbackExamples, type CashbackConfig } from "@/lib/cashback";
import { formatBRL } from "@/lib/format-brl";

type Props = {
  initial: CashbackConfig;
};

function toInput(n: number): string {
  return String(n).replace(".", ",");
}

function parseNum(s: string): number {
  const n = parseFloat(s.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function AdminCashbackForm({ initial }: Props) {
  const router = useRouter();
  const [percent, setPercent] = useState(toInput(initial.cashbackPercent));
  const [band, setBand] = useState(toInput(initial.cashbackBandAmount));
  const [minInvest, setMinInvest] = useState(toInput(initial.cashbackMinInvest));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const preview = useMemo(() => {
    const settings: CashbackConfig = {
      cashbackPercent: parseNum(percent),
      cashbackBandAmount: parseNum(band),
      cashbackMinInvest: parseNum(minInvest),
    };
    return cashbackExamples(settings);
  }, [percent, band, minInvest]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/cashback", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cashbackPercent: percent.replace(",", "."),
          cashbackBandAmount: band.replace(",", "."),
          cashbackMinInvest: minInvest.replace(",", "."),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Erro ao salvar.");
        return;
      }
      setSuccess(typeof data.message === "string" ? data.message : "Salvo.");
      router.refresh();
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid var(--border)",
    fontSize: 14,
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16, maxWidth: 560 }}>
      <p style={{ margin: 0, color: "#6b7280", fontSize: 14, lineHeight: 1.5 }}>
        O cashback é creditado automaticamente na compra do produto, se o valor investido for
        maior ou igual ao mínimo. Os exemplos do popup na tela Produtos usam estes valores.
      </p>

      {error ? (
        <div style={{ padding: 10, borderRadius: 10, background: "#fef2f2", color: "#b91c1c", fontWeight: 600, fontSize: 13 }}>
          {error}
        </div>
      ) : null}
      {success ? (
        <div style={{ padding: 10, borderRadius: 10, background: "var(--brand-light)", color: "var(--brand)", fontWeight: 600, fontSize: 13 }}>
          {success}
        </div>
      ) : null}

      <label style={{ display: "grid", gap: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>Percentual de cashback (%)</span>
        <input value={percent} onChange={(e) => setPercent(e.target.value)} required style={inputStyle} />
      </label>
      <label style={{ display: "grid", gap: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>Faixa em reais (ex.: a cada R$ 200)</span>
        <input value={band} onChange={(e) => setBand(e.target.value)} required style={inputStyle} />
      </label>
      <label style={{ display: "grid", gap: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>Investimento mínimo para valer (R$)</span>
        <input value={minInvest} onChange={(e) => setMinInvest(e.target.value)} required style={inputStyle} />
      </label>

      <div
        style={{
          padding: 14,
          borderRadius: 12,
          border: "1px solid var(--border)",
          background: "var(--surface)",
        }}
      >
        <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 800, color: "#6b7280" }}>
          Exemplos no popup (preview)
        </p>
        <div style={{ display: "grid", gap: 8 }}>
          {preview.map((row) => (
            <div
              key={row.invest}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <span>Investindo {formatBRL(row.invest)}</span>
              <span style={{ color: "var(--brand)" }}>ganhe {formatBRL(row.cashback)}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          padding: 12,
          borderRadius: 10,
          border: "none",
          background: "var(--brand)",
          color: "#fff",
          fontWeight: 800,
          cursor: "pointer",
          fontSize: 14,
        }}
      >
        {loading ? "Salvando…" : "Salvar cashback"}
      </button>
    </form>
  );
}
