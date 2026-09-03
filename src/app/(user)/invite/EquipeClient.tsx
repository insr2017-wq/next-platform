"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Users, Copy, Share2, Wallet, DollarSign, Megaphone, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ReferralGoalsTrack, type ReferralGoalItem } from "@/components/ReferralGoalsTrack";
import { formatBRL } from "@/lib/format-brl";
import { buildInviteLink } from "@/lib/invite-link";
import type { TeamData } from "@/lib/team-data";

export function EquipeClient({
  team,
  commissionLevel1,
  commissionLevel2,
  commissionLevel3,
  depositCommissionL1First,
  depositCommissionL1Next,
  depositCommissionL2,
  depositCommissionL3,
  referralMissions,
}: {
  team: TeamData;
  commissionLevel1: number;
  commissionLevel2: number;
  commissionLevel3: number;
  depositCommissionL1First: number;
  depositCommissionL1Next: number;
  depositCommissionL2: number;
  depositCommissionL3: number;
  totalInvested: number;
  referralMissions: ReferralGoalItem[];
}) {
  const router = useRouter();
  const referralLink = buildInviteLink(team.inviteCode);
  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copiado com sucesso!`);
  };

  const commissionLevels = [
    { level: "LV1", return: `${depositCommissionL1First}% / ${depositCommissionL1Next}%`, current: `${commissionLevel1}%`, members: team.level1Count, deposit: team.level1DepositTotal },
    { level: "LV2", return: `${depositCommissionL2}%`, current: `${commissionLevel2}%`, members: team.level2Count, deposit: team.level2DepositTotal },
    { level: "LV3", return: `${depositCommissionL3}%`, current: `${commissionLevel3}%`, members: team.level3Count, deposit: team.level3DepositTotal },
  ];

  return (
    <div className="space-y-8 py-6 pb-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[32px] border border-white/5 bg-gradient-to-br from-[#0D1117] to-[#05070A] p-8"
      >
        <span className="text-[10px] font-black tracking-[0.2em] text-primary uppercase">Construa sua equipe</span>
        <h1 className="mt-2 text-3xl leading-tight font-black text-white uppercase italic">
          Junte-se.<br />Cresça. <span className="text-primary">Ganhe.</span>
        </h1>
        <p className="mt-4 max-w-[200px] text-xs leading-relaxed text-muted-foreground">
          Convide amigos e ganhe comissões em diferentes níveis.
        </p>
      </motion.div>

      <section>
        <h2 className="mb-6 text-sm font-black tracking-widest text-white uppercase">Níveis de Comissão</h2>
        <div className="grid grid-cols-3 gap-3">
          {commissionLevels.map((item) => (
            <div key={item.level} className="flex flex-col items-center rounded-2xl border border-white/5 bg-[#0D1117] p-4 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-primary/30">
                <span className="text-[10px] font-black text-primary">{item.level}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Trilha <span className="font-bold text-primary">{item.return}</span>
              </p>
              <p className="text-[9px] text-muted-foreground">Atual {item.current}</p>
              <p className="mt-2 text-xs font-black text-white">{item.members}</p>
              <p className="text-[10px] font-black text-white">{formatBRL(item.deposit)}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-[9px] text-muted italic">
          Trilha de depósito no 1º e demais aportes; “Atual” é a comissão na compra de produto.
        </p>
      </section>

      <section className="rounded-[32px] border border-white/5 bg-[#0D1117] p-6">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Share2 className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-black text-white uppercase italic">Convite e Ganhe</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-black/40 p-3">
            <div className="min-w-0 flex-1">
              <p className="text-[9px] tracking-widest text-muted-foreground uppercase">Código de convite</p>
              <p className="truncate text-sm font-black text-primary">{team.inviteCode}</p>
            </div>
            <Button size="sm" onClick={() => void copyToClipboard(team.inviteCode, "Código")} className="h-8 rounded-lg bg-primary px-4 text-[10px] font-black text-black">
              COPIAR
            </Button>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-black/40 p-3">
            <div className="min-w-0 flex-1">
              <p className="text-[9px] tracking-widest text-muted-foreground uppercase">Link de convite</p>
              <p className="truncate text-[10px] text-white/60 italic">{referralLink}</p>
            </div>
            <Button size="sm" onClick={() => void copyToClipboard(referralLink, "Link")} className="h-8 rounded-lg bg-primary px-4 text-[10px] font-black text-black">
              COPIAR
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-white/5 bg-[#0D1117] p-6">
        <div className="mb-6 grid grid-cols-3 gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[8px] font-black text-muted-foreground uppercase">Membros</span>
            </div>
            <p className="text-sm font-black text-white">{team.totalMembers}</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[8px] font-black text-muted-foreground uppercase">Recargas</span>
            </div>
            <p className="text-sm font-black text-white">{formatBRL(team.teamRechargeTotal)}</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[8px] font-black text-muted-foreground uppercase">Depósito LV1</span>
            </div>
            <p className="text-sm font-black text-white">{formatBRL(team.level1DepositTotal)}</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push("/invite")}
          className="h-10 w-full rounded-xl border-primary/20 text-[10px] font-black tracking-widest text-primary uppercase"
        >
          Ver extrato da rede <ChevronRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </section>

      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-sm font-black tracking-widest text-white uppercase">Metas de Indicação</h2>
          <button type="button" onClick={() => router.push("/missions")} className="flex items-center gap-1 text-[10px] text-muted-foreground">
            Ver missões <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <ReferralGoalsTrack missions={referralMissions} />
      </section>

      <section className="flex items-start gap-4 rounded-2xl border border-primary/10 bg-primary/5 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20">
          <Megaphone className="h-5 w-5 text-primary" />
        </div>
        <p className="text-[11px] text-muted-foreground">Quanto mais sua equipe cresce, maior é o seu potencial de ganhos!</p>
      </section>
    </div>
  );
}
