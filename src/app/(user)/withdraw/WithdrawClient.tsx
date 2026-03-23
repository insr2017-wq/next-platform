"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Page } from "@/components/layout/Page";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type PixKeyType = "cpf" | "telefone";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function formatCurrency(value: number) {
  return brl.format(value);
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function maskCPF(value: string) {
  const d = onlyDigits(value).slice(0, 11);
  const p1 = d.slice(0, 3);
  const p2 = d.slice(3, 6);
  const p3 = d.slice(6, 9);
  const p4 = d.slice(9, 11);
  if (d.length <= 3) return p1;
  if (d.length <= 6) return `${p1}.${p2}`;
  if (d.length <= 9) return `${p1}.${p2}.${p3}`;
  return `${p1}.${p2}.${p3}-${p4}`;
}

function maskPhone(value: string) {
  const d = onlyDigits(value).slice(0, 11);
  const ddd = d.slice(0, 2);
  const p1 = d.slice(2, 7);
  const p2 = d.slice(7, 11);
  if (d.length <= 2) return ddd ? `(${ddd}` : "";
  if (d.length <= 7) return `(${ddd}) ${p1}`;
  return `(${ddd}) ${p1}-${p2}`;
}

function FieldLabel({ children }: { children: string }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 900, color: "rgba(17,24,39,0.72)" }}>
      {children}
    </div>
  );
}

function TextField({
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
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
        type="text"
        inputMode={inputMode}
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
  );
}

function MoneyField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        alignItems: "center",
        gap: 10,
        border: "1px solid rgba(229,231,235,0.95)",
        borderRadius: 14,
        background: "#fff",
        padding: "0 12px",
        boxShadow: "0 4px 12px rgba(17,24,39,0.04)",
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 900, color: "rgba(17,24,39,0.65)" }}>
        R$
      </span>
      <input
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(onlyDigits(event.target.value))}
        style={{
          width: "100%",
          border: 0,
          outline: "none",
          padding: "13px 0",
          fontSize: 14,
          fontWeight: 800,
          color: "rgba(17,24,39,0.88)",
          background: "transparent",
        }}
      />
    </label>
  );
}

