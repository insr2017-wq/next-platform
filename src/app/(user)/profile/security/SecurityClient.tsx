"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff } from "lucide-react";
import { Page } from "@/components/layout/Page";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function SecurityClient() {
  const router = useRouter();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setError("Preencha todos os campos.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("As novas senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Não foi possível alterar a senha.");
        return;
      }
      setSuccess(typeof data.message === "string" ? data.message : "Senha atualizada com sucesso!");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      router.refresh();
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  const field = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    show: boolean,
    setShow: (v: boolean) => void,
    auto: string,
  ) => (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-muted)" }}>{label}</span>
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={auto}
          style={{
            width: "100%",
            boxSizing: "border-box",
            border: "1px solid var(--border)",
            borderRadius: 14,
            background: "var(--bg)",
            color: "var(--text)",
            padding: "13px 42px 13px 12px",
            fontSize: 14,
            fontWeight: 700,
            outline: "none",
          }}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          aria-label={show ? "Ocultar senha" : "Mostrar senha"}
          style={{
            appearance: "none",
            position: "absolute",
            top: "50%",
            right: 10,
            transform: "translateY(-50%)",
            border: 0,
            background: "transparent",
            color: "var(--text-muted)",
            cursor: "pointer",
            padding: 4,
          }}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </label>
  );

  return (
    <Page title="Segurança da conta" backHref="/profile" headerTone="brand">
      <Card>
        <div style={{ padding: 16, display: "grid", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                display: "grid",
                placeItems: "center",
                background: "var(--brand-light)",
                border: "1px solid var(--brand-border)",
                color: "var(--brand)",
              }}
            >
              <Lock size={18} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: "var(--text)" }}>Trocar senha</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>
                Atualize suas credenciais de acesso
              </div>
            </div>
          </div>
          <form onSubmit={(e) => void handleSave(e)} style={{ display: "grid", gap: 12 }}>
            {field(
              "Senha atual",
              form.currentPassword,
              (v) => setForm({ ...form, currentPassword: v }),
              showCurrent,
              setShowCurrent,
              "current-password",
            )}
            {field(
              "Nova senha",
              form.newPassword,
              (v) => setForm({ ...form, newPassword: v }),
              showNew,
              setShowNew,
              "new-password",
            )}
            {field(
              "Confirmar nova senha",
              form.confirmPassword,
              (v) => setForm({ ...form, confirmPassword: v }),
              showConfirm,
              setShowConfirm,
              "new-password",
            )}
            {error ? (
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--danger)" }}>{error}</div>
            ) : null}
            {success ? (
              <div style={{ fontSize: 12, fontWeight: 700, color: "#86efac" }}>{success}</div>
            ) : null}
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? "Salvando…" : "Salvar senha"}
            </Button>
          </form>
        </div>
      </Card>
    </Page>
  );
}
