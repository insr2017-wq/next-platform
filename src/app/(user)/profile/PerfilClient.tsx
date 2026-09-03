"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronRight,
  Wallet,
  ArrowUpCircle,
  Gift,
  History,
  ShieldCheck,
  Headphones,
  LogOut,
  Copy,
  CheckCircle2,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { ProfitEvolutionModal } from "@/components/modals/ProfitEvolutionModal";
import { formatBRL } from "@/lib/format-brl";
import { clearSessionMarker } from "@/components/auth/SessionGate";
import { openExternalLink } from "@/lib/open-external-link";

export function PerfilClient({
  name,
  phone,
  inviteCode,
  balance,
  profit,
  supportLink,
}: {
  name: string;
  phone: string;
  inviteCode: string;
  balance: number;
  profit: number;
  supportLink: string;
}) {
  const router = useRouter();
  const [isProfitModalOpen, setIsProfitModalOpen] = React.useState(false);
  const displayName = name.trim() || "Usuário";
  const profitLabel = profit.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const logout = async () => {
    clearSessionMarker();
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/login");
  };

  const items = [
    { icon: Wallet, label: "Registro de recargas", desc: "Veja todo o histórico de recargas realizadas", href: "/deposit-history" },
    { icon: ArrowUpCircle, label: "Registro de saques", desc: "Acompanhe seus saques e solicitações", href: "/withdraw-history" },
    { icon: Gift, label: "Resgatar código bônus", desc: "Digite seu código bônus e ganhe recompensas", href: "/bonus-code" },
    { icon: History, label: "Histórico completo", desc: "Consulte todas as movimentações da conta", href: "/history" },
    { icon: ShieldCheck, label: "Segurança da conta", desc: "Senha, autenticação e segurança", href: "/profile/security" },
    { icon: Headphones, label: "Atendimento ao cliente", desc: "Fale com nossa equipe de suporte", href: "/support" },
  ];

  return (
    <div className="space-y-6 pt-4 pb-28">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6">
        <div className="flex items-center gap-4">
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`}
            alt={displayName}
            className="h-20 w-20 rounded-full border-2 border-primary/50 object-cover p-1"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <h2 className="text-xl font-black tracking-tight">{displayName}</h2>
              <CheckCircle2 className="h-4 w-4 fill-primary text-black" />
            </div>
            <button type="button" onClick={() => void copyToClipboard(phone, "Telefone")} className="flex items-center gap-2">
              <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">{phone}</span>
              <Copy className="h-3 w-3 text-muted" />
            </button>
            <button type="button" onClick={() => void copyToClipboard(inviteCode, "Código")} className="flex items-center gap-2">
              <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">Código: {inviteCode}</span>
              <Copy className="h-3 w-3 text-muted" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
          <span className="text-[10px] font-bold tracking-wider text-muted uppercase">Saldo da Conta</span>
          <div className="text-lg font-black text-primary italic">{formatBRL(balance)}</div>
          <p className="text-[8px] text-muted">Disponível para saque e compras</p>
        </div>
        <button
          type="button"
          onClick={() => setIsProfitModalOpen(true)}
          className="space-y-3 rounded-2xl border border-border bg-surface p-4 text-left"
        >
          <span className="text-[10px] font-bold tracking-wider text-muted uppercase">Lucro Acumulado</span>
          <div className="flex items-center justify-between">
            <span className="text-lg font-black text-primary italic">{formatBRL(profit)}</span>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <p className="text-[8px] text-muted">Toque para ver o gráfico</p>
        </button>
      </div>

      <div className="divide-y divide-border/50 rounded-2xl border border-border bg-surface">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => {
              if (item.href === "/support" && supportLink.trim()) {
                openExternalLink(supportLink, "Link de atendimento ainda não configurado.");
                return;
              }
              router.push(item.href);
            }}
            className="flex w-full items-center justify-between p-4 text-left"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-primary">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-black tracking-tight uppercase">{item.label}</h4>
                <p className="text-[9px] font-medium text-muted">{item.desc}</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted" />
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => router.push("/referral")}
        className="flex w-full items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 p-4"
      >
        <div>
          <h4 className="text-[11px] font-black tracking-tight uppercase">Convide amigos e ganhe mais!</h4>
          <p className="text-[9px] text-muted">Quanto mais sua equipe cresce, maior é o seu ganho.</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-[9px] font-black">
          <UserPlus className="h-3 w-3" /> CONVIDAR
        </span>
      </button>

      <button type="button" onClick={() => void logout()} className="flex w-full flex-col items-center gap-1 py-4 text-red-500">
        <span className="flex items-center gap-2 text-xs font-black tracking-widest uppercase">
          <LogOut className="h-4 w-4" /> Sair da conta
        </span>
      </button>

      <ProfitEvolutionModal isOpen={isProfitModalOpen} onOpenChange={setIsProfitModalOpen} currentProfit={profitLabel} />
    </div>
  );
}
