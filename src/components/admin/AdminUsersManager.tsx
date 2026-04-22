"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { formatDateBr } from "@/lib/datetime-br";

export type AdminUserRow = {
  id: string;
  publicId: string;
  phone: string;
  role: string;
  balance: number;
  banned: boolean;
  createdAt: string;
};

type AdminUsersManagerProps = {
  users: AdminUserRow[];
};

function formatBRL(n: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(n);
}

export function AdminUsersManager({ users }: AdminUsersManagerProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMsg, setBulkMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const selectableUsers = useMemo(
    () => users.filter((u) => u.role !== "admin"),
    [users],
  );
  const selectableIds = useMemo(
    () => selectableUsers.map((u) => u.id),
    [selectableUsers],
  );
  const allSelected =
    selectableIds.length > 0 &&
    selectableIds.every((id) => selectedIds.includes(id));
  const selectedCount = selectedIds.length;

  function toggleOne(id: string, checked: boolean) {
    setBulkMsg(null);
    setSelectedIds((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((x) => x !== id);
    });
  }

  function toggleAll(checked: boolean) {
    setBulkMsg(null);
    setSelectedIds(checked ? selectableIds : []);
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    const confirmed = window.confirm(
      `Excluir ${selectedIds.length} conta(s) selecionada(s)? Esta ação não pode ser desfeita.`,
    );
    if (!confirmed) return;

    setBulkLoading(true);
    setBulkMsg(null);
    try {
      const res = await fetch("/api/admin/users/bulk-delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBulkMsg({
          type: "err",
          text: typeof data.error === "string" ? data.error : "Erro ao excluir usuários selecionados.",
        });
        return;
      }

      const deletedCount =
        typeof data.deletedCount === "number" ? data.deletedCount : 0;
      const skippedAdmins =
        typeof data.skippedAdmins === "number" ? data.skippedAdmins : 0;
      const skippedSelf =
        typeof data.skippedSelf === "number" ? data.skippedSelf : 0;

      setBulkMsg({
        type: "ok",
        text: `Exclusão concluída. Removidos: ${deletedCount}. Ignorados (admin): ${skippedAdmins}. Ignorados (sua conta): ${skippedSelf}.`,
      });
      setSelectedIds([]);
      router.refresh();
    } catch {
      setBulkMsg({ type: "err", text: "Erro de conexão ao excluir em lote." });
    } finally {
      setBulkLoading(false);
    }
  }

  return (
    <div style={{ marginTop: 12, overflowX: "auto" }}>
      <div
        style={{
          marginBottom: 10,
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>
          {selectedCount > 0
            ? `${selectedCount} conta(s) selecionada(s)`
            : "Selecione usuários para excluir em lote"}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => setSelectedIds([])}
            disabled={bulkLoading || selectedCount === 0}
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              fontSize: 12,
              fontWeight: 800,
              cursor: bulkLoading || selectedCount === 0 ? "not-allowed" : "pointer",
            }}
          >
            Limpar seleção
          </button>
          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={bulkLoading || selectedCount === 0}
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid #fecaca",
              background: "#fff",
              color: "#b91c1c",
              fontSize: 12,
              fontWeight: 900,
              cursor: bulkLoading || selectedCount === 0 ? "not-allowed" : "pointer",
            }}
          >
            {bulkLoading ? "Excluindo…" : "Excluir selecionados"}
          </button>
        </div>
      </div>
      {bulkMsg ? (
        <div
          style={{
            marginBottom: 10,
            padding: "8px 10px",
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 700,
            background: bulkMsg.type === "ok" ? "var(--brand-light)" : "#fef2f2",
            color: bulkMsg.type === "ok" ? "var(--brand)" : "#b91c1c",
            border: bulkMsg.type === "ok" ? "1px solid var(--brand-border)" : "1px solid #fecaca",
          }}
        >
          {bulkMsg.text}
        </div>
      ) : null}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "var(--surface)",
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid var(--border)",
          boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
        }}
      >
        <thead>
          <tr style={{ background: "var(--app-bg)", borderBottom: "1px solid var(--border)" }}>
            <th style={{ padding: "10px 8px", width: 40 }}>
              <input
                type="checkbox"
                aria-label="Selecionar todos os usuários da página"
                checked={allSelected}
                onChange={(e) => toggleAll(e.target.checked)}
                disabled={selectableIds.length === 0 || bulkLoading}
              />
            </th>
            <th style={{ padding: "10px 8px", textAlign: "left", fontSize: 11, fontWeight: 600 }}>
              ID
            </th>
            <th style={{ padding: "10px 8px", textAlign: "left", fontSize: 11, fontWeight: 600 }}>
              Telefone
            </th>
            <th style={{ padding: "10px 8px", textAlign: "right", fontSize: 11, fontWeight: 600 }}>
              Saldo
            </th>
            <th style={{ padding: "10px 8px", textAlign: "left", fontSize: 11, fontWeight: 600 }}>
              Função
            </th>
            <th style={{ padding: "10px 8px", textAlign: "left", fontSize: 11, fontWeight: 600 }}>
              Status
            </th>
            <th style={{ padding: "10px 8px", textAlign: "left", fontSize: 11, fontWeight: 600 }}>
              Cadastro
            </th>
            <th style={{ padding: "10px 8px", width: 48 }} aria-label="Ações" />
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }}>
              <td style={{ padding: "10px 8px" }}>
                <input
                  type="checkbox"
                  aria-label={`Selecionar usuário ${u.publicId || u.phone}`}
                  checked={selectedIds.includes(u.id)}
                  onChange={(e) => toggleOne(u.id, e.target.checked)}
                  disabled={bulkLoading || u.role === "admin"}
                />
              </td>
              <td
                style={{
                  padding: "10px 8px",
                  fontSize: 13,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                }}
              >
                {u.publicId || "—"}
              </td>
              <td style={{ padding: "10px 8px", fontSize: 13 }}>{u.phone}</td>
              <td style={{ padding: "10px 8px", fontSize: 13, textAlign: "right" }}>
                {formatBRL(Number(u.balance ?? 0))}
              </td>
              <td style={{ padding: "10px 8px", fontSize: 13 }}>{u.role}</td>
              <td style={{ padding: "10px 8px", fontSize: 13 }}>
                <span
                  style={{
                    fontWeight: 700,
                    color: u.banned ? "#b91c1c" : "var(--brand)",
                  }}
                >
                  {u.banned ? "Banido" : "Ativo"}
                </span>
              </td>
              <td style={{ padding: "10px 8px", fontSize: 12, color: "#6b7280" }}>
                {formatDateBr(u.createdAt)}
              </td>
              <td style={{ padding: "10px 8px" }}>
                <Link
                  href={`/admin/users/${u.id}`}
                  aria-label="Gerenciar usuário"
                  style={{
                    display: "inline-grid",
                    placeItems: "center",
                    padding: 8,
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    color: "var(--brand)",
                    textDecoration: "none",
                  }}
                >
                  <Pencil size={16} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
