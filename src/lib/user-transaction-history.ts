import { prisma } from "@/lib/db";
import { formatDateTimeBr } from "@/lib/datetime-br";

export type HistoryTab = "deposits" | "withdrawals";

export type HistoryTone = "warning" | "success" | "error";

export type HistoryListItem = {
  key: string;
  kind: "deposit" | "withdrawal";
  createdAt: Date;
  amount: number;
  title: string;
  subtitle: string;
  meta: string;
  status: string;
  tone: HistoryTone;
};

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function mapDepositStatus(
  status: string | null | undefined,
): { label: string; tone: HistoryTone } {
  const s = (status ?? "").toLowerCase();
  if (s === "paid") return { label: "Confirmado", tone: "success" };

  const rejected = new Set([
    "failed",
    "error",
    "rejected",
    "rejeitado",
    "cancelled",
    "cancelado",
    "cancelada",
    "expired",
    "expirada",
  ]);
  if (rejected.has(s)) return { label: "Rejeitado", tone: "error" };

  return { label: "Pendente", tone: "warning" };
}

export function mapWithdrawalStatus(
  status: string | null | undefined,
): { label: string; tone: HistoryTone } {
  const s = (status ?? "").toLowerCase();
  if (s === "pending" || s === "processing") {
    return { label: "Pendente", tone: "warning" };
  }

  const rejected = new Set([
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
  if (rejected.has(s)) return { label: "Rejeitado", tone: "error" };

  return { label: "Confirmado", tone: "success" };
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

export async function getUserTransactionHistory(userId: string): Promise<HistoryListItem[]> {
  const [deposits, withdrawals] = await Promise.all([
    prisma.deposit.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.withdrawal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        amount: true,
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

  return [
    ...deposits.map((d) => {
      const mapped = mapDepositStatus(d.status);
      return {
        key: `deposit:${d.id}`,
        kind: "deposit" as const,
        createdAt: d.createdAt,
        amount: d.amount,
        title: "Depósito",
        subtitle: formatDateTimeBr(d.createdAt),
        meta: "Pagamento via Pix",
        status: mapped.label,
        tone: mapped.tone,
      };
    }),
    ...withdrawals.map((w) => {
      const mapped = mapWithdrawalStatus(w.status);
      const pixKeyTypeLabel = mapPixKeyType(w.pixKeyType);
      const maskedKey = maskPixKey(w.pixKey);

      const requested =
        (w.requestedAmount ?? 0) > 0 ? Number(w.requestedAmount) : Number(w.amount);
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
        meta: `${formatDateTimeBr(w.createdAt)} • Solicitado: ${formatBRL(requested)} • Taxa: ${feePercent}% (${formatBRL(feeAmount)})`,
        status: mapped.label,
        tone: mapped.tone,
      };
    }),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function filterHistoryByTab(
  items: HistoryListItem[],
  tab: HistoryTab,
): HistoryListItem[] {
  return items.filter((item) =>
    tab === "deposits" ? item.kind === "deposit" : item.kind === "withdrawal",
  );
}
