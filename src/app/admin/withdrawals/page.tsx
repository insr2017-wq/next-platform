import { prisma } from "@/lib/db";
import { EmptyState } from "@/components/admin/EmptyState";
import { Badge } from "@/components/ui/Badge";
import {
  ensureUserPublicIdColumnAndBackfill,
} from "@/lib/user-schema-sqlite";
import { AdminWithdrawalActionsClient } from "@/components/admin/AdminWithdrawalActionsClient";
import { formatDateBr } from "@/lib/datetime-br";

function normalizePhone(q: string): string {
  return q.replace(/\D/g, "");
}

function mapWithdrawalStatus(status: string | null | undefined): { label: string; tone: "neutral" | "warning" | "success" } {
  const s = (status ?? "").toLowerCase();
  if (s === "pending") return { label: "Pendente", tone: "warning" };
  if (s === "processing") return { label: "Processando", tone: "warning" };
  if (s === "processed") return { label: "Processado", tone: "success" };
  // Para qualquer status diferente de "pending" e "processed", mantemos como "Falhou"
  // (ex.: "failed", "rejected", "cancelled"...), para continuar compatível.
  return { label: "Falhou", tone: "neutral" };
}

function formatBRL(n: number): string {
  return `R$ ${Number(n).toFixed(2).replace(".", ",")}`;
}

function withdrawalMoneyFallback(w: {
  amount: number;
  requestedAmount?: number | null;
  netAmount?: number | null;
  feeAmount?: number | null;
  feePercent?: number | null;
}) {
  const requested = (w.requestedAmount ?? 0) > 0 ? Number(w.requestedAmount ?? 0) : Number(w.amount);
  const net = (w.netAmount ?? 0) > 0 ? Number(w.netAmount ?? 0) : Number(w.amount);
  const feeAmount = (w.feeAmount ?? 0) > 0 ? Number(w.feeAmount ?? 0) : 0;
  const feePercent = (w.feePercent ?? 0) > 0 ? Number(w.feePercent ?? 0) : 0;
  return { requested, net, feeAmount, feePercent };
}

export default async function AdminWithdrawalsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const qRaw = (sp?.q ?? "").trim();
  const qDigits = normalizePhone(qRaw);

  let withdrawals: Awaited<
    ReturnType<
      typeof prisma.withdrawal.findMany<{ include: { user: { select: { fullName: true; phone: true; publicId: true } } } }>
    >
  >;
  try {
    await ensureUserPublicIdColumnAndBackfill();

    const publicIdCandidates = qRaw
      ? Array.from(
          new Set([qRaw, qRaw.toLowerCase(), qRaw.toUpperCase()].filter((v) => v && v.trim() !== "")),
        )
      : [];

    const where = qRaw
      ? {
          user: {
            OR: [
              ...(qDigits ? [{ phone: { contains: qDigits } }] : []),
              ...publicIdCandidates.map((candidate) => ({ publicId: { contains: candidate } })),
            ],
          },
        }
      : undefined;

    withdrawals = await prisma.withdrawal.findMany({
      orderBy: { createdAt: "desc" },
      where,
      include: { user: { select: { fullName: true, phone: true, publicId: true } } },
    });
  } catch {
    withdrawals = [];
  }

  const hasSearch = qRaw.length > 0;

  if (withdrawals.length === 0) {
    return (
      <div style={{ marginTop: 8 }}>
        <div style={{ display: "grid", gap: 12 }}>
          <form method="GET" style={{ marginBottom: 6 }}>
            <input
              name="q"
              placeholder="Buscar por telefone ou ID"
              defaultValue={qRaw}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                fontSize: 14,
                fontWeight: 700,
                outline: "none",
              }}
            />
          </form>
          <EmptyState
            message={hasSearch ? "Nenhum resultado encontrado" : "Nenhum saque registrado."}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 12, overflowX: "auto" }}>
      <div style={{ paddingBottom: 12 }}>
        <form method="GET">
          <input
            name="q"
            placeholder="Buscar por telefone ou ID"
            defaultValue={qRaw}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              fontSize: 14,
              fontWeight: 700,
              outline: "none",
            }}
          />
        </form>
      </div>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "var(--surface)",
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid var(--border)",
          boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
        }}
      >
        <thead>
          <tr style={{ background: "var(--app-bg)", borderBottom: "1px solid var(--border)" }}>
            <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600 }}>
              Usuário
            </th>
            <th style={{ padding: "10px 12px", textAlign: "right", fontSize: 12, fontWeight: 600 }}>
              Valor solicitado
            </th>
            <th style={{ padding: "10px 12px", textAlign: "right", fontSize: 12, fontWeight: 600 }}>
              Taxa
            </th>
            <th style={{ padding: "10px 12px", textAlign: "right", fontSize: 12, fontWeight: 600 }}>
              Valor líquido
            </th>
            <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600 }}>
              PIX tipo
            </th>
            <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600 }}>
              Titular
            </th>
            <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600 }}>
              Status
            </th>
            <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600 }}>
              Data
            </th>
            <th style={{ padding: "10px 12px", textAlign: "right", fontSize: 12, fontWeight: 600 }}>
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {withdrawals.map((w) => (
            <tr key={w.id} style={{ borderBottom: "1px solid var(--border)" }}>
              <td style={{ padding: "10px 12px", fontSize: 14 }}>
                {w.user?.fullName || "—"} (ID: {w.user?.publicId || "—"}) ({w.user?.phone ?? "—"})
              </td>
              <td style={{ padding: "10px 12px", fontSize: 14, textAlign: "right" }}>
                {formatBRL(withdrawalMoneyFallback(w).requested)}
              </td>
              <td style={{ padding: "10px 12px", fontSize: 14, textAlign: "right" }}>
                {withdrawalMoneyFallback(w).feePercent > 0
                  ? `${withdrawalMoneyFallback(w).feePercent}% (${formatBRL(withdrawalMoneyFallback(w).feeAmount)})`
                  : "—"}
              </td>
              <td style={{ padding: "10px 12px", fontSize: 14, textAlign: "right" }}>
                {formatBRL(withdrawalMoneyFallback(w).net)}
              </td>
              <td style={{ padding: "10px 12px", fontSize: 14 }}>{w.pixKeyType}</td>
              <td style={{ padding: "10px 12px", fontSize: 14 }}>{w.holderName}</td>
              <td style={{ padding: "10px 12px", fontSize: 14 }}>
                {(() => {
                  const mapped = mapWithdrawalStatus(w.status);
                  return <Badge tone={mapped.tone}>{mapped.label}</Badge>;
                })()}
              </td>
              <td style={{ padding: "10px 12px", fontSize: 13, color: "#6b7280" }}>
                {formatDateBr(w.createdAt)}
              </td>
              <td style={{ padding: "10px 12px", fontSize: 13 }}>
                {w.status === "pending" ? (
                  <AdminWithdrawalActionsClient withdrawalId={w.id} />
                ) : (
                  <span style={{ color: "rgba(107,114,128,1)", fontWeight: 900 }}>—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
