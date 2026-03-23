import Link from "next/link";
import { redirect } from "next/navigation";
import { Page } from "@/components/layout/Page";
import { Card } from "@/components/ui/Card";
import { HistoryItem } from "@/components/history/HistoryItem";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

type HistoryTab = "deposits" | "withdrawals";

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatHistoryDate(value: Date): string {
  return value.toLocaleString("pt-BR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function mapDepositStatus(status: string | null | undefined): { label: "Pendente" | "Pago"; tone: "warning" | "success" } {
  const s = (status ?? "").toLowerCase();
  if (s === "paid") return { label: "Pago", tone: "success" };
  return { label: "Pendente", tone: "warning" };
}

function mapWithdrawalStatus(
  status: string | null | undefined,
): { label: "Pendente" | "Processando" | "Processado" | "Falhou"; tone: "warning" | "success" | "error" } {
  const s = (status ?? "").toLowerCase();
  if (s === "pending") return { label: "Pendente", tone: "warning" };
  if (s === "processing") return { label: "Processando", tone: "warning" };

  const failedStatuses = new Set([
    "failed",
    "error",
    "erro",
    "falhou",
    "rejected",
    "rejeitado",
    "cancelled",
    "cancelado",
    "cancelada",
    "expired",
    "expirada",
  ]);

  if (failedStatuses.has(s)) return { label: "Falhou", tone: "error" };

  // Qualquer status diferente de "pending" cai como "Processado" para manter a lógica apenas com 3 estados visíveis.
  return { label: "Processado", tone: "success" };
}

function mapPixKeyType(pixKeyType: string | null | undefined): string {
  const v = (pixKeyType ?? "").toLowerCase();
  if (v === "cpf") return "CPF";
  if (v === "telefone" || v === "phone" || v === "tel") return "Telefone";
  return v ? pixKeyType! : "Chave Pix";
}

function maskPixKey(pixKey: string | null | undefined): string {
  const raw = pixKey ?? "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 6) return digits ? digits : "-";
  return `${digits.slice(0, 3)}****${digits.slice(-3)}`;
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams?: Promise<{
    tab?: string;
  }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const sp = await searchParams;
  const activeTab: HistoryTab = sp?.tab === "withdrawals" ? "withdrawals" : "deposits";

  const [deposits, withdrawals] = await Promise.all([
    prisma.deposit.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.withdrawal.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        amount: true, // fallback (antigo)
        requestedAmount: true,
        feePercent: true,
        feeAmount: true,
        netAmount: true,
        status: true,
        pixKeyType: true,
        pixKey: true,
        createdAt: true,
      },
    }),
  ]);

  const unified = [
    ...deposits.map((d) => {
      const mapped = mapDepositStatus(d.status);
      return {
        key: `deposit:${d.id}`,
        kind: "deposit" as const,
        createdAt: d.createdAt,
        amount: d.amount,
        title: "Depósito",
        subtitle: formatHistoryDate(d.createdAt),
        meta: "Pagamento via Pix",
        status: mapped.label,
        tone: mapped.tone,
      };
    }),
    ...withdrawals.map((w) => {
      const mapped = mapWithdrawalStatus(w.status);
      const pixKeyTypeLabel = mapPixKeyType(w.pixKeyType);
      const maskedKey = maskPixKey(w.pixKey);

      const requested = (w.requestedAmount ?? 0) > 0 ? Number(w.requestedAmount) : Number(w.amount);
      const net = (w.netAmount ?? 0) > 0 ? Number(w.netAmount) : Number(w.amount);
      const feePercent = (w.feePercent ?? 0) > 0 ? Number(w.feePercent) : 0;
      const feeAmount = (w.feeAmount ?? 0) > 0 ? Number(w.feeAmount) : 0;

      return {
        key: `withdrawal:${w.id}`,
        kind: "withdrawal" as const,
        createdAt: w.createdAt,
        amount: net,
        title: maskedKey,
        subtitle: `Saque via ${pixKeyTypeLabel}`,
        meta: `${formatHistoryDate(w.createdAt)} • Solicitado: ${formatBRL(requested)} • Taxa: ${feePercent}% (${formatBRL(feeAmount)})`,
        status: mapped.label,
        tone: mapped.tone,
      };
    }),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const visible = unified.filter((item) =>
    activeTab === "deposits" ? item.kind === "deposit" : item.kind === "withdrawal",
  );

  const showEmpty = unified.length === 0 || visible.length === 0;

  return (
    <Page title="Histórico" backHref="/profile" headerTone="brand">
      <div style={{ display: "grid", gap: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "rgba(17,24,39,0.62)" }}>
          Acompanhe seus depósitos e saques
        </div>

        <Card>
          <div
            style={{
              padding: 6,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 4,
              alignItems: "center",
            }}
          >
            <Link
              href="/history?tab=deposits"
              style={{
                appearance: "none",
                borderRadius: 12,
                padding: "10px 10px",
                fontSize: 13,
                fontWeight: 900,
                cursor: "pointer",
                textAlign: "center",
                lineHeight: 1.1,
                border: activeTab === "deposits" ? "1px solid var(--brand-border)" : "1px solid transparent",
                background: activeTab === "deposits" ? "var(--brand-light)" : "transparent",
                color: activeTab === "deposits" ? "var(--brand)" : "rgba(17,24,39,0.72)",
              }}
            >
              Depósitos
            </Link>

            <Link
              href="/history?tab=withdrawals"
              style={{
                appearance: "none",
                borderRadius: 12,
                padding: "10px 10px",
                fontSize: 13,
                fontWeight: 900,
                cursor: "pointer",
                textAlign: "center",
                lineHeight: 1.1,
                border: activeTab === "withdrawals" ? "1px solid var(--brand-border)" : "1px solid transparent",
                background: activeTab === "withdrawals" ? "var(--brand-light)" : "transparent",
                color: activeTab === "withdrawals" ? "var(--brand)" : "rgba(17,24,39,0.72)",
              }}
            >
              Saques
            </Link>
          </div>
        </Card>

        {showEmpty ? (
          <Card>
            <div
              style={{
                padding: 18,
                textAlign: "center",
                fontSize: 13,
                color: "rgba(107,114,128,1)",
                fontWeight: 700,
              }}
            >
              Nenhum histórico encontrado
            </div>
          </Card>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {visible.map((item) => (
              <HistoryItem
                key={item.key}
                title={item.title}
                subtitle={item.subtitle}
                meta={item.meta}
                amount={formatBRL(item.amount)}
                status={item.status}
                tone={item.tone}
              />
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}

