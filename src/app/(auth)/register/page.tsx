"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

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
  value: string;
  onChange: (value: string) => void;
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
          value={value}
          onChange={(e) => onChange(e.target.value)}
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

export default function RegisterPage() {
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const initial = params.get("invite");
    if (initial) {
      setInviteCode(initial);
    }
  }, []);

  async function handleRegister() {
    setError("");
    if (!phone.trim()) {
      setError("Informe o número de telefone.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          password,
          confirmPassword,
          inviteCode: inviteCode.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao cadastrar.");
        return;
      }
      router.push("/login");
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
        <div style={{ fontSize: 20, fontWeight: 900 }}>Cadastro</div>
        <div
          style={{
            fontSize: 13,
            color: "rgba(75,85,99,1)",
          }}
        >
          Crie sua conta para começar.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <button
          type="button"
          onClick={() => router.push("/login")}
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
          Entrar
        </button>
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
          Cadastro
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
        <TextField
          label="Confirmar senha"
          placeholder="Repita a senha para confirmar"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
        />
        <div style={{ display: "grid", gap: 4 }}>
          <TextField
            label="Código de convite"
            placeholder="Informe o código de convite (se tiver)"
            value={inviteCode}
            onChange={setInviteCode}
          />
          <div
            style={{
              fontSize: 12,
              color: "rgba(107,114,128,1)",
            }}
          >
            Se você recebeu um convite, informe o código acima.
          </div>
        </div>
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
        onClick={handleRegister}
      >
        {loading ? "Cadastrando…" : "Cadastrar"}
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
        Já tem uma conta?{" "}
        <span style={{ color: "var(--brand)" }}>Entrar</span>
      </button>
    </div>
  );
}

