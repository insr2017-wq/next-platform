"use client";

import { useEffect, useState } from "react";

function gatewayLabel(id: string): string {
  if (id === "vizzion_pay") return "Vizzion Pay";
  if (id === "misticpay") return "MisticPay";
  return id;
}

export function AdminGatewaySettingsForm() {
  const [available, setAvailable] = useState<string[]>([]);
  const [active, setActive] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    setError("");
    try {
      const res = await fetch("/api/admin/gateways/settings");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Erro ao carregar gateways.");
        return;
      }
      const list = Array.isArray(data.availableGateways) ? data.availableGateways.map(String) : [];
      setAvailable(list);
      setActive(typeof data.activeGateway === "string" ? data.activeGateway : list[0] ?? "");
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/gateways/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeGateway: active }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Erro ao salvar.");
        return;
      }
      if (typeof data.activeGateway === "string") setActive(data.activeGateway);
      if (Array.isArray(data.availableGateways)) setAvailable(data.availableGateways.map(String));
      setSuccess("Gateway ativo atualizado. Novos depósitos e saques usarão este provedor.");
    } catch {
      setError("Erro de conexão.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSave}
      style={{
        marginTop: 12,
        background: "var(--surface)",
        borderRadius: 14,
        border: "1px solid var(--border)",
        boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
        padding: 20,
        maxWidth: 480,
      }}
    >
      <h2 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 800 }}>Gateway de pagamento</h2>
      <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--text-muted)" }}>
        Um único gateway ativo para depósito e saque. A troca vale na hora, sem novo deploy.
      </p>

      {error ? (
        <div
          style={{
            marginBottom: 14,
            padding: 12,
            borderRadius: 10,
            background: "rgba(248,113,113,0.14)",
            color: "var(--danger)",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      ) : null}
      {success ? (
        <div
          style={{
            marginBottom: 14,
            padding: 12,
            borderRadius: 10,
            background: "var(--brand-light)",
            color: "var(--brand)",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {success}
        </div>
      ) : null}

      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Gateway ativo</span>
        <select
          value={active}
          onChange={(e) => setActive(e.target.value)}
          disabled={loading || saving || available.length === 0}
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid var(--border)",
            fontSize: 15,
            background: "var(--surface)",
          }}
        >
          {available.map((id) => (
            <option key={id} value={id}>
              {gatewayLabel(id)} ({id})
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        disabled={loading || saving || !active}
        style={{
          marginTop: 16,
          padding: "14px 18px",
          borderRadius: 12,
          border: "none",
          background: "var(--brand)",
          color: "var(--on-brand)",
          fontWeight: 800,
          fontSize: 15,
          cursor: loading || saving ? "not-allowed" : "pointer",
          boxShadow: "0 4px 14px var(--brand-shadow)",
        }}
      >
        {saving ? "Salvando…" : "Salvar gateway"}
      </button>
    </form>
  );
}
