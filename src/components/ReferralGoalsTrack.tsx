"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Users, Gift, ChevronDown } from "lucide-react";

export type ReferralGoalItem = {
  id: string;
  title: string;
  target: number;
  current: number;
  rewardLabel: string;
  completed: boolean;
  canRedeem?: boolean;
};

function GoalCard({
  goal,
  index,
  expanded,
  onToggle,
}: {
  goal: ReferralGoalItem;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const progress = Math.min(goal.current, goal.target);
  const percentage = goal.target > 0 ? Math.min((goal.current / goal.target) * 100, 100) : 0;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative w-full overflow-hidden rounded-xl border p-4 text-left ${
        goal.completed ? "border-primary/20 bg-surface/40" : "border-border bg-surface"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${goal.completed ? "bg-primary/10" : "border border-border bg-background"}`}>
          {goal.completed ? <CheckCircle2 size={20} className="text-primary" /> : <span className="text-xs font-black text-primary">{index + 1}</span>}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className={`text-xs font-black tracking-wide uppercase ${goal.completed ? "text-primary" : "text-foreground"}`}>
              {goal.title}
            </h3>
            {goal.completed ? (
              <span className="rounded border border-primary/30 px-1.5 py-0.5 text-[8px] font-black text-primary uppercase italic">Concluída</span>
            ) : (
              <ChevronDown size={14} className={`text-muted ${expanded ? "rotate-180" : ""}`} />
            )}
          </div>
          <div className="h-1.5 overflow-hidden rounded-full border border-border bg-background">
            <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} className="h-full rounded-full bg-primary" />
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-[10px] font-black text-primary">{goal.rewardLabel}</span>
            <span className="text-[10px] font-bold text-muted">
              {progress}/{goal.target}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

export function ReferralGoalsTrack({ missions }: { missions: ReferralGoalItem[] }) {
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const current = missions.reduce((max, m) => Math.max(max, m.current), 0);
  const next = missions.find((m) => !m.completed) ?? null;

  if (missions.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4 text-center text-[10px] text-muted">
        Nenhuma meta de indicação ativa no momento.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/10 p-3">
        <div className="flex items-center gap-2">
          <Users size={14} className="text-primary" />
          <span className="text-[10px] font-black text-primary uppercase italic">{current} no progresso atual</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Gift size={12} className="text-primary" />
          <span className="text-[10px] font-black text-primary">
            {next ? `Próxima: ${next.rewardLabel}` : "Trilha concluída"}
          </span>
        </div>
      </div>
      <div className="space-y-3">
        {missions.map((goal, index) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            index={index}
            expanded={expanded === goal.id}
            onToggle={() => setExpanded(expanded === goal.id ? null : goal.id)}
          />
        ))}
      </div>
    </div>
  );
}
