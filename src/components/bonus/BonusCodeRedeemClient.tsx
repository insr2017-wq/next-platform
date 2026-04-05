"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

function formatBRL(n: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function BonusCodeRedeemClient() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submit = useCallback(async () => {
    setError("");
    setSuccess("");
    const trimmed = code.trim();
    if (!trimmed) {
      setError("Informe o código bônus.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/bonus-code/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = (await res.json()) as {
        error?: string;
        success?: boolean;
        amount?: number;
        message?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Não foi possível resgatar o código.");
        return;
      }
      if (typeof data.amount === "number") {
        setSuccess(
          `Parabéns! Você recebeu ${formatBRL(data.amount)} em saldo. O valor já está disponível na sua conta.`
        );
        setCode("");
        router.refresh();
      } else {
        setSuccess(data.message ?? "Código resgatado com sucesso!");
        router.refresh();
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [code, router]);

  return (
    <>
      <div style={{ width: "100%", maxWidth: "var(--container-max)" }}>
        <Card>
          <div
            style={{
              padding: 22,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 900,
                color: "rgba(17,24,39,0.80)",
              }}
            >
              Código bônus
            </div>
            <label
              style={{
                width: "100%",
                border: "2px solid var(--brand-border)",
                borderRadius: 14,
                background: "#fff",
                padding: "0 14px",
                boxShadow: "0 4px 14px rgba(17,24,39,0.06)",
              }}
            >
              <input
                type="text"
                placeholder="Informe o código bônus"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void submit();
                }}
                autoComplete="off"
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
            {error ? (
              <div
                role="alert"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "#fef2f2",
                  color: "#b91c1c",
                  fontSize: 13,
                  fontWeight: 700,
                  lineHeight: 1.4,
                }}
              >
                {error}
              </div>
            ) : null}
            {success ? (
              <div
                role="status"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "rgba(var(--brand-rgb), 0.08)",
                  border: "1px solid var(--brand-border)",
                  color: "rgba(17,24,39,0.9)",
                  fontSize: 13,
                  fontWeight: 700,
                  lineHeight: 1.45,
                }}
              >
                {success}
              </div>
            ) : null}
          </div>
        </Card>
      </div>

      <div style={{ width: "100%", display: "flex", justifyContent: "center", paddingTop: 4 }}>
        <Button
          type="button"
          fullWidth
          disabled={loading}
          onClick={() => void submit()}
          style={{
            borderRadius: 999,
            padding: "16px 20px",
            fontSize: 16,
            fontWeight: 900,
            boxShadow: "0 10px 24px var(--brand-shadow)",
            maxWidth: 320,
          }}
        >
          {loading ? "Resgatando…" : "Resgatar código"}
        </Button>
      </div>
    </>
  );
}
