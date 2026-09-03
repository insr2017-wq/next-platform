import * as React from 'react';
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Trophy, Target, CheckCircle2, Clock, Zap, Users, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ReferralGoalsTrack } from "@/components/ReferralGoalsTrack";


export const Route = createFileRoute("/app/missions")({
  component: MissionsPage,
});

type Mission = {
  id: string;
  title: string;
  description: string;
  reward: string;
  progress: number;
  total: number;
  completed: boolean;
  icon: React.ReactNode;
};

const WEEKLY_MISSIONS: Mission[] = [
  {
    id: "login-roulette",
    title: "Login e Roleta",
    description: "Faça login e gire a roleta por 5 dias seguidos",
    reward: "R$ 5,00",
    progress: 3,
    total: 5,
    completed: false,
    icon: <Clock size={16} className="text-primary" />
  },
  {
    id: "complete-profile",
    title: "Perfil completo",
    description: "Complete seu perfil e cadastre sua chave Pix",
    reward: "Giro extra",
    progress: 1,
    total: 1,
    completed: true,
    icon: <ShieldCheck size={16} className="text-primary" />
  },
  {
    id: "weekly-referral",
    title: "Nova indicação da semana",
    description: "Convide 1 nova pessoa essa semana",
    reward: "R$ 2,00",
    progress: 0,
    total: 1,
    completed: false,
    icon: <Zap size={16} className="text-primary" />
  }
];

const ACHIEVEMENTS: Mission[] = [
  {
    id: "first-active",
    title: "Primeiro indicado ativo",
    description: "Compartilhe seu link com 30 pessoas e traga ao menos 1 indicado ativo",
    reward: "R$ 10,00 + Bônus",
    progress: 15,
    total: 30,
    completed: false,
    icon: <Users size={16} className="text-primary" />
  },
  {
    id: "5-active",
    title: "5 indicados ativos",
    description: "Traga 5 amigos que realizem a primeira compra",
    reward: "R$ 50,00",
    progress: 2,
    total: 5,
    completed: false,
    icon: <Users size={16} className="text-primary" />
  },
  {
    id: "15-active",
    title: "15 indicados ativos",
    description: "Alcance o status de Indicador Elite com sua rede",
    reward: "R$ 200,00 + Selo Elite",
    progress: 2,
    total: 15,
    completed: false,
    icon: <Trophy size={16} className="text-primary" />
  },
  {
    id: "network-2000",
    title: "Rede de R$ 2.000",
    description: "Volume total movimentado pela sua rede",
    reward: "R$ 100,00",
    progress: 850,
    total: 2000,
    completed: false,
    icon: <Target size={16} className="text-primary" />
  },
  {
    id: "network-5000",
    title: "Rede de R$ 5.000",
    description: "Cresça sua rede e aumente seus ganhos passivos",
    reward: "R$ 300,00",
    progress: 850,
    total: 5000,
    completed: false,
    icon: <Target size={16} className="text-primary" />
  },
  {
    id: "network-10000",
    title: "Rede de R$ 10.000",
    description: "O topo da Nexus Tech: Maior % de comissão",
    reward: "R$ 1.000,00 + Benefícios",
    progress: 850,
    total: 10000,
    completed: false,
    icon: <Trophy size={16} className="text-primary" />
  }
];

