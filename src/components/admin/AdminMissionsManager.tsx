"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import {
  MISSION_CRITERIA,
  MISSION_CRITERION_LABELS,
  MISSION_ICON_LABELS,
  MISSION_ICONS,
  MISSION_REWARD_LABELS,
  MISSION_REWARD_TYPES,
  MISSION_TYPE_LABELS,
  MISSION_TYPES,
} from "@/lib/missions/constants";
import { formatMissionReward } from "@/lib/missions/format";

export type AdminMissionRow = {
  id: string;
  title: string;
  description: string;
  type: string;
  criterion: string;
  targetValue: number;
  rewardType: string;
  rewardValue: number;
  resets: boolean;
  isActive: boolean;
  icon: string;
  sortOrder: number;
  requiredLevel: number;
  progressCount: number;
};

type Props = { initialRows: AdminMissionRow[] };
type ModalMode = "create" | "edit" | null;
type Filter = "all" | "semanal" | "permanente" | "meta_indicacao";

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  fontSize: 14,
};

function emptyForm() {
  return {
    title: "",
    description: "",
    type: "semanal",
    criterion: "cadastro_chave_pix",
    customCriterion: "",
    targetValue: "1",
    rewardType: "valor_fixo",
    rewardValue: "5",
    resets: true,
    isActive: true,
    icon: "target",
    sortOrder: "0",
    requiredLevel: "1",
  };
}

