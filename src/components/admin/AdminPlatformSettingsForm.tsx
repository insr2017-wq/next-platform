"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Initial = {
  minDeposit: number;
  minWithdrawal: number;
  commissionLevel1: number;
  commissionLevel2: number;
  commissionLevel3: number;
  withdrawalFeePercent: number;
  welcomeModalEnabled: boolean;
  welcomeModalTitle: string;
  welcomeModalText: string;
  welcomeModalLink: string;
  earningsTestMode: boolean;
  earningsTestIntervalMinutes: number;
  vizzionpayPublicKey: string;
  updatedAt: string;
};

type Props = { initial: Initial };

function toInput(n: number | undefined | null): string {
  const x = Number(n);
  if (!Number.isFinite(x)) return "0";
  return String(x).replace(".", ",");
}

function safeUpdatedAt(iso: string | undefined | null): string {
  if (iso && !Number.isNaN(Date.parse(iso))) return iso;
  return new Date().toISOString();
}

export function AdminPlatformSettingsForm({ initial }: Props) {
  const router = useRouter();
  const [minDeposit, setMinDeposit] = useState(toInput(initial?.minDeposit));
  const [minWithdrawal, setMinWithdrawal] = useState(
    toInput(initial?.minWithdrawal)
  );
  const [c1, setC1] = useState(toInput(initial?.commissionLevel1));
  const [c2, setC2] = useState(toInput(initial?.commissionLevel2));
  const [c3, setC3] = useState(toInput(initial?.commissionLevel3));
  const [withdrawalFeePercent, setWithdrawalFeePercent] = useState(
    toInput(initial?.withdrawalFeePercent)
  );

  const [welcomeModalEnabled, setWelcomeModalEnabled] = useState<boolean>(
    Boolean(initial?.welcomeModalEnabled),
  );
  const [welcomeModalTitle, setWelcomeModalTitle] = useState<string>(
    typeof initial?.welcomeModalTitle === "string" ? initial?.welcomeModalTitle : "",
  );
  const [welcomeModalText, setWelcomeModalText] = useState<string>(
    typeof initial?.welcomeModalText === "string" ? initial?.welcomeModalText : "",
  );
  const [welcomeModalLink, setWelcomeModalLink] = useState<string>(
    typeof initial?.welcomeModalLink === "string" ? initial?.welcomeModalLink : "",
  );

  const [earningsTestMode, setEarningsTestMode] = useState<boolean>(
    Boolean(initial?.earningsTestMode),
  );
  const [earningsTestIntervalMinutes, setEarningsTestIntervalMinutes] =
    useState<number>(
      Number.isFinite(initial?.earningsTestIntervalMinutes)
        ? initial?.earningsTestIntervalMinutes
        : 10,
    );

  const [vizzionpayPublicKey, setVizzionpayPublicKey] = useState<string>(
    typeof initial?.vizzionpayPublicKey === "string" ? initial?.vizzionpayPublicKey : "",
  );
  const [vizzionpaySecretKey, setVizzionpaySecretKey] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lastUpdated, setLastUpdated] = useState(
    safeUpdatedAt(initial?.updatedAt)
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/platform-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minDeposit: minDeposit.replace(",", "."),
          minWithdrawal: minWithdrawal.replace(",", "."),
          commissionLevel1: c1.replace(",", "."),
          commissionLevel2: c2.replace(",", "."),
          commissionLevel3: c3.replace(",", "."),
            withdrawalFeePercent: withdrawalFeePercent.replace(",", "."),
            welcomeModalEnabled,
            welcomeModalTitle,
            welcomeModalText,
            welcomeModalLink,
          earningsTestMode,
          earningsTestIntervalMinutes,
          vizzionpayPublicKey: vizzionpayPublicKey.trim(),
          // Secret nunca é retornada pelo GET; se o campo ficar vazio, a API mantém a secret atual.
          vizzionpaySecretKey: vizzionpaySecretKey.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const base =
          typeof data.error === "string" ? data.error : "Erro ao salvar.";
        const det =
          typeof (data as { detalhe?: string }).detalhe === "string"
            ? ` — ${(data as { detalhe: string }).detalhe}`
            : "";
        setError(base + det);
        return;
      }
      setSuccess(data.message ?? "Salvo com sucesso.");
      const fresh = await fetch("/api/admin/platform-settings").then((r) => r.json());
      if (fresh.minDeposit != null) {
        setMinDeposit(toInput(fresh.minDeposit));
        setMinWithdrawal(toInput(fresh.minWithdrawal));
        setC1(toInput(fresh.commissionLevel1));
        setC2(toInput(fresh.commissionLevel2));
        setC3(toInput(fresh.commissionLevel3));
        if (fresh.withdrawalFeePercent != null) setWithdrawalFeePercent(toInput(fresh.withdrawalFeePercent));
        if (fresh.welcomeModalEnabled != null)
          setWelcomeModalEnabled(Boolean(fresh.welcomeModalEnabled));
        if (typeof fresh.welcomeModalTitle === "string") setWelcomeModalTitle(fresh.welcomeModalTitle);
        if (typeof fresh.welcomeModalText === "string") setWelcomeModalText(fresh.welcomeModalText);
        if (typeof fresh.welcomeModalLink === "string") setWelcomeModalLink(fresh.welcomeModalLink);
        if (fresh.earningsTestMode != null) setEarningsTestMode(Boolean(fresh.earningsTestMode));
        if (fresh.earningsTestIntervalMinutes != null) {
          const n = Number(fresh.earningsTestIntervalMinutes);
          setEarningsTestIntervalMinutes(Number.isFinite(n) ? n : 10);
        }
        if (fresh.updatedAt) setLastUpdated(fresh.updatedAt);
        if (typeof fresh.vizzionpayPublicKey === "string") {
          setVizzionpayPublicKey(fresh.vizzionpayPublicKey);
        }
      }
      // Secret não é retornada; limpa o campo após salvar.
      setVizzionpaySecretKey("");
      router.refresh();
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        marginTop: 12,
        background: "var(--surface)",
        borderRadius: 14,
        border: "1px solid var(--border)",
        boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
        padding: 20,
        maxWidth: 480,
      }}
    >
      <h2 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 800 }}>
        Regras da plataforma
      </h2>
      <p style={{ margin: "0 0 20px", fontSize: 13, color: "#6b7280" }}>
        Estes valores serão usados em depósitos, saques e comissões de indicação (níveis 1 a 3).
      </p>

      {error ? (
        <div
          style={{
            marginBottom: 14,
            padding: 12,
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
            marginBottom: 14,
            padding: 12,
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

      <div style={{ display: "grid", gap: 16 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
            Mínimo de depósito (R$)
          </span>
          <input
            value={minDeposit}
            onChange={(e) => setMinDeposit(e.target.value)}
            required
            inputMode="decimal"
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              fontSize: 15,
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
            Mínimo de saque (R$)
          </span>
          <input
            value={minWithdrawal}
            onChange={(e) => setMinWithdrawal(e.target.value)}
            required
            inputMode="decimal"
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              fontSize: 15,
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
            Taxa de saque (%)
          </span>
          <input
            value={withdrawalFeePercent}
            onChange={(e) => setWithdrawalFeePercent(e.target.value)}
            required
            inputMode="decimal"
            placeholder="0 a 100"
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              fontSize: 15,
            }}
          />
        </label>

        <div
          style={{
            paddingTop: 8,
            borderTop: "1px solid var(--border)",
            fontSize: 12,
            fontWeight: 800,
            color: "#6b7280",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          Comissões de indicação (%)
        </div>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
            Nível 1 (indicação direta)
          </span>
          <input
            value={c1}
            onChange={(e) => setC1(e.target.value)}
            required
            inputMode="decimal"
            placeholder="0 a 100"
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              fontSize: 15,
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Nível 2</span>
          <input
            value={c2}
            onChange={(e) => setC2(e.target.value)}
            required
            inputMode="decimal"
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              fontSize: 15,
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Nível 3</span>
          <input
            value={c3}
            onChange={(e) => setC3(e.target.value)}
            required
            inputMode="decimal"
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              fontSize: 15,
            }}
          />
        </label>

        <div
          style={{
            marginTop: 6,
            paddingTop: 14,
            borderTop: "1px solid var(--border)",
            display: "grid",
            gap: 10,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              color: "rgba(22,101,52,1)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Modal de boas-vindas (página inicial)
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              type="checkbox"
              checked={welcomeModalEnabled}
              onChange={(e) => setWelcomeModalEnabled(e.target.checked)}
              style={{
                width: 18,
                height: 18,
                accentColor: "var(--accent)",
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 800, color: "#374151" }}>
              Ativar modal de boas-vindas
            </span>
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 900, color: "#374151" }}>
              Título do modal (opcional)
            </span>
            <input
              value={welcomeModalTitle}
              onChange={(e) => setWelcomeModalTitle(e.target.value)}
              inputMode="text"
              placeholder="Boas-vindas"
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                fontSize: 15,
              }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 900, color: "#374151" }}>
              Texto do modal
            </span>
            <textarea
              value={welcomeModalText}
              onChange={(e) => setWelcomeModalText(e.target.value)}
              placeholder="Escreva a mensagem que deseja exibir aos usuários na página inicial."
              rows={4}
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                fontSize: 14,
                resize: "vertical",
                minHeight: 96,
              }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 900, color: "#374151" }}>Link do grupo</span>
            <input
              value={welcomeModalLink}
              onChange={(e) => setWelcomeModalLink(e.target.value)}
              inputMode="url"
              placeholder="Cole aqui o link do grupo (ex.: WhatsApp/Telegram)"
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                fontSize: 14,
              }}
            />
          </label>

          <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 700, lineHeight: 1.4 }}>
            Se o texto estiver vazio, o modal não será exibido.
          </div>
        </div>

        <div
          style={{
            marginTop: 6,
            paddingTop: 14,
            borderTop: "1px solid var(--border)",
            display: "grid",
            gap: 10,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              color: "rgba(109,40,217,1)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Credenciais do gateway (VizzionPay)
          </div>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
              Key public
            </span>
            <input
              value={vizzionpayPublicKey}
              onChange={(e) => setVizzionpayPublicKey(e.target.value)}
              inputMode="text"
              placeholder="Cole a VizzionPay Public Key"
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                fontSize: 14,
              }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
              Key secret
            </span>
            <input
              value={vizzionpaySecretKey}
              onChange={(e) => setVizzionpaySecretKey(e.target.value)}
              type="password"
              inputMode="text"
              placeholder="Digite a nova Secret Key (deixe vazio para manter)"
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                fontSize: 14,
              }}
            />
          </label>

          <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 700, lineHeight: 1.4 }}>
            A secret key não é exibida no painel. Para trocar a conta, preencha “Key secret” com a nova chave.
          </div>

          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              color: "rgba(202,138,4,1)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Modo de teste (apenas desenvolvimento)
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              type="checkbox"
              checked={earningsTestMode}
              onChange={(e) => setEarningsTestMode(e.target.checked)}
              style={{
                width: 18,
                height: 18,
                accentColor: "var(--accent)",
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 800, color: "#374151" }}>
              Ativar modo de teste para rendimentos
            </span>
          </label>

          <div
            style={{
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(202,138,4,0.25)",
              background: "rgba(202,138,4,0.07)",
              display: "grid",
              gap: 8,
            }}
          >
            <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 700, lineHeight: 1.4 }}>
              {earningsTestMode
                ? `Quando ativado, os rendimentos dos produtos serão processados a cada ${earningsTestIntervalMinutes} minutos apenas para testes.`
                : "Quando desativado, os rendimentos voltam ao intervalo normal de 24 horas."}
            </div>

            <label style={{ display: "grid", gap: 6, opacity: earningsTestMode ? 1 : 0.6 }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: "#374151" }}>
                Intervalo de teste (minutos)
              </span>
              <input
                type="number"
                min={1}
                max={60}
                step={1}
                value={earningsTestIntervalMinutes}
                disabled={!earningsTestMode}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  setEarningsTestIntervalMinutes(Number.isFinite(n) ? n : 10);
                }}
                style={{
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  fontSize: 15,
                  background: !earningsTestMode ? "rgba(243,244,246,1)" : "#fff",
                }}
              />
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 8,
            padding: "14px 18px",
            borderRadius: 12,
            border: "none",
            background: "var(--brand)",
            color: "#fff",
            fontWeight: 800,
            fontSize: 15,
            cursor: "pointer",
            boxShadow: "0 4px 14px var(--brand-shadow)",
          }}
        >
          {loading ? "Salvando…" : "Salvar configurações"}
        </button>

        <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>
          Última atualização:{" "}
          {Number.isNaN(Date.parse(lastUpdated))
            ? "—"
            : new Date(lastUpdated).toLocaleString("pt-BR")}
        </p>
      </div>
    </form>
  );
}