function MissionCard({ mission }: { mission: Mission }) {
  const percentage = Math.min((mission.progress / mission.total) * 100, 100);
  
  return (
    <div className={`relative overflow-hidden rounded-xl border p-4 transition-all ${mission.completed ? 'bg-surface/40 border-primary/20 opacity-80' : 'bg-surface border-border active:scale-[0.98]'}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${mission.completed ? 'bg-primary/10' : 'bg-background border border-border'}`}>
          {mission.completed ? <CheckCircle2 size={20} className="text-primary" /> : mission.icon}
        </div>
        
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <h3 className={`text-xs font-black uppercase tracking-wide ${mission.completed ? 'text-primary' : 'text-foreground'}`}>
              {mission.title}
            </h3>
            {mission.completed && (
              <span className="text-[8px] font-black uppercase text-primary border border-primary/30 px-1.5 py-0.5 rounded italic">Concluída</span>
            )}
          </div>
          <p className="text-[10px] text-muted leading-tight line-clamp-2">{mission.description}</p>
          
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-muted">Progresso</span>
              <span className="text-[10px] font-bold text-foreground">
                {mission.id.includes('network') ? `R$ ${mission.progress}` : mission.progress} / {mission.id.includes('network') ? `R$ ${mission.total}` : mission.total}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-background overflow-hidden border border-border">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                className={`h-full rounded-full ${mission.completed ? 'bg-primary' : 'bg-primary/60'}`} 
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex flex-col">
              <span className="text-[8px] font-bold uppercase text-muted">Recompensa</span>
              <span className="text-[10px] font-black text-primary">{mission.reward}</span>
            </div>
            {!mission.completed && (
              <button className="rounded bg-primary/10 px-3 py-1 text-[9px] font-black uppercase text-primary border border-primary/20">
                Em andamento
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MissionsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState<'weekly' | 'achievements' | 'referrals'>('weekly');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate({ to: "/app" })}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface border border-border active:scale-95"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-sm font-black uppercase tracking-widest italic">Missões</h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-surface p-1 border border-border">
        <button
          onClick={() => setActiveTab('weekly')}
          className={`flex-1 rounded-lg py-2.5 text-[10px] font-black uppercase tracking-wider transition-all ${
            activeTab === 'weekly' ? 'bg-primary text-black' : 'text-muted'
          }`}
        >
          Semanais
        </button>
        <button
          onClick={() => setActiveTab('achievements')}
          className={`flex-1 rounded-lg py-2.5 text-[10px] font-black uppercase tracking-wider transition-all ${
            activeTab === 'achievements' ? 'bg-primary text-black' : 'text-muted'
          }`}
        >
          Conquistas
        </button>
        <button
          onClick={() => setActiveTab('referrals')}
          className={`flex-1 rounded-lg py-2.5 text-[10px] font-black uppercase tracking-wider transition-all ${
            activeTab === 'referrals' ? 'bg-primary text-black' : 'text-muted'
          }`}
        >
          Indicação
        </button>
      </div>


      {/* Content */}
      <div className="space-y-4">
        <AnimatePresence mode="wait">
          {activeTab === 'weekly' ? (
            <motion.div
              key="weekly"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between rounded-lg bg-primary/10 border border-primary/20 p-3">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-primary" />
                  <span className="text-[10px] font-black uppercase text-primary italic">Reseta em:</span>
                </div>
                <span className="text-[10px] font-black text-primary">5 dias, 14 horas</span>
              </div>
              
              <div className="space-y-3">
                {WEEKLY_MISSIONS.map((mission) => (
                  <MissionCard key={mission.id} mission={mission} />
                ))}
              </div>
            </motion.div>
          ) : activeTab === 'achievements' ? (
            <motion.div
              key="achievements"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between rounded-lg bg-surface/30 border border-border p-3">
                <div className="flex items-center gap-2">
                  <Trophy size={14} className="text-primary" />
                  <span className="text-[10px] font-black uppercase text-muted italic">Metas de Rede:</span>
                </div>
                <span className="text-[10px] font-black text-foreground uppercase tracking-widest italic">Nexus Elite</span>
              </div>
              
              <div className="space-y-3">
                {ACHIEVEMENTS.map((mission) => (
                  <MissionCard key={mission.id} mission={mission} />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="referrals"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between rounded-lg bg-surface/30 border border-border p-3">
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-primary" />
                  <span className="text-[10px] font-black uppercase text-muted italic">Metas de Indicação</span>
                </div>
                <span className="text-[10px] font-black text-foreground uppercase tracking-widest italic">7 Níveis</span>
              </div>

              <ReferralGoalsTrack />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
