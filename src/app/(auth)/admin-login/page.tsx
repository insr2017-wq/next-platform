"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { markSessionActive } from "@/components/auth/SessionGate";
import { ADMIN_LOGIN_PATH } from "@/lib/routes";

function AuthHeaderCard() {
  return (
    <Card>
      <div
        style={{
          padding: 24,
          display: "grid",
          justifyItems: "center",
          alignItems: "center",
          background: "var(--surface)",
        }}
      >
        <img
          src="/logo.png"
          alt="Logo"
          style={{
            maxWidth: "100%",
            width: 200,
            height: "auto",
            objectFit: "contain",
          }}
        />
      </div>
    </Card>
  );
}

function TextField({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  type?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 900,
          color: "rgba(17,24,39,0.80)",
        }}
      >
        {label}
      </div>
      <label
        style={{
          border: "1px solid rgba(229,231,235,0.95)",
          borderRadius: 14,
          background: "#fff",
          padding: "0 12px",
          boxShadow: "0 4px 12px rgba(17,24,39,0.04)",
        }}
      >
        <input
          type={type}
          placeholder={placeholder}
          value={value ?? ""}
          onChange={(e) => onChange?.(e.target.value)}
          style={{
            width: "100%",
            border: 0,
            outline: "none",
            padding: "13px 0",
            fontSize: 14,
            fontWeight: 700,
            color: "rgba(17,24,39,0.88)",
            background: "transparent",
          }}
        />
      </label>
    </div>
  );
}

const isDev = process.env.NODE_ENV === "development";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [devSecret, setDevSecret] = useState("");
  const [devLoading, setDevLoading] = useState(false);
  const [devError, setDevError] = useState("");

  useEffect(() => {
    const fromUrl = searchParams.get("phone")?.trim();
    if (fromUrl) setPhone(fromUrl);
  }, [searchParams]);

  async function handleLogin() {
    setError("");
    if (!phone.trim() || !password) {
      setError("Informe telefone e senha.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao entrar.");
        return;
      }
      markSessionActive();
      router.push(data.redirectTo ?? "/admin/dashboard");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDevAdminLogin() {
    setDevError("");
    if (!devSecret.trim()) {
      setDevError("Informe a chave local.");
      return;
    }
    setDevLoading(true);
    try {
      const res = await fetch("/api/auth/dev-admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: devSecret.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDevError(data.error ?? "Não foi possível entrar.");
        return;
      }
      markSessionActive();
      router.push(data.redirectTo ?? "/admin/dashboard");
    } catch {
      setDevError("Erro de conexão. Tente novamente.");
    } finally {
      setDevLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <AuthHeaderCard />

      <div style={{ display: "grid", gap: 4 }}>
        <div style={{ fontSize: 20, fontWeight: 900 }}>Painel administrativo</div>
        <div
          style={{
            fontSize: 13,
            color: "rgba(75,85,99,1)",
          }}
        >
          Única entrada para administradores ({ADMIN_LOGIN_PATH}).
        </div>
      </div>

      {error ? (
        <div
          style={{
            fontSize: 13,
            color: "#b91c1c",
            fontWeight: 700,
          }}
        >
          {error}
        </div>
      ) : null}

      <div style={{ display: "grid", gap: 12 }}>
        <TextField
          label="Número de telefone"
          placeholder="Telefone da conta admin"
          value={phone}
          onChange={setPhone}
        />
        <TextField
          label="Senha"
          placeholder="Senha"
          type="password"
          value={password}
          onChange={setPassword}
        />
      </div>

      <Button
        type="button"
        fullWidth
        disabled={loading}
        style={{
          borderRadius: 999,
          padding: "15px 16px",
          fontSize: 15,
          fontWeight: 900,
          boxShadow: "0 10px 20px var(--brand-shadow)",
        }}
        onClick={handleLogin}
      >
        {loading ? "Entrando…" : "Entrar no painel"}
      </Button>

      <button
        type="button"
        onClick={() => router.push("/login")}
        style={{
          border: "none",
          background: "transparent",
          fontSize: 13,
          fontWeight: 700,
          color: "rgba(55,65,81,0.80)",
          textAlign: "center",
          cursor: "pointer",
        }}
      >
        É usuário? <span style={{ color: "var(--brand)" }}>Entrar no app</span>
      </button>

      {isDev ? (
        <div
          style={{
            marginTop: 8,
            padding: 14,
            borderRadius: 14,
            border: "1px dashed rgba(107,114,128,0.45)",
            background: "rgba(249,250,251,0.9)",
            display: "grid",
            gap: 10,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(75,85,99,1)" }}>
            Desenvolvimento — login rápido (chave local)
          </div>
          <div style={{ fontSize: 12, color: "rgba(75,85,99,0.9)", lineHeight: 1.45 }}>
            Defina <code style={{ fontSize: 11 }}>ADMIN_DEV_BYPASS</code> no{" "}
            <code style={{ fontSize: 11 }}>.env</code> (mín. 8 caracteres). URL com telefone:{" "}
            <code style={{ fontSize: 11 }}>{ADMIN_LOGIN_PATH}?phone=</code>
          </div>
          <TextField
            label="Chave local (ADMIN_DEV_BYPASS)"
            placeholder="Mesma chave do .env"
            type="password"
            value={devSecret}
            onChange={setDevSecret}
          />
          {devError ? (
            <div style={{ fontSize: 12, color: "#b91c1c", fontWeight: 700 }}>{devError}</div>
          ) : null}
          <Button
            type="button"
            fullWidth
            disabled={devLoading}
            style={{
              borderRadius: 999,
              padding: "12px 16px",
              fontSize: 14,
              fontWeight: 800,
            }}
            onClick={handleDevAdminLogin}
          >
            {devLoading ? "Entrando…" : "Entrar como admin (sem telefone/senha)"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Carregando…</div>}>
      <AdminLoginForm />
    </Suspense>
  );
}
