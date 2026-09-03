import Link from "next/link";
import { formatBRL } from "@/lib/format-brl";
import {
  filterHistoryByTab,
  getUserTransactionHistory,
  type HistoryTab,
} from "@/lib/user-transaction-history";

type TransactionHistoryViewProps = {
  userId: string;
  tab: HistoryTab;
  /** Exibe abas Depósitos/Saques (histórico combinado). */
  showTabs?: boolean;
  emptyMessage?: string;
};

export async function TransactionHistoryView({
  userId,
  tab,
  showTabs = false,
  emptyMessage = "Nenhum registro encontrado",
}: TransactionHistoryViewProps) {
  const unified = await getUserTransactionHistory(userId);
  const visible = filterHistoryByTab(unified, tab);
  const showEmpty = unified.length === 0 || visible.length === 0;

  return (
    <div className="grid gap-4">
      {showTabs ? (
        <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-border bg-surface">
          <Link
            href="/history?tab=deposits"
            className={
              tab === "deposits"
                ? "bg-primary py-3 text-center text-sm font-semibold text-black"
                : "bg-surface py-3 text-center text-sm font-semibold text-muted"
            }
          >
            Depósitos
          </Link>
          <Link
            href="/history?tab=withdrawals"
            className={
              tab === "withdrawals"
                ? "bg-primary py-3 text-center text-sm font-semibold text-primary-foreground"
                : "bg-secondary py-3 text-center text-sm font-semibold text-muted-foreground"
            }
          >
            Saques
          </Link>
        </div>
      ) : null}

      {showEmpty ? (
        <div className="rounded-lg bg-card p-6 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid gap-3">
          {visible.map((item) => (
            <div key={item.key} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.subtitle}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.meta}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">{formatBRL(item.amount)}</p>
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                      item.tone === "success"
                        ? "bg-primary/15 text-primary"
                        : item.tone === "error"
                          ? "bg-destructive/15 text-destructive"
                          : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
