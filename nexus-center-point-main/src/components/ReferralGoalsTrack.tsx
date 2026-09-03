import * as React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Users, Gift, ChevronDown } from 'lucide-react';
import {
  ACTIVE_REFERRALS,
  REFERRAL_GOALS,
  formatBRL,
  getNextGoal,
  type ReferralGoal,
} from '@/constants/referralGoals';

function GoalCard({
  goal,
  current,
  expanded,
  onToggle,
}: {
  goal: ReferralGoal;
  current: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const completed = current >= goal.target;
  const progress = Math.min(current, goal.target);
  const percentage = Math.min((current / goal.target) * 100, 100);

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full text-left relative overflow-hidden rounded-xl border p-4 transition-all ${
        completed
          ? 'bg-surface/40 border-primary/20'
          : 'bg-surface border-border active:scale-[0.98]'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
            completed ? 'bg-primary/10' : 'bg-background border border-border'
          }`}
        >
          {completed ? (
            <CheckCircle2 size={20} className="text-primary" />
          ) : (
            <span className="text-xs font-black text-primary">{goal.level}</span>
          )}
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h3
              className={`text-xs font-black uppercase tracking-wide ${
                completed ? 'text-primary' : 'text-foreground'
              }`}
            >
              Nível {goal.level} · {goal.target} indicados
            </h3>
            {completed ? (
              <span className="text-[8px] font-black uppercase text-primary border border-primary/30 px-1.5 py-0.5 rounded italic">
                Concluída
              </span>
            ) : (
              <ChevronDown
                size={14}
                className={`text-muted transition-transform ${expanded ? 'rotate-180' : ''}`}
              />
            )}
          </div>

          <p className="text-[10px] text-muted leading-tight">
            Alcance {goal.target} indicados ativos e receba a recompensa
          </p>

          <div className="pt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-muted">Progresso</span>
              <span className="text-[10px] font-bold text-foreground">
                {progress}/{goal.target} indicados ativos
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-background overflow-hidden border border-border">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                className={`h-full rounded-full ${completed ? 'bg-primary' : 'bg-primary/60'}`}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex flex-col">
              <span className="text-[8px] font-bold uppercase text-muted">Recompensa</span>
              <span className="text-[10px] font-black text-primary">{formatBRL(goal.reward)}</span>
            </div>
            {!completed && (
              <span className="rounded bg-primary/10 px-3 py-1 text-[9px] font-black uppercase text-primary border border-primary/20">
                Faltam {goal.target - current}
              </span>
            )}
          </div>

          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2 rounded-lg border border-border bg-background/60 p-3 space-y-1"
            >
              <p className="text-[10px] text-muted">
                Meta: <span className="text-foreground font-bold">{goal.target}</span> indicados ativos
              </p>
              <p className="text-[10px] text-muted">
                Atuais: <span className="text-foreground font-bold">{current}</span>
              </p>
              <p className="text-[10px] text-muted">
                Recompensa:{' '}
                <span className="text-primary font-black">{formatBRL(goal.reward)}</span>
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </button>
  );
}

export function ReferralGoalsTrack({
  current = ACTIVE_REFERRALS,
  compact = false,
}: {
  current?: number;
  compact?: boolean;
}) {
  const [expanded, setExpanded] = React.useState<number | null>(null);
  const next = getNextGoal(current);
  const goals = compact ? REFERRAL_GOALS : REFERRAL_GOALS;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg bg-primary/10 border border-primary/20 p-3">
        <div className="flex items-center gap-2">
          <Users size={14} className="text-primary" />
          <span className="text-[10px] font-black uppercase text-primary italic">
            {current} indicados ativos
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Gift size={12} className="text-primary" />
          <span className="text-[10px] font-black text-primary">
            {next ? `Próxima: ${formatBRL(next.reward)} em ${next.target}` : 'Trilha concluída'}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {goals.map((goal) => (
          <GoalCard
            key={goal.level}
            goal={goal}
            current={current}
            expanded={expanded === goal.level}
            onToggle={() => setExpanded(expanded === goal.level ? null : goal.level)}
          />
        ))}
      </div>
    </div>
  );
}
