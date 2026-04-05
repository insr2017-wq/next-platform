"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { markSessionActive } from "@/components/auth/SessionGate";

function AuthHeaderCard() {
  return (
    <div
      style={{
        display: "grid",
        justifyItems: "stretch",
        marginBottom: 4,
      }}
    >
      <img
        src="/auth-banner.png"
        alt="Trek"
        style={{
          display: "block",
          width: "100%",
          maxWidth: 340,
          height: "auto",
          margin: "0 auto",
          objectFit: "contain",
        }}
      />
    </div>
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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const suspended = searchParams.get("motivo") === "suspensa";
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao entrar.");
        return;
      }
      const to =
        data.redirectTo ??
        (data.role === "admin" ? "/admin/dashboard" : "/home");
      /** Admin: navegação completa para o cookie da API ser aplicado antes do middleware. */
      if (data.role === "admin" || to.startsWith("/admin")) {
        markSessionActive();
        window.location.assign(to);
        return;
      }
      markSessionActive();
      router.push(to);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <AuthHeaderCard />

      <div style={{ display: "grid", gap: 4 }}>
        <div style={{ fontSize: 20, fontWeight: 900 }}>Entrar</div>
        <div
          style={{
            fontSize: 13,
            color: "rgba(75,85,99,1)",
          }}
        >
          Acesse sua conta para continuar.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 900,
            color: "var(--brand)",
            textAlign: "center",
            borderBottom: "2px solid var(--brand)",
            paddingBottom: 6,
          }}
        >
          Entrar
        </div>
        <button
          type="button"
          onClick={() => router.push("/register")}
          style={{
            appearance: "none",
            border: "none",
            background: "transparent",
            fontSize: 14,
            fontWeight: 700,
            color: "rgba(55,65,81,0.65)",
            textAlign: "center",
            paddingBottom: 6,
            borderBottom: "2px solid transparent",
            cursor: "pointer",
          }}
        >
          Cadastro
        </button>
      </div>

      {suspended ? (
        <div
          style={{
            fontSize: 13,
            color: "#b45309",
            fontWeight: 700,
            padding: 12,
            borderRadius: 12,
            background: "#fffbeb",
            border: "1px solid #fde68a",
          }}
        >
          Sua conta foi suspensa. Entre em contato com o suporte.
        </div>
      ) : null}

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
          placeholder="Informe seu número de telefone"
          value={phone}
          onChange={setPhone}
        />
        <TextField
          label="Senha"
          placeholder="Informe sua senha"
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
        {loading ? "Entrando…" : "Entrar"}
      </Button>

      <button
        type="button"
        onClick={() => router.push("/register")}
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
        Não tem uma conta?{" "}
        <span style={{ color: "var(--brand)" }}>Cadastre-se</span>
      </button>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Carregando…</div>}>
      <LoginForm />
    </Suspense>
  );
}
