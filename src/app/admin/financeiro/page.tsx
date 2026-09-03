import Link from "next/link";
import { ArrowDownToLine, ArrowUpFromLine, Gift } from "lucide-react";
import { getAdminDashboardData } from "@/lib/admin-dashboard";

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

const LINKS = [
  {
    href: "/admin/deposits",
    title: "Depósitos",
    desc: "Recargas PIX confirmadas e pendentes",
    icon: ArrowDownToLine,
  },
  {
    href: "/admin/withdrawals",
    title: "Saques",
    desc: "Aprovar, recusar e acompanhar solicitações",
    icon: ArrowUpFromLine,
  },
  {
    href: "/admin/bonus-codes",
    title: "Códigos bônus",
    desc: "Criar e limitar resgates promocionais",
    icon: Gift,
  },
];

export default async function AdminFinanceiroPage() {
  let todayInflow = 0;
  let todayOutflow = 0;
  let pendingCount = 0;
  let pendingSum = 0;
  try {
    const data = await getAdminDashboardData(1);
    todayInflow = data.todayInflow;
    todayOutflow = data.todayOutflow;
    pendingCount = data.pendingWithdrawalsCount;
    pendingSum = data.pendingWithdrawalsSum;
  } catch {
    // zeros
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>
        Resumo de caixa de hoje. Use os cards abaixo para o detalhamento.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
        }}
      >
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#6b7280", textTransform: "uppercase" }}>Entrou</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>{formatBRL(todayInflow)}</div>
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#6b7280", textTransform: "uppercase" }}>Saiu</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>{formatBRL(todayOutflow)}</div>
        </div>
      </div>
      {pendingCount > 0 ? (
        <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 14, padding: 14, fontSize: 13, fontWeight: 700, color: "#9a3412" }}>
          {pendingCount} saque(s) pendente(s) · {formatBRL(pendingSum)}
        </div>
      ) : null}
      <div style={{ display: "grid", gap: 10 }}>
        {LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: 14,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--brand-light)", display: "grid", placeItems: "center", color: "var(--brand)" }}>
                <Icon size={18} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{item.desc}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