export function AdminMissionsManager({ initialRows }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [filter, setFilter] = useState<Filter>("all");
  const [mode, setMode] = useState<ModalMode>(null);
  const [editing, setEditing] = useState<AdminMissionRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const visible = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.type === filter)),
    [rows, filter]
  );

  const openCreate = useCallback(() => {
    setMode("create");
    setEditing(null);
    setForm(emptyForm());
    setError("");
    setDeleteId(null);
  }, []);

  const openEdit = useCallback((r: AdminMissionRow) => {
    setMode("edit");
    setEditing(r);
    const known = (MISSION_CRITERIA as readonly string[]).includes(r.criterion);
    setForm({
      title: r.title,
      description: r.description,
      type: r.type,
      criterion: known ? r.criterion : "custom",
      customCriterion: known ? "" : r.criterion,
      targetValue: String(r.targetValue).replace(".", ","),
      rewardType: r.rewardType,
      rewardValue: String(r.rewardValue).replace(".", ","),
      resets: r.resets,
      isActive: r.isActive,
      icon: r.icon,
      sortOrder: String(r.sortOrder),
      requiredLevel: String(r.requiredLevel ?? 1),
    });
    setError("");
    setDeleteId(null);
  }, []);

  const closeModal = useCallback(() => {
    setMode(null);
    setEditing(null);
    setDeleteId(null);
    setError("");
  }, []);

  function bodyFromForm() {
    const criterion =
      form.criterion === "custom" ? form.customCriterion.trim() : form.criterion;
    return {
      title: form.title,
      description: form.description,
      type: form.type,
      criterion,
      targetValue: form.targetValue.replace(",", "."),
      rewardType: form.rewardType,
      rewardValue: form.rewardValue.replace(",", "."),
      resets: form.resets,
      isActive: form.isActive,
      icon: form.icon,
      sortOrder: parseInt(form.sortOrder, 10) || 0,
      requiredLevel: parseInt(form.requiredLevel, 10) || 1,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const body = bodyFromForm();
    try {
      if (mode === "create") {
        const res = await fetch("/api/admin/missions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(typeof data.error === "string" ? data.error : "Erro ao criar.");
          return;
        }
        window.location.reload();
        return;
      }
      if (mode === "edit" && editing) {
        const res = await fetch(`/api/admin/missions/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(typeof data.error === "string" ? data.error : "Erro ao salvar.");
          return;
        }
        setRows((prev) =>
          prev.map((r) =>
            r.id === editing.id
              ? {
                  ...r,
                  ...body,
                  targetValue: Number(body.targetValue),
                  rewardValue: Number(body.rewardValue),
                }
              : r
          )
        );
        closeModal();
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
      const res = await fetch(`/api/admin/missions/${deleteId}`, { method: "DELETE" });
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

  async function patchOrder(id: string, sortOrder: number) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, sortOrder } : r)));
    await fetch(`/api/admin/missions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sortOrder }),
    }).catch(() => {});
  }

  async function move(row: AdminMissionRow, dir: -1 | 1) {
    const list = [...rows].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = list.findIndex((r) => r.id === row.id);
    const swap = list[idx + dir];
    if (!swap) return;
    await Promise.all([patchOrder(row.id, swap.sortOrder), patchOrder(swap.id, row.sortOrder)]);
  }

  async function toggleActive(row: AdminMissionRow) {
    const isActive = !row.isActive;
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, isActive } : r)));
    await fetch(`/api/admin/missions/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    }).catch(() => {});
  }

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12, alignItems: "center" }}>
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
          }}
        >
          <Plus size={20} />
          Nova missão
        </button>
        {(
          [
            ["all", "Todas"],
            ["semanal", "Semanais"],
            ["permanente", "Permanentes"],
            ["meta_indicacao", "Metas de indicação"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              border: "1px solid var(--border)",
              background: filter === key ? "var(--brand-light)" : "#fff",
              color: filter === key ? "var(--brand)" : "#374151",
              fontWeight: 700,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 && !mode ? (
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
          Nenhuma missão neste filtro. Clique em &quot;Nova missão&quot; para cadastrar.
        </div>
      ) : null}

      {visible.length > 0 ? (
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
                <th style={{ padding: "8px 6px", textAlign: "left" }}>Ordem</th>
                <th style={{ padding: "8px 6px", textAlign: "left" }}>Missão</th>
                <th style={{ padding: "8px 6px", textAlign: "left" }}>Tipo</th>
                <th style={{ padding: "8px 6px", textAlign: "left" }}>Critério</th>
                <th style={{ padding: "8px 6px", textAlign: "right" }}>Meta</th>
                <th style={{ padding: "8px 6px", textAlign: "left" }}>Recompensa</th>
                <th style={{ padding: "8px 6px", textAlign: "left" }}>Status</th>
                <th style={{ padding: "8px 6px", width: 120 }} />
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid var(--border)", opacity: r.isActive ? 1 : 0.55 }}>
                  <td style={{ padding: "8px 6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <button type="button" aria-label="Subir" onClick={() => void move(r, -1)} style={{ border: "1px solid var(--border)", background: "#fff", borderRadius: 6, padding: 4, cursor: "pointer" }}>
                        <ArrowUp size={12} />
                      </button>
                      <span style={{ fontWeight: 700, minWidth: 16, textAlign: "center" }}>{r.sortOrder}</span>
                      <button type="button" aria-label="Descer" onClick={() => void move(r, 1)} style={{ border: "1px solid var(--border)", background: "#fff", borderRadius: 6, padding: 4, cursor: "pointer" }}>
                        <ArrowDown size={12} />
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: "8px 6px" }}>
                    <div style={{ fontWeight: 800 }}>{r.title}</div>
                    <div style={{ color: "#6b7280", maxWidth: 220 }}>{r.description}</div>
                  </td>
                  <td style={{ padding: "8px 6px" }}>
                    {MISSION_TYPE_LABELS[r.type as keyof typeof MISSION_TYPE_LABELS] ?? r.type}
                    {r.resets ? <div style={{ color: "#6b7280" }}>Reseta</div> : null}
                  </td>
                  <td style={{ padding: "8px 6px" }}>{MISSION_CRITERION_LABELS[r.criterion] ?? r.criterion}</td>
                  <td style={{ padding: "8px 6px", textAlign: "right", fontWeight: 700 }}>{r.targetValue}</td>
                  <td style={{ padding: "8px 6px" }}>{formatMissionReward(r.rewardType, r.rewardValue)}</td>
                  <td style={{ padding: "8px 6px" }}>
                    <button
                      type="button"
                      onClick={() => void toggleActive(r)}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: r.isActive ? "var(--brand)" : "#6b7280",
                        fontWeight: 800,
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      {r.isActive ? "Ativa" : "Inativa"}
                    </button>
                  </td>
                  <td style={{ padding: "8px 6px" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button type="button" aria-label="Editar" onClick={() => openEdit(r)} style={{ padding: 6, borderRadius: 8, border: "1px solid var(--border)", background: "#fff", cursor: "pointer", color: "var(--brand)" }}>
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
                        style={{ padding: 6, borderRadius: 8, border: "1px solid #fecaca", background: "#fff", cursor: "pointer", color: "#b91c1c" }}
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
          <div role="presentation" onClick={() => setDeleteId(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100 }} />
          <div style={{ position: "fixed", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: "min(360px, 92vw)", background: "var(--surface)", borderRadius: 16, padding: 20, zIndex: 101, boxShadow: "0 20px 50px rgba(0,0,0,0.15)" }}>
            <p style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 16 }}>Excluir missão &quot;{editing?.title}&quot;?</p>
            <p style={{ margin: "0 0 16px", fontSize: 14, color: "#6b7280" }}>O progresso dos usuários nessa missão também será apagado. Para manter o histórico, apenas desative.</p>
            {error ? <p style={{ color: "#b91c1c", fontWeight: 600, fontSize: 13 }}>{error}</p> : null}
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={() => setDeleteId(null)} disabled={loading} style={{ flex: 1, padding: 12, borderRadius: 10, border: "1px solid var(--border)", background: "#fff", fontWeight: 700, cursor: "pointer" }}>
                Cancelar
              </button>
              <button type="button" onClick={() => void handleDelete()} disabled={loading} style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", background: "#b91c1c", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
                {loading ? "Excluindo…" : "Excluir"}
              </button>
            </div>
          </div>
        </>
      ) : null}

      {mode ? (
        <>
          <div role="presentation" onClick={closeModal} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100 }} />
          <div role="dialog" style={{ position: "fixed", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: "min(440px, calc(100vw - 24px))", maxHeight: "90vh", overflow: "auto", background: "var(--surface)", borderRadius: 16, padding: 20, zIndex: 101, boxShadow: "0 20px 50px rgba(0,0,0,0.15)", border: "1px solid var(--border)" }}>
            <h2 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800 }}>
              {mode === "create" ? "Nova missão" : "Editar missão"}
            </h2>
            {error ? (
              <div style={{ marginBottom: 12, padding: 10, borderRadius: 10, background: "#fef2f2", color: "#b91c1c", fontSize: 13, fontWeight: 600 }}>{error}</div>
            ) : null}
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
              <label style={{ display: "grid", gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>Título</span>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required style={inputStyle} />
              </label>
              <label style={{ display: "grid", gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>Descrição</span>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
              </label>
              <label style={{ display: "grid", gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>Tipo</span>
                <select
                  value={form.type}
                  onChange={(e) => {
                    const type = e.target.value;
                    setForm((f) => ({ ...f, type, resets: type === "semanal" }));
                  }}
                  style={inputStyle}
                >
                  {MISSION_TYPES.map((t) => (
                    <option key={t} value={t}>{MISSION_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </label>
              <label style={{ display: "grid", gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>Critério</span>
                <select value={form.criterion} onChange={(e) => setForm((f) => ({ ...f, criterion: e.target.value }))} style={inputStyle}>
                  {MISSION_CRITERIA.map((c) => (
                    <option key={c} value={c}>{MISSION_CRITERION_LABELS[c]}</option>
                  ))}
                  <option value="custom">Outro (personalizado)</option>
                </select>
              </label>
              {form.criterion === "custom" ? (
                <label style={{ display: "grid", gap: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>Chave do critério (ex.: convite_whatsapp)</span>
                  <input value={form.customCriterion} onChange={(e) => setForm((f) => ({ ...f, customCriterion: e.target.value }))} required placeholder="meu_criterio" style={inputStyle} />
                </label>
              ) : null}
              <label style={{ display: "grid", gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>Meta (número)</span>
                <input value={form.targetValue} onChange={(e) => setForm((f) => ({ ...f, targetValue: e.target.value }))} required style={inputStyle} />
              </label>
              <label style={{ display: "grid", gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>Tipo de recompensa</span>
                <select value={form.rewardType} onChange={(e) => setForm((f) => ({ ...f, rewardType: e.target.value }))} style={inputStyle}>
                  {MISSION_REWARD_TYPES.map((t) => (
                    <option key={t} value={t}>{MISSION_REWARD_LABELS[t]}</option>
                  ))}
                </select>
              </label>
              <label style={{ display: "grid", gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>Valor da recompensa</span>
                <input value={form.rewardValue} onChange={(e) => setForm((f) => ({ ...f, rewardValue: e.target.value }))} required style={inputStyle} />
              </label>
              <label style={{ display: "grid", gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>Ícone</span>
                <select value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} style={inputStyle}>
                  {MISSION_ICONS.map((i) => (
                    <option key={i} value={i}>{MISSION_ICON_LABELS[i]}</option>
                  ))}
                </select>
              </label>
              <label style={{ display: "grid", gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>Ordem de exibição</span>
                <input type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))} style={inputStyle} />
              </label>
              <label style={{ display: "grid", gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>Nível do indicado (1=direto, 2 ou 3)</span>
                <input type="number" min={1} max={3} value={form.requiredLevel} onChange={(e) => setForm((f) => ({ ...f, requiredLevel: e.target.value }))} style={inputStyle} />
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input type="checkbox" checked={form.resets} onChange={(e) => setForm((f) => ({ ...f, resets: e.target.checked }))} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Reseta toda segunda-feira</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Missão ativa</span>
              </label>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button type="button" onClick={closeModal} disabled={loading} style={{ flex: 1, padding: 12, borderRadius: 10, border: "1px solid var(--border)", background: "#fff", fontWeight: 700, cursor: "pointer" }}>
                  Cancelar
                </button>
                <button type="submit" disabled={loading} style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", background: "var(--brand)", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
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
