"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { formatDateTimeBr } from "@/lib/datetime-br";

export type BonusCodeRow = {
  id: string;
  code: string;
  minAmount: number;
  maxAmount: number;
  maxRedemptions: number;
  isActive: boolean;
  redemptionCount: number;
  createdAt: string;
};

type Props = { initialRows: BonusCodeRow[] };

function formatBRL(n: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

type ModalMode = "create" | "edit" | null;

export function AdminBonusCodesManager({ initialRows }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [mode, setMode] = useState<ModalMode>(null);
  const [editing, setEditing] = useState<BonusCodeRow | null>(null);
  const [code, setCode] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreate = useCallback(() => {
    setMode("create");
    setEditing(null);
    setCode("");
    setMinAmount("0,01");
    setMaxAmount("1,00");
    setMaxRedemptions("100");
    setIsActive(true);
    setError("");
    setSuccess("");
    setDeleteId(null);
  }, []);

  const openEdit = useCallback((r: BonusCodeRow) => {
    setMode("edit");
    setEditing(r);
    setCode(r.code);
    setMinAmount(String(r.minAmount).replace(".", ","));
    setMaxAmount(String(r.maxAmount).replace(".", ","));
    setMaxRedemptions(String(r.maxRedemptions));
    setIsActive(r.isActive);
    setError("");
    setSuccess("");
    setDeleteId(null);
  }, []);

  const closeModal = useCallback(() => {
    setMode(null);
    setEditing(null);
    setDeleteId(null);
    setError("");
    setSuccess("");
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    const body = {
      code,
      minAmount: minAmount.replace(",", "."),
      maxAmount: maxAmount.replace(",", "."),
      maxRedemptions: parseInt(maxRedemptions, 10) || 0,
      isActive,
    };
    try {
      if (mode === "create") {
        const res = await fetch("/api/admin/bonus-codes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const base =
            typeof data.error === "string" ? data.error : "Erro ao criar.";
          const det =
            typeof (data as { detalhe?: string }).detalhe === "string"
              ? ` — ${(data as { detalhe: string }).detalhe}`
              : "";
          setError(base + det);
          return;
        }
        router.refresh();
        closeModal();
        window.location.reload();
        return;
      }
      if (mode === "edit" && editing) {
        const res = await fetch(`/api/admin/bonus-codes/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(typeof data.error === "string" ? data.error : "Erro ao salvar.");
          return;
        }
        setSuccess(data.message ?? "Atualizado.");
        const min = parseFloat(body.minAmount);
        const max = parseFloat(body.maxAmount);
        const lim = body.maxRedemptions;
        setRows((prev) =>
          prev.map((r) =>
            r.id === editing.id
              ? {
                  ...r,
                  code: code.trim().toUpperCase(),
                  minAmount: min,
                  maxAmount: max,
                  maxRedemptions: lim,
                  isActive,
                }
              : r
          )
        );
        router.refresh();
      }
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/bonus-codes/${deleteId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Erro ao excluir.");
        return;
      }
      setRows((prev) => prev.filter((r) => r.id !== deleteId));
      closeModal();
      router.refresh();
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ marginBottom: 12 }}>
        <button
          type="button"
          onClick={openCreate}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 16px",
            borderRadius: 12,
            border: "none",
            background: "var(--brand)",
            color: "#fff",
            fontWeight: 800,
            fontSize: 14,
            cursor: "pointer",
            boxShadow: "0 4px 12px var(--brand-shadow)",
          }}
        >
          <Plus size={20} />
          Novo código bônus
        </button>
      </div>

      {rows.length === 0 && !mode ? (
        <div
          style={{
            padding: 32,
            textAlign: "center",
            background: "var(--surface)",
            borderRadius: 12,
            border: "1px solid var(--border)",
            color: "#6b7280",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Nenhum código bônus cadastrado. Clique em &quot;Novo código bônus&quot; para criar.
        </div>
      ) : null}

      {rows.length > 0 ? (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "var(--surface)",
              borderRadius: 12,
              overflow: "hidden",
              border: "1px solid var(--border)",
              boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
              fontSize: 12,
            }}
          >
            <thead>
              <tr style={{ background: "var(--app-bg)", borderBottom: "1px solid var(--border)" }}>
                <th style={{ padding: "8px 6px", textAlign: "left", fontWeight: 600 }}>Código</th>
                <th style={{ padding: "8px 6px", textAlign: "left", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "8px 6px", textAlign: "right", fontWeight: 600 }}>Mín.</th>
                <th style={{ padding: "8px 6px", textAlign: "right", fontWeight: 600 }}>Máx.</th>
                <th style={{ padding: "8px 6px", textAlign: "center", fontWeight: 600 }}>Limite</th>
                <th style={{ padding: "8px 6px", textAlign: "center", fontWeight: 600 }}>Resgatados</th>
                <th style={{ padding: "8px 6px", textAlign: "left", fontWeight: 600 }}>Criado em</th>
                <th style={{ padding: "8px 6px", width: 88 }} />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "8px 6px", fontWeight: 700 }}>{r.code}</td>
                  <td style={{ padding: "8px 6px" }}>
                    <span style={{ color: r.isActive ? "#166534" : "#6b7280", fontWeight: 700 }}>
                      {r.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td style={{ padding: "8px 6px", textAlign: "right" }}>{formatBRL(r.minAmount)}</td>
                  <td style={{ padding: "8px 6px", textAlign: "right" }}>{formatBRL(r.maxAmount)}</td>
                  <td style={{ padding: "8px 6px", textAlign: "center" }}>
                    {r.maxRedemptions === 0 ? "∞" : r.maxRedemptions}
                  </td>
                  <td style={{ padding: "8px 6px", textAlign: "center", fontWeight: 700 }}>
                    {r.redemptionCount}
                  </td>
                  <td style={{ padding: "8px 6px", color: "#6b7280" }}>
                    {formatDateTimeBr(r.createdAt)}
                  </td>
                  <td style={{ padding: "8px 6px" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        type="button"
                        aria-label="Editar"
                        onClick={() => openEdit(r)}
                        style={{
                          padding: 6,
                          borderRadius: 8,
                          border: "1px solid var(--border)",
                          background: "#fff",
                          cursor: "pointer",
                          color: "var(--brand)",
                        }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        aria-label="Excluir"
                        onClick={() => {
                          setEditing(r);
                          setDeleteId(r.id);
                          setMode(null);
                          setError("");
                        }}
                        style={{
                          padding: 6,
                          borderRadius: 8,
                          border: "1px solid #fecaca",
                          background: "#fff",
                          cursor: "pointer",
                          color: "#b91c1c",
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {deleteId && !mode ? (
        <>
          <div
            role="presentation"
            onClick={() => setDeleteId(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              zIndex: 100,
            }}
          />
          <div
            style={{
              position: "fixed",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: "min(360px, 92vw)",
              background: "var(--surface)",
              borderRadius: 16,
              padding: 20,
              zIndex: 101,
              boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
            }}
          >
            <p style={{ margin: "0 0 16px", fontWeight: 800, fontSize: 16 }}>
              Excluir código &quot;{editing?.code}&quot;?
            </p>
            <p style={{ margin: "0 0 16px", fontSize: 14, color: "#6b7280" }}>
              Os registros de resgate associados também serão removidos.
            </p>
            {error ? (
              <p style={{ color: "#b91c1c", fontWeight: 600, fontSize: 13 }}>{error}</p>
            ) : null}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 10,
                  border: "none",
                  background: "#b91c1c",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {loading ? "Excluindo…" : "Excluir"}
              </button>
            </div>
          </div>
        </>
      ) : null}

      {mode ? (
        <>
          <div
            role="presentation"
            onClick={closeModal}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              zIndex: 100,
            }}
          />
          <div
            role="dialog"
            style={{
              position: "fixed",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: "min(400px, calc(100vw - 24px))",
              maxHeight: "90vh",
              overflow: "auto",
              background: "var(--surface)",
              borderRadius: 16,
              padding: 20,
              zIndex: 101,
              boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
              border: "1px solid var(--border)",
            }}
          >
            <h2 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800 }}>
              {mode === "create" ? "Novo código bônus" : "Editar código bônus"}
            </h2>
            {error ? (
              <div
                style={{
                  marginBottom: 12,
                  padding: 10,
                  borderRadius: 10,
                  background: "#fef2f2",
                  color: "#b91c1c",
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
                  marginBottom: 12,
                  padding: 10,
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
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
              <label style={{ display: "grid", gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>Código</span>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ex.: PROMO2025"
                  required
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    fontSize: 14,
                    textTransform: "uppercase",
                  }}
                />
              </label>
              <label style={{ display: "grid", gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>
                  Valor mínimo (R$)
                </span>
                <input
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  placeholder="0,01"
                  required
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    fontSize: 14,
                  }}
                />
              </label>
              <label style={{ display: "grid", gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>
                  Valor máximo (R$)
                </span>
                <input
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  placeholder="1,00"
                  required
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    fontSize: 14,
                  }}
                />
              </label>
              <label style={{ display: "grid", gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>
                  Limite total de resgates (0 = ilimitado)
                </span>
                <input
                  type="number"
                  min={0}
                  value={maxRedemptions}
                  onChange={(e) => setMaxRedemptions(e.target.value)}
                  required
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    fontSize: 14,
                  }}
                />
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Código ativo</span>
              </label>
              <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
                No resgate, o valor creditado será aleatório entre mínimo e máximo (duas casas
                decimais).
              </p>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    background: "#fff",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 10,
                    border: "none",
                    background: "var(--brand)",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {loading ? "Salvando…" : mode === "create" ? "Criar" : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </>
      ) : null}
    </div>
  );
}
