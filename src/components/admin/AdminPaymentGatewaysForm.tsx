"use client";

import { useState } from "react";

type GatewayView = {
  id: "vizzionpay" | "vqpay";
  label: string;
  enabled: boolean;
  envFallback: boolean;
  publicKeyMasked: string;
  secretKeyMasked: string;
  extraMasked: Record<string, string>;
  hasPublicKey: boolean;
  hasSecretKey: boolean;
};

const EXTRA_FIELDS: Record<string, Array<{ key: string; label: string }>> = {
  vizzionpay: [{ key: "productId", label: "ID do produto (depósito)" }],
  vqpay: [
    { key: "appId", label: "App ID" },
    { key: "merchantNo", label: "Merchant No" },
    { key: "paymentSecret", label: "Payment secret" },
    { key: "payoutSecret", label: "Payout secret" },
    { key: "baseUrl", label: "Base URL" },
  ],
};

export function AdminPaymentGatewaysForm({
  initialItems,
  encryptionNote,
}: {
  initialItems: GatewayView[];
  encryptionNote: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [extra, setExtra] = useState<Record<string, string>>({});
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function startEdit(row: GatewayView) {
    setEditingId(row.id);
    setPublicKey("");
    setSecretKey("");
    setExtra({});
    setEnabled(row.enabled);
    setError("");
    setSuccess("");
  }

  async function save() {
    if (!editingId) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/payment-gateways", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          enabled,
          publicKey,
          secretKey,
          extra,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Erro ao salvar.");
        return;
      }
      setSuccess("Salvo.");
      setEditingId(null);
      window.location.reload();
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleEnabled(row: GatewayView) {
    await fetch("/api/admin/payment-gateways", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: row.id, enabled: !row.enabled }),
    });
    setItems((prev) => prev.map((i) => (i.id === row.id ? { ...i, enabled: !i.enabled } : i)));
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>{encryptionNote}</p>
      {error ? <p style={{ color: "#b91c1c", fontWeight: 700 }}>{error}</p> : null}
      {success ? <p style={{ color: "var(--brand)", fontWeight: 700 }}>{success}</p> : null}
      {items.map((row) => (
        <div key={row.id} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 16, background: "var(--surface)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16 }}>{row.label}</h3>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b7280" }}>
                {row.enabled ? "Ativo" : "Desativado"}
                {row.envFallback ? " · fallback de .env disponível" : ""}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={() => void toggleEnabled(row)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "#fff", fontWeight: 700, cursor: "pointer" }}>
                {row.enabled ? "Desativar" : "Ativar"}
              </button>
              <button type="button" onClick={() => startEdit(row)} style={{ padding: "8px 12px", borderRadius: 8, border: "none", background: "var(--brand)", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
                Editar
              </button>
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: "#374151" }}>
            <p>Chave pública: {row.publicKeyMasked || "não definida"}</p>
            <p>Chave secreta: {row.secretKeyMasked || "não definida"}</p>
            {Object.entries(row.extraMasked).map(([k, v]) => (
              <p key={k}>{k}: {v || "não definido"}</p>
            ))}
          </div>
          {editingId === row.id ? (
            <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
              <label style={{ display: "grid", gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Chave pública / App ID (deixe vazio para manter)</span>
                <input value={publicKey} onChange={(e) => setPublicKey(e.target.value)} style={{ padding: 10, borderRadius: 8, border: "1px solid var(--border)" }} />
              </label>
              <label style={{ display: "grid", gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Chave secreta (deixe vazio para manter)</span>
                <input value={secretKey} onChange={(e) => setSecretKey(e.target.value)} type="password" style={{ padding: 10, borderRadius: 8, border: "1px solid var(--border)" }} />
              </label>
              {(EXTRA_FIELDS[row.id] ?? []).map((field) => (
                <label key={field.key} style={{ display: "grid", gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{field.label} (vazio = manter)</span>
                  <input
                    value={extra[field.key] ?? ""}
                    onChange={(e) => setExtra((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    type={field.key.toLowerCase().includes("secret") ? "password" : "text"}
                    style={{ padding: 10, borderRadius: 8, border: "1px solid var(--border)" }}
                  />
                </label>
              ))}
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
                <span style={{ fontWeight: 600 }}>Gateway ativo</span>
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => setEditingId(null)} style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid var(--border)", background: "#fff", fontWeight: 700 }}>Cancelar</button>
                <button type="button" disabled={loading} onClick={() => void save()} style={{ flex: 1, padding: 10, borderRadius: 8, border: "none", background: "var(--brand)", color: "#fff", fontWeight: 700 }}>{loading ? "Salvando…" : "Salvar"}</button>
              </div>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
