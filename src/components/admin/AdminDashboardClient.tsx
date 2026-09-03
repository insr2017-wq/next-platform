"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, ArrowDownToLine, ArrowUpFromLine, Wallet } from "lucide-react";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import type { AdminDashboardData } from "@/lib/admin-dashboard";

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function MiniBars({
  points,
  valueKey,
  color,
}: {
  points: { label: string; value: number }[];
  valueKey?: string;
  color: string;
}) {
  const max = Math.max(1, ...points.map((p) => p.value));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 88 }}>
      {points.map((p) => (
        <div key={`${valueKey ?? "v"}-${p.label}`} style={{ flex: 1, display: "grid", gap: 4, alignItems: "end", justifyItems: "center" }}>
          <div
            title={`${p.label}: ${p.value}`}
            style={{
              width: "100%",
              maxWidth: 18,
              height: `${Math.max(4, Math.round((p.value / max) * 72))}px`,
              borderRadius: 6,
              background: color,
              opacity: p.value === 0 ? 0.2 : 1,
            }}
          />
          <span style={{ fontSize: 9, color: "#9ca3af", fontWeight: 700 }}>{p.label}</span>
        </div>
      ))}
    </div>
  );
}

const card: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 14,
  padding: 16,
  boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
};

export function AdminDashboardClient({ data }: { data: AdminDashboardData }) {
  const [showYield14, setShowYield14] = useState(false);
  const yieldPoints = showYield14 ? data.yieldForecast : data.yieldForecast.slice(0, 7);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#6b7280", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Visão do dia
        </h2>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9ca3af" }}>
          Números de hoje em Brasília. Toque no card para ver o detalhe.
        </p>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <AdminStatCard
          title="Novos cadastros hoje"
          value={data.todayUsers}
          secondary="Usuários criados neste dia"
          icon={<Users size={22} />}
          iconVariant="purple"
          href="/admin/users"
        />
        <AdminStatCard
          title="Entrou hoje (recargas)"
          value={formatBRL(data.todayInflow)}
          secondary="Depósitos confirmados"
          icon={<ArrowDownToLine size={22} />}
          iconVariant="blue"
          href="/admin/deposits"
        />
        <AdminStatCard
          title="Saiu hoje (saques)"
          value={formatBRL(data.todayOutflow)}
          secondary={
            data.pendingWithdrawalsCount
              ? `${data.pendingWithdrawalsCount} pendente(s) · ${formatBRL(data.pendingWithdrawalsSum)}`
              : "Solicitações registradas hoje"
          }
          icon={<ArrowUpFromLine size={22} />}
          iconVariant="pink"
          href="/admin/withdrawals"
        />
        <AdminStatCard
          title="Rendimento a pagar (7 dias)"
          value={formatBRL(data.yieldNext7)}
          secondary={`${formatBRL(data.yieldNext14)} nos próximos 14 dias`}
          icon={<Wallet size={22} />}
          iconVariant="blue"
        />
      </div>

      <section style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800 }}>Cadastros por dia</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Últimos 14 dias</div>
          </div>
          <Link href="/admin/users" style={{ fontSize: 12, fontWeight: 800, color: "var(--brand)", textDecoration: "none" }}>
            Ver mais
          </Link>
        </div>
        <MiniBars color="#7c3aed" points={data.series.map((p) => ({ label: p.label, value: p.users }))} valueKey="users" />
      </section>

      <section style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800 }}>Caixa do dia</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Recargas (azul) × saques (rosa)</div>
          </div>
          <Link href="/admin/financeiro" style={{ fontSize: 12, fontWeight: 800, color: "var(--brand)", textDecoration: "none" }}>
            Ver mais
          </Link>
        </div>
        <MiniBars color="#2563eb" points={data.series.map((p) => ({ label: p.label, value: p.inflow }))} valueKey="in" />
        <div style={{ height: 10 }} />
        <MiniBars color="#db2777" points={data.series.map((p) => ({ label: p.label, value: p.outflow }))} valueKey="out" />
      </section>

      <section style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800 }}>Rendimento previsto</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              Produtos ativos ainda no ciclo · {showYield14 ? "14 dias" : "7 dias"}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowYield14((v) => !v)}
            style={{ appearance: "none", border: "none", background: "transparent", fontSize: 12, fontWeight: 800, color: "var(--brand)", cursor: "pointer" }}
          >
            {showYield14 ? "Ver 7 dias" : "Ver 14 dias"}
          </button>
        </div>
        <MiniBars color="#0f766e" points={yieldPoints.map((p) => ({ label: p.label, value: p.amount }))} valueKey="yield" />
        <p style={{ margin: "12px 0 0", fontSize: 12, color: "#6b7280", lineHeight: 1.45 }}>
          Estimativa com base no rendimento diário e nos dias restantes de cada produto ativo. Não inclui saques
          pendentes.
        </p>
      </section>
    </div>
  );
}
