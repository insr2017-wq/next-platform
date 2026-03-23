"use client";

import { useEffect, useMemo, useState } from "react";
import { QrCode } from "lucide-react";
import { isValidCpfDigits } from "@/lib/cpf";
import { Page } from "@/components/layout/Page";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type PixPaymentPlaceholders = {
  qrCodeImage: string | null;
  pixCode: string | null;
  paymentStatus: "Pendente" | "Pago" | "Falhou";
};

function normalizeQrImageSrc(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const t = String(raw).trim();
  if (!t) return null;
  if (t.startsWith("data:") || t.startsWith("http://") || t.startsWith("https://")) return t;
  return `data:image/png;base64,${t}`;
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function formatCurrency(value: number) {
  return brl.format(value);
}

function parseBRLInput(value: string): number | null {
  const raw = value.trim();
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d,]/g, "").replace(",", ".");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function formatInputAmount(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  const asInt = Math.abs(rounded - Math.round(rounded)) < 1e-9 ? Math.round(rounded) : null;
  if (asInt !== null) return String(asInt);
  return rounded.toFixed(2).replace(".", ",");
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

function generateQuickAmounts(minDeposit: number) {
  const base = Number.isFinite(minDeposit) && minDeposit > 0 ? minDeposit : 10;
  const factors = [1, 2, 3, 6, 10, 20] as const;
  const round2 = (n: number) => Math.round(n * 100) / 100;

  const amounts: number[] = [];
  for (let i = 0; i < factors.length; i++) {
    const raw = base * factors[i];
    let v = round2(raw);
    if (amounts.length > 0 && v <= amounts[amounts.length - 1]) {
      v = round2(amounts[amounts.length - 1] + Math.max(0.01, base / 10));
    }
    amounts.push(v);
  }

  return amounts;
}

function QuickAmountButton({
  amount,
  selected,
  onSelect,
}: {
  amount: number;
  selected: boolean;
  onSelect: (amount: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(amount)}
      style={{
        appearance: "none",
        border: selected ? "1px solid var(--brand)" : "1px solid rgba(229,231,235,0.95)",
        background: selected ? "var(--brand-light)" : "#fff",
        borderRadius: 14,
        padding: "12px 10px",
        fontSize: 13,
        fontWeight: 800,
        color: selected ? "var(--brand)" : "rgba(17,24,39,0.82)",
        boxShadow: "0 4px 12px rgba(17,24,39,0.04)",
      }}
    >
      {formatCurrency(amount)}
    </button>
  );
}

function PixDepositModal({
  open,
  onClose,
  amount,
  depositId,
  placeholders,
  onPaymentVerified,
}: {
  open: boolean;
  onClose: () => void;
  amount: number;
  depositId: string | null;
  placeholders?: Partial<PixPaymentPlaceholders>;
  onPaymentVerified?: (balance: number) => void;
}) {
  const [verifying, setVerifying] = useState(false);
  const [verifyHint, setVerifyHint] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PixPaymentPlaceholders["paymentStatus"]>("Pendente");

  useEffect(() => {
    if (!open) return;
    setPaymentStatus(placeholders?.paymentStatus ?? "Pendente");
    setVerifyHint(null);
  }, [open, placeholders?.paymentStatus]);

  if (!open) return null;

  const resolvedPlaceholders: PixPaymentPlaceholders = {
    qrCodeImage: placeholders?.qrCodeImage ?? null,
    pixCode: placeholders?.pixCode ?? null,
    paymentStatus,
  };

  const copyCode = async () => {
    const code = resolvedPlaceholders.pixCode;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // ignore: copy may fail in some browsers
    }
  };

  const qrSrc = normalizeQrImageSrc(resolvedPlaceholders.qrCodeImage);

  const overlayPad =
    "max(10px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left))";

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(17,24,39,0.45)",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: overlayPad,
        zIndex: 50,
        overflowY: "auto",
        overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
        overscrollBehavior: "contain",
        boxSizing: "border-box",
        minHeight: "100dvh",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "min(100%, 390px)",
          maxWidth: "100%",
          maxHeight:
            "calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 20px)",
          background: "var(--surface)",
          border: "1px solid rgba(229,231,235,0.95)",
          borderRadius: 16,
          boxShadow: "0 22px 60px rgba(0,0,0,0.18)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          margin: "0 auto",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: "12px 12px 10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            flexShrink: 0,
            borderBottom: "1px solid rgba(229,231,235,0.6)",
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 900,
              color: "rgba(17,24,39,0.92)",
              lineHeight: 1.25,
              minWidth: 0,
            }}
          >
            Pagamento via Pix
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              appearance: "none",
              border: "1px solid rgba(229,231,235,0.95)",
              background: "#fff",
              borderRadius: 11,
              padding: "5px 9px",
              fontSize: 11,
              fontWeight: 900,
              cursor: "pointer",
              color: "rgba(17,24,39,0.72)",
              flexShrink: 0,
            }}
          >
            Fechar
          </button>
        </div>

        <div
          style={{
            padding: "10px 10px max(10px, env(safe-area-inset-bottom))",
            display: "grid",
            gap: 8,
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <div style={{ fontSize: 12, color: "rgba(17,24,39,0.62)", lineHeight: 1.35, fontWeight: 700 }}>
            Escaneie o QR Code ou copie o código Pix para realizar o pagamento.
          </div>

          <div
            style={{
              width: "100%",
              maxWidth: "min(72vw, 260px)",
              margin: "0 auto",
              aspectRatio: "1",
              maxHeight: "min(34dvh, 240px)",
              borderRadius: 14,
              border: "1px dashed rgba(229,231,235,0.95)",
              background: "rgba(22,101,52,0.03)",
              display: "grid",
              placeItems: "center",
              color: "rgba(17,24,39,0.42)",
              fontWeight: 900,
              fontSize: 11,
              textAlign: "center",
              padding: 10,
              overflow: "hidden",
              boxSizing: "border-box",
            }}
          >
            {qrSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrSrc}
                alt="QR Code Pix"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            ) : (
              <span>Use o código Pix abaixo para concluir o pagamento.</span>
            )}
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: "rgba(17,24,39,0.72)" }}>Código Pix</div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: "rgba(17,24,39,0.88)",
                background: "rgba(17,24,39,0.03)",
                border: "1px solid rgba(229,231,235,0.95)",
                borderRadius: 12,
                padding: 10,
                wordBreak: "break-word",
              }}
            >
              {resolvedPlaceholders.pixCode ?? "—"}
            </div>
            <Button
              type="button"
              fullWidth={true}
              style={{
                borderRadius: 12,
                padding: "10px 12px",
                fontSize: 12,
                fontWeight: 900,
                boxShadow: "none",
              }}
              onClick={() => void copyCode()}
            >
              Copiar código Pix
            </Button>
          </div>

          <div style={{ fontSize: 12, color: "rgba(17,24,39,0.62)", lineHeight: 1.35, fontWeight: 700 }}>
            Após a confirmação do pagamento, o saldo será atualizado automaticamente.
          </div>

          {verifyHint ? (
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: verifyHint.includes("confirmado") ? "rgba(22,101,52,0.95)" : "rgba(185,28,28,1)",
                lineHeight: 1.35,
              }}
            >
              {verifyHint}
            </div>
          ) : null}

          <Button
            type="button"
            fullWidth={true}
            disabled={!depositId || verifying || paymentStatus === "Pago"}
            style={{
              borderRadius: 12,
              padding: "12px 12px",
              fontSize: 13,
              fontWeight: 900,
              boxShadow: "none",
              opacity: !depositId || verifying || paymentStatus === "Pago" ? 0.65 : 1,
            }}
            onClick={() => {
              if (!depositId || verifying) return;
              setVerifying(true);
              setVerifyHint(null);
              void (async () => {
                try {
                  const res = await fetch(`/api/user/deposit/${depositId}/verify`, {
                    method: "POST",
                  });
                  const data = (await res.json().catch(() => ({}))) as {
                    ok?: boolean;
                    balance?: number;
                    error?: string;
                  };
                  if (res.ok && data.ok) {
                    setPaymentStatus("Pago");
                    setVerifyHint("Pagamento confirmado! Seu saldo foi atualizado.");
                    if (typeof data.balance === "number") {
                      onPaymentVerified?.(data.balance);
                    }
                  } else {
                    setVerifyHint(
                      typeof data.error === "string" && data.error.trim()
                        ? data.error
                        : "Não foi possível confirmar ainda. Tente novamente em instantes."
                    );
                  }
                } catch {
                  setVerifyHint("Erro de rede ao confirmar. Tente novamente.");
                } finally {
                  setVerifying(false);
                }
              })();
            }}
          >
            {verifying
              ? "Verificando pagamento…"
              : paymentStatus === "Pago"
                ? "Pagamento confirmado"
                : "Já paguei — verificar agora"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DepositClient({
  initialBalance,
  minDeposit,
  initialHolderCpf,
}: {
  initialBalance: number;
  minDeposit: number;
  initialHolderCpf: string | null;
}) {
  const quickAmounts = useMemo(() => generateQuickAmounts(minDeposit), [minDeposit]);

  const [customAmount, setCustomAmount] = useState<string>("");
  const [selectedQuickAmount, setSelectedQuickAmount] = useState<number | null>(null);
  const [cpf, setCpf] = useState(() => {
    const d = onlyDigits(initialHolderCpf ?? "");
    return d.length === 11 ? maskCPF(d) : "";
  });

  const [error, setError] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAmount, setModalAmount] = useState<number>(0);
  const [modalDepositId, setModalDepositId] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState(initialBalance);
  const [isCreatingPix, setIsCreatingPix] = useState(false);
  const [modalPayment, setModalPayment] = useState<Partial<PixPaymentPlaceholders>>({});

  const activeAmount = useMemo(() => parseBRLInput(customAmount), [customAmount]);

  const handleQuickSelect = (amount: number) => {
    setSelectedQuickAmount(amount);
    setCustomAmount(formatInputAmount(amount));
    setError("");
  };

  const handleCustomChange = (value: string) => {
    setCustomAmount(value);
    setSelectedQuickAmount(null);
    setError("");
  };

  const handleCpfChange = (value: string) => {
    setCpf(maskCPF(value));
    setError("");
  };

  const canOpenModal = activeAmount != null && activeAmount >= minDeposit;

  const formattedPreview = useMemo(() => {
    return activeAmount != null ? formatCurrency(activeAmount) : "R$ 0,00";
  }, [activeAmount]);

  return (
    <Page title="Recarga" backHref="/home" headerTone="brand">
      <div style={{ display: "grid", gap: 14 }}>
        <Card>
          <div style={{ padding: 16, display: "grid", gap: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(17,24,39,0.62)" }}>
              Saldo disponível
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "rgba(17,24,39,0.92)" }}>
              {formatCurrency(walletBalance)}
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ padding: 16, display: "grid", gap: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: "rgba(17,24,39,0.72)" }}>
              Selecione o valor
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 10,
              }}
            >
              {quickAmounts.map((amount) => (
                <QuickAmountButton
                  key={amount}
                  amount={amount}
                  selected={selectedQuickAmount === amount}
                  onSelect={handleQuickSelect}
                />
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ padding: 16, display: "grid", gap: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: "rgba(17,24,39,0.72)" }}>
              Ou informe outro valor
            </div>
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
                inputMode="decimal"
                placeholder="Informe o valor desejado"
                value={customAmount}
                onChange={(event) => handleCustomChange(event.target.value)}
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

            <div style={{ fontSize: 12, color: "rgba(17,24,39,0.58)" }}>
              Valor selecionado: <span style={{ fontWeight: 900 }}>{formattedPreview}</span>
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ padding: 16, display: "grid", gap: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: "rgba(17,24,39,0.72)" }}>
              CPF do titular
            </div>
            <div style={{ fontSize: 12, color: "rgba(17,24,39,0.58)", lineHeight: 1.4, fontWeight: 600 }}>
              Obrigatório para gerar o Pix. Os dados serão salvos na sua conta para próximas recargas.
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
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => handleCpfChange(e.target.value)}
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
        </Card>

        <Card>
          <div
            style={{
              padding: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ display: "grid", gap: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: "rgba(17,24,39,0.72)" }}>
                Método de pagamento
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "rgba(17,24,39,0.92)" }}>
                PIX
              </div>
            </div>
            <div
              aria-hidden="true"
              style={{
                width: 42,
                height: 42,
                borderRadius: 999,
                background: "var(--brand-light)",
                display: "grid",
                placeItems: "center",
                border: "1px solid var(--brand-border)",
              }}
            >
              <QrCode size={20} color="var(--brand)" strokeWidth={2.2} />
            </div>
          </div>
        </Card>

        {error ? (
          <Card>
            <div
              style={{
                padding: 12,
                fontSize: 12,
                fontWeight: 900,
                color: "rgba(185,28,28,1)",
              }}
            >
              {error}
            </div>
          </Card>
        ) : null}

        <Button
          type="button"
          fullWidth
          disabled={isCreatingPix}
          style={{
            borderRadius: 999,
            padding: "15px 16px",
            fontSize: 15,
            fontWeight: 900,
            boxShadow: "0 10px 20px var(--brand-shadow)",
            opacity: isCreatingPix ? 0.72 : 1,
          }}
          onClick={() => {
            if (activeAmount == null) {
              setError("Informe o valor da recarga.");
              return;
            }
            if (activeAmount < minDeposit) {
              setError(`O valor mínimo para recarga é ${formatCurrency(minDeposit)}.`);
              return;
            }

            const cpfDigits = onlyDigits(cpf);
            if (cpfDigits.length !== 11 || !isValidCpfDigits(cpfDigits)) {
              setError("Informe um CPF válido do titular (11 dígitos) para gerar o Pix.");
              return;
            }

            setError("");
            setIsCreatingPix(true);

            void (async () => {
              try {
                const res = await fetch("/api/user/deposit/pix", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ amount: activeAmount, cpf: cpfDigits }),
                });
                const data = (await res.json().catch(() => ({}))) as {
                  error?: string;
                  depositId?: string;
                  pixCode?: string;
                  qrCodeImageRaw?: string | null;
                };

                if (!res.ok) {
                  setError(
                    typeof data.error === "string" && data.error.trim()
                      ? data.error
                      : "Não foi possível gerar o Pix no momento. Tente novamente em instantes."
                  );
                  return;
                }

                setModalAmount(activeAmount);
                setModalDepositId(typeof data.depositId === "string" ? data.depositId : null);
                setModalPayment({
                  pixCode: data.pixCode ?? null,
                  qrCodeImage: data.qrCodeImageRaw ?? null,
                  paymentStatus: "Pendente",
                });
                setIsModalOpen(true);
              } catch {
                setError(
                  "Não foi possível gerar o Pix no momento. Verifique sua conexão e tente novamente."
                );
              } finally {
                setIsCreatingPix(false);
              }
            })();
          }}
        >
          {isCreatingPix ? "Gerando Pix…" : "Realizar recarga"}
        </Button>

        <div
          style={{
            padding: "8px 4px 0",
            display: "grid",
            gap: 6,
            fontSize: 12,
            color: "rgba(17,24,39,0.62)",
            lineHeight: 1.45,
          }}
        >
          <div>Escaneie o QR Code ou copie o código Pix para concluir o pagamento.</div>
          <div>Após a confirmação do pagamento, o saldo será atualizado automaticamente.</div>
        </div>

        <PixDepositModal
          open={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setModalDepositId(null);
          }}
          amount={modalAmount}
          depositId={modalDepositId}
          placeholders={modalPayment}
          onPaymentVerified={(b) => setWalletBalance(b)}
        />
      </div>
    </Page>
  );
}

