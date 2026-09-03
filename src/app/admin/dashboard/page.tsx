import { Users, UserCheck, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { prisma } from "@/lib/db";
import { AdminStatCard } from "@/components/admin/AdminStatCard";

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default async function AdminDashboardPage() {
  let totalUsers = 0;
  let activeUsers = 0;
  let totalDepositsSum = 0;
  let pendingWithdrawalsCount = 0;
  let pendingWithdrawalsSum = 0;

  try {
    const [userCount, activeCount, paidDeposits, pendingData] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { deposits: { some: {} } } }),
      prisma.deposit.aggregate({
        where: { status: "paid" },
        _sum: { amount: true },
      }),
      prisma.withdrawal.aggregate({
        where: { status: "pending" },
        _count: { id: true },
        _sum: { requestedAmount: true },
      }),
    ]);
    totalUsers = userCount;
    activeUsers = activeCount;
    totalDepositsSum = paidDeposits._sum.amount ?? 0;
    pendingWithdrawalsCount = pendingData._count.id;
    pendingWithdrawalsSum = pendingData._sum.requestedAmount ?? 0;
  } catch {
    // use zeros
  }

  const activePercent =
    totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : "0";

  return (
    <div style={{ display: "grid", gap: 16, marginTop: 8 }}>
      <AdminStatCard
        title="Total de Usuários"
        value={totalUsers}
        secondary={`↑ +0 hoje`}
        icon={<Users size={24} strokeWidth={2} />}
        iconVariant="purple"
        href="/admin/users"
      />
      <AdminStatCard
        title="Usuários Ativos"
        value={activeUsers}
        secondary={`${activePercent}% do total`}
        icon={<UserCheck size={24} strokeWidth={2} />}
        iconVariant="blue"
        href="/admin/users"
      />
      <AdminStatCard
        title="Total Depósitos"
        value={formatBRL(totalDepositsSum)}
        secondary={
          totalDepositsSum === 0
            ? "Nenhum depósito registrado"
            : "↑ +R$ 0,00 hoje"
        }
        icon={<ArrowDownToLine size={24} strokeWidth={2} />}
        iconVariant="blue"
        href="/admin/deposits"
      />
      <AdminStatCard
        title="Saques Pendentes"
        value={formatBRL(pendingWithdrawalsSum)}
        secondary={
          pendingWithdrawalsCount === 0
            ? "Nenhum saque pendente"
            : `${pendingWithdrawalsCount} saque${pendingWithdrawalsCount !== 1 ? "s" : ""} aguardando aprovação`
        }
        icon={<ArrowUpFromLine size={24} strokeWidth={2} />}
        iconVariant="pink"
        href="/admin/withdrawals"
      />
    </div>
  );
}
