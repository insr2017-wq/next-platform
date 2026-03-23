import { prisma } from "@/lib/db";
import { EmptyState } from "@/components/admin/EmptyState";
import { formatDateBr } from "@/lib/datetime-br";

export default async function AdminDepositsPage() {
  let deposits: Awaited<ReturnType<typeof prisma.deposit.findMany<{ include: { user: { select: { fullName: true; phone: true } } } }>>>;
  try {
    deposits = await prisma.deposit.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { fullName: true, phone: true } } },
    });
  } catch {
    deposits = [];
  }

  if (deposits.length === 0) {
    return (
      <div style={{ marginTop: 8 }}>
        <EmptyState message="Nenhum depósito registrado." />
      </div>
    );
  }

  return (
    <div style={{ marginTop: 12, overflowX: "auto" }}>
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
              Valor
            </th>
            <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600 }}>
              Status
            </th>
            <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600 }}>
              Data
            </th>
          </tr>
        </thead>
        <tbody>
          {deposits.map((d) => (
            <tr key={d.id} style={{ borderBottom: "1px solid var(--border)" }}>
              <td style={{ padding: "10px 12px", fontSize: 14 }}>
                {d.user?.fullName || "—"} ({d.user?.phone ?? "—"})
              </td>
              <td style={{ padding: "10px 12px", fontSize: 14, textAlign: "right" }}>
                R$ {Number(d.amount).toFixed(2).replace(".", ",")}
              </td>
              <td style={{ padding: "10px 12px", fontSize: 14 }}>{d.status}</td>
              <td style={{ padding: "10px 12px", fontSize: 13, color: "#6b7280" }}>
                {formatDateBr(d.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
