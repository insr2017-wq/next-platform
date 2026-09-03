"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";

export type RoulettePrizeRow = {
  id: string;
  label: string;
  value: number;
  kind: string;
  probability: number;
  active: boolean;
  chancePercent: number;
};

type Props = { initialRows: RoulettePrizeRow[] };

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  fontSize: 14,
};

export function AdminRouletteManager({ initialRows }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [editing, setEditing] = useState<RoulettePrizeRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [kind, setKind] = useState("balance");
  const [probability, setProbability] = useState("10");
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const preview = useMemo(() => {
    const sum = rows.filter((r) => r.active).reduce((s, r) => s + r.probability, 0);
    return rows.map((r) => ({
      ...r,
      chancePercent: r.active && sum > 0 ? Math.round((r.probability / sum) * 10000) / 100 : 0,
    }));
  }, [rows]);

  function openCreate() {
    setCreating(true);
    setEditing(null);
    setLabel("");
    setValue("1");
    setKind("balance");
    setProbability("10");
    setActive(true);
    setError("");
  }

  function openEdit(row: RoulettePrizeRow) {
    setCreating(false);
    setEditing(row);
    setLabel(row.label);
    setValue(String(row.value).replace(".", ","));
    setKind(row.kind);
    setProbability(String(row.probability));
    setActive(row.active);
    setError("");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const payload = {
      label: label.trim(),
      value: value.replace(",", "."),
      kind,
      probability,
      active,
    };
    try {
      const res = editing
        ? await fetch(`/api/admin/roulette/${editing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/roulette", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Erro ao salvar.");
        return;
      }
      setEditing(null);
      setCreating(false);
      window.location.reload();
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(row: RoulettePrizeRow) {
    await fetch(`/api/admin/roulette/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !row.active }),
    });
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, active: !r.active } : r)));
    router.refresh();
  }

  const modalOpen = creating || Boolean(editing);

  return (
    <div>
      <button
        type="button"
        onClick={openCreate}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
          padding: "12px 16px",
          borderRadius: 12,
          border: "none",
          background: "var(--brand)",
          color: "#fff",
          fontWeight: 800,
          cursor: "pointer",
        }}
      >
        <Plus size={18} /> Novo prêmio
      </button>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "var(--surface)", borderRadius: 12, fontSize: 12 }}>
          <thead>
            <tr style={{ background: "var(--app-bg)" }}>
              <th style={{ padding: 8, textAlign: "left" }}>Prêmio</th>
              <th style={{ padding: 8, textAlign: "right" }}>Valor</th>
              <th style={{ padding: 8 }}>Tipo</th>
              <th style={{ padding: 8, textAlign: "right" }}>Peso</th>
              <th style={{ padding: 8, textAlign: "right" }}>Chance</th>
              <th style={{ padding: 8 }}>Ativo</th>
              <th style={{ padding: 8 }} />
            </tr>
          </thead>
          <tbody>
            {preview.map((r) => (
              <tr key={r.id} style={{ borderTop: "1px solid var(--border)" }}>
                <td style={{ padding: 8, fontWeight: 700 }}>{r.label}</td>
                <td style={{ padding: 8, textAlign: "right" }}>{r.value}</td>
                <td style={{ padding: 8 }}>{r.kind === "extra_spin" ? "Giros extra" : "Saldo"}</td>
                <td style={{ padding: 8, textAlign: "right" }}>{r.probability}</td>
                <td style={{ padding: 8, textAlign: "right", fontWeight: 800 }}>{r.chancePercent.toFixed(2)}%</td>
                <td style={{ padding: 8 }}>
                  <button type="button" onClick={() => void toggleActive(r)} style={{ border: "none", background: "none", fontWeight: 700, color: r.active ? "var(--brand)" : "#6b7280", cursor: "pointer" }}>
                    {r.active ? "Sim" : "Não"}
                  </button>
                </td>
                <td style={{ padding: 8 }}>
                  <button type="button" onClick={() => openEdit(r)} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 6, background: "#fff", cursor: "pointer" }}>
                    <Pencil size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen ? (
        <>
          <div role="presentation" onClick={() => { setCreating(false); setEditing(null); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100 }} />
          <form onSubmit={save} style={{ position: "fixed", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: "min(400px, 92vw)", background: "var(--surface)", borderRadius: 16, padding: 20, zIndex: 101, display: "grid", gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{editing ? "Editar prêmio" : "Novo prêmio"}</h2>
            {error ? <p style={{ color: "#b91c1c", fontWeight: 600 }}>{error}</p> : null}
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>Nome</span>
              <input value={label} onChange={(e) => setLabel(e.target.value)} required style={inputStyle} />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>Valor (R$ ou qtd. de giros)</span>
              <input value={value} onChange={(e) => setValue(e.target.value)} required style={inputStyle} />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>Tipo</span>
              <select value={kind} onChange={(e) => setKind(e.target.value)} style={inputStyle}>
                <option value="balance">Crédito no saldo</option>
                <option value="extra_spin">Giros extra</option>
              </select>
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>Peso / probabilidade</span>
              <input value={probability} onChange={(e) => setProbability(e.target.value)} required style={inputStyle} />
            </label>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
              <span style={{ fontWeight: 600 }}>Ativo no sorteio</span>
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={() => { setCreating(false); setEditing(null); }} style={{ flex: 1, padding: 12, borderRadius: 10, border: "1px solid var(--border)", background: "#fff", fontWeight: 700, cursor: "pointer" }}>Cancelar</button>
              <button type="submit" disabled={loading} style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", background: "var(--brand)", color: "#fff", fontWeight: 700, cursor: "pointer" }}>{loading ? "Salvando…" : "Salvar"}</button>
            </div>
          </form>
        </>
      ) : null}
    </div>
  );
}
