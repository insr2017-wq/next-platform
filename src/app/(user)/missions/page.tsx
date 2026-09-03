"use client";

import * as React from "react";
import {
  Target,
  CheckCircle2,
  Clock,
  Zap,
  Users,
  ShieldCheck,
  Trophy,
  Gift,
  Wallet,
  ShoppingBag,
  Star,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ReferralGoalsTrack, type ReferralGoalItem } from "@/components/ReferralGoalsTrack";
import { NexusBackHeader } from "@/components/nexus/NexusBackHeader";
import type { UserMissionView } from "@/lib/missions/types";

function MissionIcon({ name, completed }: { name: string; completed: boolean }) {
  const cls = "text-primary";
  if (completed) return <CheckCircle2 size={20} className={cls} />;
  switch (name) {
    case "clock":
      return <Clock size={16} className={cls} />;
    case "shield":
      return <ShieldCheck size={16} className={cls} />;
    case "zap":
      return <Zap size={16} className={cls} />;
    case "users":
      return <Users size={16} className={cls} />;
    case "trophy":
      return <Trophy size={16} className={cls} />;
    case "gift":
      return <Gift size={16} className={cls} />;
    case "wallet":
      return <Wallet size={16} className={cls} />;
    case "shopping":
      return <ShoppingBag size={16} className={cls} />;
    case "star":
      return <Star size={16} className={cls} />;
    default:
      return <Target size={16} className={cls} />;
  }
}

function statusLabel(mission: UserMissionView) {
  if (mission.redeemed) return "Resgatada";
  if (mission.canRedeem) return "Resgatar";
  if (mission.completed) return "Concluída";
  return `${Math.min(mission.currentProgress, mission.targetValue).toLocaleString("pt-BR")}/${mission.targetValue.toLocaleString("pt-BR")}`;
}

function MissionCard({
  mission,
  redeeming,
  onRedeem,
}: {
  mission: UserMissionView;
  redeeming: boolean;
  onRedeem: (id: string) => void;
}) {
  const percentage =
    mission.targetValue > 0
      ? Math.min((mission.currentProgress / mission.targetValue) * 100, 100)
      : 0;
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background">
          <MissionIcon name={mission.icon} completed={mission.completed} />
        </div>
        <div className="flex-1 space-y-1">
          <h3 className="text-xs font-black tracking-wide uppercase">{mission.title}</h3>
          <p className="text-[10px] text-muted">{mission.description}</p>
          <div className="h-1.5 overflow-hidden rounded-full border border-border bg-background">
            <div className="h-full rounded-full bg-primary/60" style={{ width: `${percentage}%` }} />
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] font-black text-primary">{mission.rewardLabel}</span>
            {mission.canRedeem ? (
              <button
                type="button"
                disabled={redeeming}
                onClick={() => onRedeem(mission.id)}
                className="rounded-md bg-primary px-2 py-1 text-[9px] font-black text-black uppercase disabled:opacity-60"
              >
                {redeeming ? "..." : "Resgatar"}
              </button>
            ) : (
              <span className="text-[9px] font-black text-primary uppercase">{statusLabel(mission)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MissionsPage() {
  const [activeTab, setActiveTab] = React.useState<"weekly" | "achievements" | "referrals">("weekly");
  const [items, setItems] = React.useState<UserMissionView[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [redeemingId, setRedeemingId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      const res = await fetch("/api/user/missions");
      const data = await res.json().catch(() => ({}));
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function onRedeem(id: string) {
    setRedeemingId(id);
    try {
      const res = await fetch(`/api/user/missions/${id}/redeem`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Não foi possível resgatar.");
        return;
      }
      toast.success(typeof data.message === "string" ? data.message : "Recompensa resgatada.");
      await load();
    } catch {
      toast.error("Erro de conexão.");
    } finally {
      setRedeemingId(null);
    }
  }

  const weekly = items.filter((m) => m.type === "semanal");
  const achievements = items.filter((m) => m.type === "permanente");
  const referrals: ReferralGoalItem[] = items
    .filter((m) => m.type === "meta_indicacao")
    .map((m) => ({
      id: m.id,
      title: m.title,
      target: m.targetValue,
      current: m.currentProgress,
      rewardLabel: m.rewardLabel,
      completed: m.completed,
      canRedeem: m.canRedeem,
    }));

  return (
    <div className="space-y-6 pt-4 pb-8">
      <NexusBackHeader title="Missões" />
      <div className="flex rounded-xl border border-border bg-surface p-1">
        {(["weekly", "achievements", "referrals"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-lg py-2.5 text-[10px] font-black uppercase ${activeTab === tab ? "bg-primary text-black" : "text-muted"}`}
          >
            {tab === "weekly" ? "Semanais" : tab === "achievements" ? "Conquistas" : "Indicação"}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-[10px] text-muted">
            Carregando missões...
          </motion.div>
        ) : activeTab === "weekly" ? (
          <motion.div key="weekly" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {weekly.length === 0 ? (
              <p className="text-center text-[10px] text-muted">Nenhuma missão semanal ativa.</p>
            ) : (
              weekly.map((m) => (
                <MissionCard key={m.id} mission={m} redeeming={redeemingId === m.id} onRedeem={onRedeem} />
              ))
            )}
          </motion.div>
        ) : activeTab === "achievements" ? (
          <motion.div key="achievements" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {achievements.length === 0 ? (
              <p className="text-center text-[10px] text-muted">Nenhuma conquista permanente ativa.</p>
            ) : (
              achievements.map((m) => (
                <MissionCard key={m.id} mission={m} redeeming={redeemingId === m.id} onRedeem={onRedeem} />
              ))
            )}
          </motion.div>
        ) : (
          <motion.div key="referrals" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <ReferralGoalsTrack missions={referrals} />
            {referrals.some((r) => r.canRedeem) ? (
              <div className="space-y-2">
                {items
                  .filter((m) => m.type === "meta_indicacao" && m.canRedeem)
                  .map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      disabled={redeemingId === m.id}
                      onClick={() => onRedeem(m.id)}
                      className="w-full rounded-xl bg-primary py-2.5 text-[10px] font-black text-black uppercase"
                    >
                      Resgatar {m.title}
                    </button>
                  ))}
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