function SegmentedSelector({
  value,
  onChange,
}: {
  value: PixKeyType;
  onChange: (value: PixKeyType) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        borderRadius: 14,
        border: "1px solid rgba(229,231,235,0.95)",
        background: "#fff",
        padding: 4,
        boxShadow: "0 4px 12px rgba(17,24,39,0.04)",
        gap: 4,
      }}
    >
      {([
        { id: "cpf", label: "CPF" },
        { id: "telefone", label: "Número de telefone" },
      ] as const).map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            style={{
              appearance: "none",
              border: active ? "1px solid var(--brand-border)" : "1px solid transparent",
              background: active ? "var(--brand-light)" : "transparent",
              color: active ? "var(--brand)" : "rgba(17,24,39,0.72)",
              borderRadius: 12,
              padding: "10px 10px",
              fontSize: 13,
              fontWeight: 900,
              cursor: "pointer",
              lineHeight: 1.1,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function WithdrawClient({
  initialBalance,
  canWithdraw,
  blockedMessage,
  initialPixKeyType,
  initialPixKey,
  initialHolderName,
  initialHolderCpf,
  withdrawalFeePercent,
}: {
  initialBalance: number;
  canWithdraw: boolean;
  blockedMessage: string;
  initialPixKeyType: string | null;
  initialPixKey: string | null;
  initialHolderName: string | null;
  initialHolderCpf: string | null;
  withdrawalFeePercent: number;
}) {
  // Armazena apenas dígitos do input (string vazia para UX melhor).
  // Interpretação: "100" => R$ 100,00 (não é centavos).
  const [amountDigits, setAmountDigits] = useState("");
  const [fullName, setFullName] = useState(initialHolderName ?? "");
  const initialDigits = initialPixKey ? onlyDigits(initialPixKey) : "";
  const initialType: PixKeyType = initialPixKeyType === "telefone" ? "telefone" : "cpf";
  const initialHolderCpfDigits = initialHolderCpf ? onlyDigits(initialHolderCpf) : "";

  const [pixType, setPixType] = useState<PixKeyType>(initialType);
  const [pixKeyCpf, setPixKeyCpf] = useState(
    initialType === "cpf" && initialDigits ? maskCPF(initialDigits) : ""
  );
  const [pixKeyPhone, setPixKeyPhone] = useState(
    initialType === "telefone" && initialDigits ? maskPhone(initialDigits) : ""
  );
  const [holderCpf, setHolderCpf] = useState(initialHolderCpfDigits ? maskCPF(initialHolderCpfDigits) : "");

  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [savingPix, setSavingPix] = useState(false);

  const router = useRouter();

  const amountValue = useMemo(() => {
    const n = Number(amountDigits);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [amountDigits]);

  const feePercent = withdrawalFeePercent;
  const feeAmount = useMemo(() => {
    if (amountValue === null) return null;
    return Math.round((amountValue * feePercent) / 100 * 100) / 100;
  }, [amountValue, feePercent]);

  const netAmount = useMemo(() => {
    if (amountValue === null) return null;
    return Math.round((amountValue - (feeAmount ?? 0)) * 100) / 100;
  }, [amountValue, feeAmount]);

  const formattedPreview = useMemo(() => {
    return amountValue !== null ? formatCurrency(amountValue) : "R$ 0,00";
  }, [amountValue]);

  const availableBalanceLabel = formatCurrency(initialBalance);

  const selectedPixKey = pixType === "cpf" ? pixKeyCpf : pixKeyPhone;
  const initialHasSavedPixKey =
    Boolean(initialPixKeyType) &&
    Boolean(initialDigits) &&
    Boolean(initialHolderName && initialHolderName.trim()) &&
    Boolean(initialHolderCpfDigits);

  const [hasSavedPixKey, setHasSavedPixKey] = useState(initialHasSavedPixKey);

  async function handleSavePixKey() {
    if (savingPix) return;
    setError("");
    setSuccess("");

    const pixKeyDigits = onlyDigits(selectedPixKey);
    const holderCpfDigits = onlyDigits(holderCpf);
    const holderName = fullName.trim();

    if (!holderName) {
      setError("Informe o nome do titular.");
      return;
    }
    if (!pixKeyDigits) {
      setError("Informe a chave Pix.");
      return;
    }
    if (!holderCpfDigits) {
      setError("Informe o CPF do titular.");
      return;
    }

    // Validação básica local
    if (pixType === "cpf" && pixKeyDigits.length !== 11) {
      setError("CPF inválido (formato).");
      return;
    }
    if (pixType === "telefone" && !(pixKeyDigits.length === 10 || pixKeyDigits.length === 11)) {
      setError("Telefone inválido (formato).");
      return;
    }
    if (holderCpfDigits.length !== 11) {
      setError("CPF do titular inválido (formato).");
      return;
    }

    setSavingPix(true);
    try {
      const res = await fetch("/api/user/pix-key", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pixKeyType: pixType,
          pixKey: pixKeyDigits,
          holderName,
          holderCpf: holderCpfDigits,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Erro ao salvar a chave Pix.");
        return;
      }

      setHasSavedPixKey(true);
      setSuccess("Chave Pix salva com sucesso.");
      router.refresh();
    } catch {
      setError("Erro de conexão.");
    } finally {
      setSavingPix(false);
    }
  }

  async function handleRemovePixKey() {
    if (savingPix) return;
    setError("");
    setSuccess("");
    setSavingPix(true);
    try {
      const res = await fetch("/api/user/pix-key", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Erro ao remover a chave Pix.");
        return;
      }

      setHasSavedPixKey(false);
      setSuccess("Chave Pix removida.");
      setAmountDigits("");
      setPixType("cpf");
      setPixKeyCpf("");
      setPixKeyPhone("");
      setHolderCpf("");
      setFullName("");
      router.refresh();
    } catch {
      setError("Erro de conexão.");
    } finally {
      setSavingPix(false);
    }
  }

  async function handleRequestWithdrawal() {
    if (submitting) return;
    setError("");
    setSuccess("");

    if (!canWithdraw) {
      setError(blockedMessage);
      return;
    }

    if (amountValue === null) {
      setError("Informe o valor do saque.");
      return;
    }

    const requested = amountValue;
    if (requested > initialBalance) {
      setError("Saldo insuficiente para este saque.");
      return;
    }

    const holderName = fullName.trim();
    const pixKeyDigits = onlyDigits(selectedPixKey);
    const holderCpfDigits = onlyDigits(holderCpf);

    if (!holderName) {
      setError("Informe o nome do titular.");
      return;
    }
    if (!pixKeyDigits) {
      setError("Informe a chave Pix.");
      return;
    }
    if (!holderCpfDigits) {
      setError("Informe o CPF do titular.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/user/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: requested,
          pixKeyType: pixType,
          pixKey: pixKeyDigits,
          holderName,
          holderCpf: holderCpfDigits,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Erro ao solicitar saque.");
        return;
      }

      setSuccess("Saque solicitado. Aguarde a aprovação da administração.");
      setAmountDigits("");
      router.refresh();
    } catch {
      setError("Erro de conexão.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Page title="Saque" backHref="/home" headerTone="brand">
      <div style={{ display: "grid", gap: 12 }}>
        {!canWithdraw && blockedMessage ? (
          <Card>
            <div
              style={{
                padding: 12,
                fontSize: 13,
                fontWeight: 800,
                color: "#92400e",
                background: "#fffbeb",
                borderRadius: 12,
                border: "1px solid #fde68a",
                lineHeight: 1.45,
              }}
            >
              {blockedMessage}
            </div>
          </Card>
        ) : null}

        <Card>
          <div style={{ padding: 12, display: "grid", gap: 5 }}>
            <FieldLabel>Saldo disponível</FieldLabel>
            <div style={{ fontSize: 24, fontWeight: 900, color: "rgba(17,24,39,0.92)" }}>
              {availableBalanceLabel}
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ padding: 12, display: "grid", gap: 10 }}>
            {!hasSavedPixKey ? (
              <>
                <div style={{ display: "grid", gap: 6 }}>
                  <FieldLabel>Nome do titular</FieldLabel>
                  <TextField
                    value={fullName}
                    onChange={(v) => {
                      setFullName(v);
                      setError("");
                    }}
                    placeholder="Informe o nome completo do titular"
                  />
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <FieldLabel>Tipo de chave Pix</FieldLabel>
                  <SegmentedSelector
                    value={pixType}
                    onChange={(v) => {
                      setPixType(v);
                      setError("");
                    }}
                  />
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <FieldLabel>
                    {pixType === "cpf" ? "Chave Pix (CPF)" : "Chave Pix (telefone)"}
                  </FieldLabel>
                  {pixType === "cpf" ? (
                    <TextField
                      value={pixKeyCpf}
                      onChange={(v) => {
                        setPixKeyCpf(maskCPF(v));
                        setError("");
                      }}
                      placeholder="Informe a chave Pix (CPF)"
                      inputMode="numeric"
                    />
                  ) : (
                    <TextField
                      value={pixKeyPhone}
                      onChange={(v) => {
                        setPixKeyPhone(maskPhone(v));
                        setError("");
                      }}
                      placeholder="Informe a chave Pix (telefone)"
                      inputMode="tel"
                    />
                  )}
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <FieldLabel>CPF do titular</FieldLabel>
                  <TextField
                    value={holderCpf}
                    onChange={(v) => {
                      setHolderCpf(maskCPF(v));
                      setError("");
                    }}
                    placeholder="Informe o CPF do titular"
                    inputMode="numeric"
                  />
                </div>

                <Button
                  type="button"
                  fullWidth
                  disabled={savingPix}
                  style={{
                    borderRadius: 999,
                    padding: "15px 16px",
                    fontSize: 15,
                    fontWeight: 900,
                    boxShadow: "0 10px 20px var(--brand-shadow)",
                    opacity: savingPix ? 0.7 : 1,
                  }}
                  onClick={handleSavePixKey}
                >
                  {savingPix ? "Salvando…" : "Salvar chave Pix"}
                </Button>
              </>
            ) : (
              <>
                <div style={{ display: "grid", gap: 6 }}>
                  <FieldLabel>Chave Pix salva</FieldLabel>
                  <div style={{ fontSize: 14, fontWeight: 900, color: "rgba(17,24,39,0.92)" }}>
                    {pixType === "cpf" ? "CPF" : "Telefone"}:{" "}
                    <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
                      {pixType === "cpf" ? pixKeyCpf : pixKeyPhone}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(17,24,39,0.72)", fontWeight: 800 }}>
                    Titular: {fullName || "—"}
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(17,24,39,0.72)", fontWeight: 800 }}>
                    CPF do titular: {holderCpf || "—"}
                  </div>
                  <div style={{ marginTop: 8, display: "flex", gap: 10 }}>
                    <Button
                      type="button"
                      disabled={savingPix}
                      onClick={handleRemovePixKey}
                      style={{
                        borderRadius: 12,
                        padding: "10px 12px",
                        fontSize: 13,
                        fontWeight: 900,
                        border: "1px solid #fecaca",
                        background: "#fff",
                        color: "#b91c1c",
                        boxShadow: "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Remover chave Pix
                    </Button>
                  </div>
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <FieldLabel>Valor do saque</FieldLabel>
                  <MoneyField
                    value={amountDigits}
                    onChange={(v) => {
                      setAmountDigits(v);
                      setError("");
                    }}
                    placeholder="Informe o valor desejado"
                  />
                  <div style={{ fontSize: 12, color: "rgba(17,24,39,0.58)" }}>
                    Valor solicitado: <span style={{ fontWeight: 900 }}>{formattedPreview}</span>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gap: 4,
                      fontSize: 12,
                      color: "rgba(17,24,39,0.58)",
                      marginTop: 4,
                    }}
                  >
                    <div>
                      Taxa de saque:{" "}
                      <span style={{ fontWeight: 900, color: "rgba(17,24,39,0.78)" }}>
                        {feePercent}%
                      </span>
                    </div>
                    <div>
                      Valor líquido a receber:{" "}
                      <span style={{ fontWeight: 900 }}>
                        {netAmount !== null ? formatCurrency(netAmount) : "R$ 0,00"}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>

        {hasSavedPixKey ? (
          <Button
            type="button"
            fullWidth
            disabled={submitting || !canWithdraw}
            style={{
              borderRadius: 999,
              padding: "15px 16px",
              fontSize: 15,
              fontWeight: 900,
              boxShadow: "0 10px 20px var(--brand-shadow)",
              opacity: submitting || !canWithdraw ? 0.7 : 1,
            }}
            onClick={handleRequestWithdrawal}
          >
            {submitting ? "Solicitando…" : "Solicitar saque"}
          </Button>
        ) : null}

        <div
          style={{
            padding: "6px 4px 0",
            display: "grid",
            gap: 4,
            fontSize: 12,
            color: "rgba(17,24,39,0.62)",
            lineHeight: 1.4,
          }}
        >
          {error ? (
            <div
              style={{
                padding: "8px 12px",
                borderRadius: 12,
                border: "1px solid rgba(239,68,68,0.35)",
                background: "rgba(254,226,226,0.7)",
                color: "rgba(185,28,28,1)",
                fontWeight: 900,
              }}
            >
              {error}
            </div>
          ) : null}

          {success ? (
            <div
              style={{
                padding: "8px 12px",
                borderRadius: 12,
                border: "1px solid rgba(22,101,52,0.25)",
                background: "rgba(220,252,231,0.75)",
                color: "rgba(22,101,52,1)",
                fontWeight: 900,
              }}
            >
              {success}
            </div>
          ) : null}

          {hasSavedPixKey ? (
            <>
              <div>Solicitações de saque são analisadas automaticamente.</div>
              <div>
                Certifique-se de que os dados informados estão corretos para evitar atrasos no processamento.
              </div>
            </>
          ) : null}
        </div>
      </div>
    </Page>
  );
}

