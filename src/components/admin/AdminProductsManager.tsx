"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { formatDateBr } from "@/lib/datetime-br";

export type ProductRow = {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  dailyYield: number;
  cycleDays: number;
  totalReturn: number;
  isActive: boolean;
  createdAt: string;
};

type Props = { initialRows: ProductRow[] };

function formatBRL(n: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(n);
}

type ModalMode = "create" | "edit" | null;

export function AdminProductsManager({ initialRows }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [mode, setMode] = useState<ModalMode>(null);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [dailyYield, setDailyYield] = useState("");
  const [cycleDays, setCycleDays] = useState("");
  const [totalReturn, setTotalReturn] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(null);
      return;
    }
    const u = URL.createObjectURL(imageFile);
    setImagePreviewUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [imageFile]);

  const openCreate = useCallback(() => {
    setMode("create");
    setEditing(null);
    setName("");
    setImageFile(null);
    setPrice("");
    setDailyYield("");
    setCycleDays("30");
    setTotalReturn("");
    setIsActive(true);
    setError("");
    setSuccess("");
    setDeleteId(null);
  }, []);

  const openEdit = useCallback((r: ProductRow) => {
    setMode("edit");
    setEditing(r);
    setName(r.name);
    setImageFile(null);
    setPrice(String(r.price).replace(".", ","));
    setDailyYield(String(r.dailyYield).replace(".", ","));
    setCycleDays(String(r.cycleDays));
    setTotalReturn(String(r.totalReturn).replace(".", ","));
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

  function buildFormData(): FormData {
    const fd = new FormData();
    fd.append("name", name.trim());
    fd.append("price", price.replace(",", "."));
    fd.append("dailyYield", dailyYield.replace(",", "."));
    fd.append("cycleDays", String(parseInt(cycleDays, 10) || 1));
    fd.append("totalReturn", totalReturn.replace(",", "."));
    fd.append("isActive", isActive ? "true" : "false");
    if (imageFile) fd.append("image", imageFile);
    return fd;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      if (mode === "create") {
        const res = imageFile
          ? await fetch("/api/admin/products", {
              method: "POST",
              body: buildFormData(),
            })
          : await fetch("/api/admin/products", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: name.trim(),
                price: price.replace(",", "."),
                dailyYield: dailyYield.replace(",", "."),
                cycleDays: parseInt(cycleDays, 10) || 1,
                totalReturn: totalReturn.replace(",", "."),
                isActive,
              }),
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
        window.location.reload();
        return;
      }
      if (mode === "edit" && editing) {
        const res = imageFile
          ? await fetch(`/api/admin/products/${editing.id}`, {
              method: "PATCH",
              body: buildFormData(),
            })
          : await fetch(`/api/admin/products/${editing.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: name.trim(),
                price: price.replace(",", "."),
                dailyYield: dailyYield.replace(",", "."),
                cycleDays: parseInt(cycleDays, 10) || 1,
                totalReturn: totalReturn.replace(",", "."),
                isActive,
              }),
            });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(typeof data.error === "string" ? data.error : "Erro ao salvar.");
          return;
        }
        setSuccess(data.message ?? "Atualizado.");
        const pr = parseFloat(price.replace(",", "."));
        const dy = parseFloat(dailyYield.replace(",", "."));
        const tr = parseFloat(totalReturn.replace(",", "."));
        const cd = parseInt(cycleDays, 10) || 1;
        const newImg =
          typeof data.imageUrl === "string" && data.imageUrl
            ? data.imageUrl
            : editing.imageUrl;
        setImageFile(null);
        setRows((prev) =>
          prev.map((r) =>
            r.id === editing.id
              ? {
                  ...r,
                  name: name.trim(),
                  imageUrl: newImg,
                  price: pr,
                  dailyYield: dy,
                  cycleDays: cd,
                  totalReturn: tr,
                  isActive,
                }
              : r
          )
        );
        setEditing((prev) =>
          prev && prev.id === editing.id ? { ...prev, imageUrl: newImg } : prev
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
      const res = await fetch(`/api/admin/products/${deleteId}`, { method: "DELETE" });
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

  function thumbUrl(u: string) {
    const t = u?.trim() ?? "";
    if (t.startsWith("http://") || t.startsWith("https://") || t.startsWith("/")) return t;
    return null;
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
          Novo produto
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
          Nenhum produto cadastrado. Use &quot;Novo produto&quot; para criar.
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
              fontSize: 11,
            }}
          >
            <thead>
              <tr style={{ background: "var(--app-bg)", borderBottom: "1px solid var(--border)" }}>
                <th style={{ padding: 8, width: 56 }}>Img</th>
                <th style={{ padding: 8, textAlign: "left", fontWeight: 600 }}>Nome</th>
                <th style={{ padding: 8, textAlign: "right", fontWeight: 600 }}>Preço</th>
                <th style={{ padding: 8, textAlign: "right", fontWeight: 600 }}>Diário</th>
                <th style={{ padding: 8, textAlign: "center", fontWeight: 600 }}>Ciclo</th>
                <th style={{ padding: 8, textAlign: "right", fontWeight: 600 }}>Total</th>
                <th style={{ padding: 8, fontWeight: 600 }}>Status</th>
                <th style={{ padding: 8, fontWeight: 600 }}>Criado</th>
                <th style={{ padding: 8, width: 80 }} />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const thumb = thumbUrl(r.imageUrl);
                return (
                  <tr key={r.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: 6 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          overflow: "hidden",
                          background: "#f3f4f6",
                        }}
                      >
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumb}
                            alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              display: "grid",
                              placeItems: "center",
                              fontSize: 10,
                              color: "#9ca3af",
                            }}
                          >
                            —
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: 8, fontWeight: 700, maxWidth: 100 }}>{r.name}</td>
                    <td style={{ padding: 8, textAlign: "right" }}>{formatBRL(r.price)}</td>
                    <td style={{ padding: 8, textAlign: "right" }}>{formatBRL(r.dailyYield)}</td>
                    <td style={{ padding: 8, textAlign: "center" }}>{r.cycleDays} d</td>
                    <td style={{ padding: 8, textAlign: "right" }}>{formatBRL(r.totalReturn)}</td>
                    <td style={{ padding: 8 }}>
                      <span style={{ color: r.isActive ? "var(--brand)" : "#6b7280", fontWeight: 700 }}>
                        {r.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td style={{ padding: 8, color: "#6b7280" }}>
                      {formatDateBr(r.createdAt)}
                    </td>
                    <td style={{ padding: 8 }}>
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
                );
              })}
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
              Excluir produto &quot;{editing?.name}&quot;?
            </p>
            <p style={{ margin: "0 0 16px", fontSize: 14, color: "#6b7280" }}>
              Compras já registradas dos usuários podem ficar inconsistentes. Confirme se deseja
              prosseguir.
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
              width: "min(420px, calc(100vw - 24px))",
              maxHeight: "92vh",
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
              {mode === "create" ? "Novo produto" : "Editar produto"}
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
                <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>Nome</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    fontSize: 14,
                  }}
                />
              </label>
              <div style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>
                  Imagem do produto (opcional)
                </span>
                {(mode === "edit" && editing?.imageUrl && !imagePreviewUrl) ||
                (mode === "create" && imagePreviewUrl) ? (
                  <div
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 10,
                      overflow: "hidden",
                      border: "1px solid var(--border)",
                      background: "#f3f4f6",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreviewUrl ?? editing?.imageUrl ?? ""}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                ) : null}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                  style={{ fontSize: 13 }}
                />
                <span style={{ fontSize: 11, color: "#6b7280" }}>
                  JPG, PNG, WebP ou GIF. Máx. 5 MB. Na edição, envie só se quiser trocar a imagem.
                </span>
              </div>
              <label style={{ display: "grid", gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>
                  Preço (R$)
                </span>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
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
                  Rendimento diário (R$)
                </span>
                <input
                  value={dailyYield}
                  onChange={(e) => setDailyYield(e.target.value)}
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
                  Ciclo (dias)
                </span>
                <input
                  type="number"
                  min={1}
                  value={cycleDays}
                  onChange={(e) => setCycleDays(e.target.value)}
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
                  Retorno total (R$)
                </span>
                <input
                  value={totalReturn}
                  onChange={(e) => setTotalReturn(e.target.value)}
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
                style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
              >
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Produto ativo (visível na loja)</span>
              </label>
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
