"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/admin/EmptyState";

const formatBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

const depositStatusLabel: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  failed: "Falhou / Não pago",
};

export type AdminUserManagementInitialData = {
  user: {
    id: string;
    publicId: string;
    phone: string;
    role: string;
    banned: boolean;
    sponsoredUser: boolean;
    balance: number;
    createdAt: string;
    pixKeyType: string;
    pixKey: string;
  };
  deposits: { id: string; amount: number; status: string; createdAt: string }[];
  userProducts: {
    id: string;
    productId: string;
    productName: string;
    purchasedAt: string;
    earningStatus: string;
  }[];
  products: { id: string; name: string }[];
};

const cardStyle = {
  background: "var(--surface)",
  borderRadius: 12,
  border: "1px solid var(--border)",
  padding: 16,
  marginBottom: 16,
};
const sectionTitleStyle = {
  fontSize: 12,
  fontWeight: 800,
  color: "#6b7280",
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
  marginBottom: 12,
};

type Props = { initialData: AdminUserManagementInitialData };

export function AdminUserManagementClient({ initialData }: Props) {
  const router = useRouter();
  const [user, setUser] = useState(initialData.user);
  const [deposits] = useState(initialData.deposits);
  const [userProducts, setUserProducts] = useState(initialData.userProducts);

  const [phone, setPhone] = useState(user.phone);
  const [password, setPassword] = useState("");
  const [banned, setBanned] = useState(user.banned);
  const [sponsoredUser, setSponsoredUser] = useState(user.sponsoredUser);
  const [saveMsg, setSaveMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceMsg, setBalanceMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const [pixKeyType, setPixKeyType] = useState(user.pixKeyType || "cpf");
  const [pixKey, setPixKey] = useState(user.pixKey || "");
  const [pixLoading, setPixLoading] = useState(false);
  const [pixMsg, setPixMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [assignProductId, setAssignProductId] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignMsg, setAssignMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [removeLoadingId, setRemoveLoadingId] = useState<string | null>(null);

  const products = initialData.products;

  const refresh = useCallback(() => router.refresh(), [router]);

  async function handleSaveAccount() {
    setSaveLoading(true);
    setSaveMsg(null);
    try {
      const body: Record<string, unknown> = { phone, banned, sponsoredUser };
      if (password.trim()) body.password = password;
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveMsg({
          type: "err",
          text:
            typeof data.error === "string"
              ? `${data.error}${typeof data.detalhe === "string" ? ` (${data.detalhe})` : ""}`
              : "Erro ao salvar.",
        });
        return;
      }
      setUser((prev) => ({
        ...prev,
        phone: phone.replace(/\D/g, "").length >= 10 ? phone.replace(/\D/g, "") : prev.phone,
        banned,
        sponsoredUser,
      }));
      setSaveMsg({ type: "ok", text: "Dados salvos com sucesso." });
      setPassword("");
      refresh();
    } catch {
      setSaveMsg({ type: "err", text: "Erro de conexão." });
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleSavePix() {
    setPixLoading(true);
    setPixMsg(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pixKeyType: pixKeyType || null,
          pixKey: pixKey.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPixMsg({
          type: "err",
          text: typeof data.error === "string" ? data.error : "Erro ao salvar chave Pix.",
        });
        return;
      }
      setUser((prev) => ({ ...prev, pixKeyType: pixKeyType || "", pixKey: pixKey.trim() || "" }));
      setPixMsg({ type: "ok", text: "Chave Pix atualizada." });
      refresh();
    } catch {
      setPixMsg({ type: "err", text: "Erro de conexão." });
    } finally {
      setPixLoading(false);
    }
  }

  async function handleBalance(direction: "add" | "subtract") {
    setBalanceLoading(true);
    setBalanceMsg(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction, amount: balanceAmount.replace(",", ".") }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBalanceMsg({
          type: "err",
          text: typeof data.error === "string" ? data.error : "Não foi possível ajustar o saldo.",
        });
        return;
      }
      const nb = Number(data.balance);
      if (Number.isFinite(nb)) setUser((prev) => ({ ...prev, balance: nb }));
      setBalanceMsg({
        type: "ok",
        text: typeof data.message === "string" ? data.message : "Saldo atualizado.",
      });
      setBalanceAmount("");
      refresh();
    } catch {
      setBalanceMsg({ type: "err", text: "Erro de conexão." });
    } finally {
      setBalanceLoading(false);
    }
  }

  async function handleAssignProduct() {
    if (!assignProductId) {
      setAssignMsg({ type: "err", text: "Selecione um produto." });
      return;
    }
    setAssignLoading(true);
    setAssignMsg(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/assign-product`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: assignProductId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAssignMsg({
          type: "err",
          text: typeof data.error === "string" ? data.error : "Não foi possível atribuir.",
        });
        return;
      }
      const productName = products.find((p) => p.id === assignProductId)?.name ?? "Produto";
      setUserProducts((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          productId: assignProductId,
          productName,
          purchasedAt: new Date().toISOString(),
          earningStatus: "active",
        },
      ]);
      setAssignMsg({
        type: "ok",
        text: typeof data.message === "string" ? data.message : "Produto atribuído.",
      });
      setAssignProductId("");
      refresh();
    } catch {
      setAssignMsg({ type: "err", text: "Erro de conexão." });
    } finally {
      setAssignLoading(false);
    }
  }

  async function handleRemoveProduct(userProductId: string) {
    if (userProductId.startsWith("temp-")) {
      setUserProducts((prev) => prev.filter((p) => p.id !== userProductId));
      return;
    }
    setRemoveLoadingId(userProductId);
    try {
      const res = await fetch(
        `/api/admin/users/${user.id}/products/${userProductId}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAssignMsg({
          type: "err",
          text: typeof data.error === "string" ? data.error : "Não foi possível remover.",
        });
        return;
      }
      setUserProducts((prev) => prev.filter((p) => p.id !== userProductId));
      refresh();
    } catch {
      setAssignMsg({ type: "err", text: "Erro de conexão." });
    } finally {
      setRemoveLoadingId(null);
    }
  }

  async function handleDeleteAccount() {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveMsg({
          type: "err",
          text: typeof data.error === "string" ? data.error : "Erro ao excluir.",
        });
        return;
      }
      window.location.href = "/admin/users";
    } catch {
      setSaveMsg({ type: "err", text: "Erro de conexão." });
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800 }}>
        Gerenciar usuário
      </h1>

      {/* Informações da conta */}
      <section style={cardStyle}>
        <div style={sectionTitleStyle}>Informações da conta</div>
        <div
          style={{
            display: "grid",
            gap: 10,
            marginBottom: 14,
            fontSize: 14,
            color: "rgba(17,24,39,0.9)",
          }}
        >
          <div>
            <strong>ID:</strong>{" "}
            <span
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              }}
            >
              {user.publicId || "—"}
            </span>
          </div>
          <div>
            <strong>Telefone (login):</strong> {user.phone}
          </div>
          <div>
            <strong>Status:</strong>{" "}
            <span style={{ color: user.banned ? "#b91c1c" : "#166534", fontWeight: 700 }}>
              {user.banned ? "Banido" : "Ativo"}
            </span>
          </div>
          <div>
            <strong>Data de cadastro:</strong>{" "}
            {new Date(user.createdAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </div>
        </div>
        <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
          <label style={{ display: "grid", gap: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>
              Telefone (login)
            </span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
              Nova senha (opcional)
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mín. 6 caracteres"
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                fontSize: 14,
              }}
            />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={banned}
              onChange={(e) => setBanned(e.target.checked)}
            />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Conta banida (suspensa)</span>
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={sponsoredUser}
              onChange={(e) => setSponsoredUser(e.target.checked)}
            />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Usuário patrocinado</span>
          </label>
        </div>
        {saveMsg && (
          <div
            style={{
              marginBottom: 10,
              padding: 10,
              borderRadius: 10,
              background: saveMsg.type === "ok" ? "var(--brand-light)" : "#fef2f2",
              color: saveMsg.type === "ok" ? "var(--brand)" : "#b91c1c",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {saveMsg.text}
          </div>
        )}
        <button
          type="button"
          disabled={saveLoading}
          onClick={handleSaveAccount}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "none",
            background: "var(--brand)",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          {saveLoading ? "Salvando…" : "Salvar alterações"}
        </button>
      </section>

      {/* Saldo */}
      <section style={cardStyle}>
        <div style={sectionTitleStyle}>Saldo</div>
        <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 12 }}>
          {formatBRL(user.balance)}
        </div>
        <input
          value={balanceAmount}
          onChange={(e) => setBalanceAmount(e.target.value)}
          placeholder="Valor (R$)"
          inputMode="decimal"
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid var(--border)",
            fontSize: 14,
            marginBottom: 10,
            boxSizing: "border-box",
          }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            disabled={balanceLoading}
            onClick={() => handleBalance("add")}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: 10,
              border: "none",
              background: "#166534",
              color: "#fff",
              fontWeight: 800,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            {balanceLoading ? "…" : "Adicionar saldo"}
          </button>
          <button
            type="button"
            disabled={balanceLoading}
            onClick={() => handleBalance("subtract")}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: 10,
              border: "1px solid #fecaca",
              background: "#fff",
              color: "#b91c1c",
              fontWeight: 800,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            {balanceLoading ? "…" : "Retirar saldo"}
          </button>
        </div>
        {balanceMsg && (
          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              fontWeight: 700,
              color: balanceMsg.type === "ok" ? "#166534" : "#b91c1c",
            }}
          >
            {balanceMsg.text}
          </div>
        )}
      </section>

      {/* Produtos adquiridos */}
      <section style={cardStyle}>
        <div style={sectionTitleStyle}>Produtos adquiridos</div>
        {userProducts.length === 0 ? (
          <EmptyState message="Nenhum produto atribuído." />
        ) : (
          <ul style={{ listStyle: "none", margin: "0 0 14px", padding: 0 }}>
            {userProducts.map((up) => (
              <li
                key={up.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderBottom: "1px solid var(--border)",
                  gap: 8,
                }}
              >
                <span style={{ fontWeight: 600, fontSize: 14 }}>{up.productName}</span>
                <button
                  type="button"
                  disabled={removeLoadingId === up.id}
                  onClick={() => handleRemoveProduct(up.id)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: "1px solid #fecaca",
                    background: "#fff",
                    color: "#b91c1c",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  {removeLoadingId === up.id ? "…" : "Remover"}
                </button>
              </li>
            ))}
          </ul>
        )}
        <div style={{ display: "grid", gap: 8 }}>
          <select
            value={assignProductId}
            onChange={(e) => setAssignProductId(e.target.value)}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              fontSize: 14,
              background: "#fff",
            }}
          >
            <option value="">Selecione um produto…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={assignLoading || products.length === 0}
            onClick={handleAssignProduct}
            style={{
              padding: "10px",
              borderRadius: 10,
              border: "none",
              background: "var(--brand)",
              color: "#fff",
              fontWeight: 800,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            {assignLoading ? "Atribuindo…" : "Adicionar produto"}
          </button>
        </div>
        {assignMsg && (
          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              fontWeight: 700,
              color: assignMsg.type === "ok" ? "#166534" : "#b91c1c",
            }}
          >
            {assignMsg.text}
          </div>
        )}
      </section>

      {/* Depósitos */}
      <section style={cardStyle}>
        <div style={sectionTitleStyle}>Depósitos</div>
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 10 }}>
          {deposits.length} depósito(s) registrado(s)
        </div>
        {deposits.length === 0 ? (
          <EmptyState message="Nenhum depósito registrado" />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: "8px 0", textAlign: "left" }}>Valor</th>
                  <th style={{ padding: "8px 0", textAlign: "left" }}>Data</th>
                  <th style={{ padding: "8px 0", textAlign: "left" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {deposits.map((d) => (
                  <tr key={d.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "8px 0", fontWeight: 600 }}>
                      {formatBRL(d.amount)}
                    </td>
                    <td style={{ padding: "8px 0", color: "#6b7280" }}>
                      {new Date(d.createdAt).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td style={{ padding: "8px 0" }}>
                      {depositStatusLabel[d.status] ?? d.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Chave Pix */}
      <section style={cardStyle}>
        <div style={sectionTitleStyle}>Chave Pix</div>
        <div style={{ marginBottom: 12, fontSize: 14 }}>
          <strong>Tipo atual:</strong> {user.pixKeyType || "—"} |{" "}
          <strong>Chave:</strong> {user.pixKey ? "***" + user.pixKey.slice(-4) : "—"}
        </div>
        <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
          <label style={{ display: "grid", gap: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>
              Tipo de chave Pix
            </span>
            <select
              value={pixKeyType}
              onChange={(e) => setPixKeyType(e.target.value)}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                fontSize: 14,
                background: "#fff",
              }}
            >
              <option value="cpf">CPF</option>
              <option value="phone">Telefone</option>
              <option value="email">E-mail</option>
              <option value="random">Chave aleatória</option>
            </select>
          </label>
          <label style={{ display: "grid", gap: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>
              Chave Pix
            </span>
            <input
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="Ex.: CPF, telefone ou e-mail"
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                fontSize: 14,
              }}
            />
          </label>
        </div>
        {pixMsg && (
          <div
            style={{
              marginBottom: 10,
              fontSize: 13,
              fontWeight: 600,
              color: pixMsg.type === "ok" ? "#166534" : "#b91c1c",
            }}
          >
            {pixMsg.text}
          </div>
        )}
        <button
          type="button"
          disabled={pixLoading}
          onClick={handleSavePix}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "none",
            background: "var(--brand)",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          {pixLoading ? "Salvando…" : "Salvar chave Pix"}
        </button>
      </section>

      {/* Ações da conta */}
      <section style={cardStyle}>
        <div style={sectionTitleStyle}>Ações da conta</div>
        {deleteConfirm ? (
          <div
            style={{
              padding: 12,
              borderRadius: 10,
              background: "#fef2f2",
              marginBottom: 12,
            }}
          >
            <p style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: "#b91c1c" }}>
              Excluir esta conta permanentemente? Esta ação não pode ser desfeita.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => setDeleteConfirm(false)}
                disabled={deleteLoading}
                style={{
                  flex: 1,
                  padding: "10px",
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
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 10,
                  border: "none",
                  background: "#b91c1c",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {deleteLoading ? "Excluindo…" : "Confirmar exclusão"}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setDeleteConfirm(true)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: 10,
              border: "1px solid #fecaca",
              background: "#fff",
              color: "#b91c1c",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Excluir conta
          </button>
        )}
      </section>
    </>
  );
}
