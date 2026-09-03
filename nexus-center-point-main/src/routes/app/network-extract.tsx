import * as React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  User,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/app/network-extract')({
  component: NetworkExtractPage,
});

interface Deposit {
  date: string;
  amount: number;
}

interface Member {
  id: string;
  name: string;
  joinDate: string;
  deposits?: Deposit[];
  invested: number;
  commission: number;
}

// Nível 1: 20% sobre o 1º aporte + 8% sobre os aportes seguintes
const L1_FIRST_RATE = 0.2;
const L1_NEXT_RATE = 0.08;

const buildL1 = (
  id: string,
  name: string,
  joinDate: string,
  deposits: Deposit[],
): Member => {
  const invested = deposits.reduce((s, d) => s + d.amount, 0);
  const commission = deposits.reduce(
    (s, d, i) => s + d.amount * (i === 0 ? L1_FIRST_RATE : L1_NEXT_RATE),
    0,
  );
  return { id, name, joinDate, deposits, invested, commission };
};

const LEVEL_1_MEMBERS: Member[] = [
  buildL1('1', 'Ricardo Silva', '10/08/2026', [
    { date: '10/08/2026', amount: 600.0 },
    { date: '18/08/2026', amount: 400.0 },
    { date: '02/09/2026', amount: 200.0 },
  ]),
  buildL1('2', 'Ana Souza', '08/08/2026', [{ date: '08/08/2026', amount: 500.0 }]),
  buildL1('3', 'Bruno Mendes', '05/08/2026', [
    { date: '05/08/2026', amount: 1200.0 },
    { date: '21/08/2026', amount: 800.0 },
  ]),
];

const sum = (arr: Member[], key: 'invested' | 'commission') =>
  arr.reduce((s, m) => s + m[key], 0);

const MOCK_NETWORK_DATA: Record<1 | 2 | 3, { members: Member[]; summary: { count: number; totalInvested: number; totalCommission: number } }> = {
  1: {
    members: LEVEL_1_MEMBERS,
    summary: {
      count: LEVEL_1_MEMBERS.length,
      totalInvested: sum(LEVEL_1_MEMBERS, 'invested'),
      totalCommission: sum(LEVEL_1_MEMBERS, 'commission'),
    },
  },
  2: {
    members: [
      { id: '4', name: 'Carla Oliveira', joinDate: '09/08/2026', invested: 300.00, commission: 6.00 },
      { id: '5', name: 'Diego Santos', joinDate: '07/08/2026', invested: 800.00, commission: 16.00 },
    ],
    summary: { count: 2, totalInvested: 1100.00, totalCommission: 22.00 }
  },
  3: {
    members: [
      { id: '6', name: 'Eduardo Lima', joinDate: '11/08/2026', invested: 100.00, commission: 1.00 },
    ],
    summary: { count: 1, totalInvested: 100.00, totalCommission: 1.00 }
  }
};

function NetworkExtractPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState<1 | 2 | 3>(1);

  const currentLevel = MOCK_NETWORK_DATA[activeTab];

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-background/80 backdrop-blur-md border-b border-border">
        <button 
          onClick={() => navigate({ to: '/app/team' })}
          className="h-10 w-10 rounded-xl bg-surface border border-border flex items-center justify-center text-white hover:text-primary transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-sm font-black uppercase tracking-widest text-white italic">
          Extrato da Rede
        </h1>
        <div className="w-10" /> {/* Spacer */}
      </header>

      <main className="flex-1 p-6 space-y-6">
        {/* Tabs */}
        <div className="flex p-1 bg-surface border border-border rounded-2xl">
          {([1, 2, 3] as const).map((level) => (
            <button
              key={level}
              onClick={() => setActiveTab(level)}
              className={cn(
                "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                activeTab === level 
                  ? "bg-primary text-black shadow-lg" 
                  : "text-muted-foreground hover:text-white"
              )}
            >
              Nível {level}
            </button>
          ))}
        </div>

        {/* Level Summary */}
        <motion.div 
          key={`summary-${activeTab}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-2 p-5 bg-surface border border-border rounded-[24px]"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3 text-muted-foreground" />
              <span className="text-[8px] font-bold text-muted uppercase tracking-tighter">Membros</span>
            </div>
            <p className="text-sm font-black text-white">{currentLevel.summary.count}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
              <span className="text-[8px] font-bold text-muted uppercase tracking-tighter">Investido</span>
            </div>
            <p className="text-sm font-black text-white text-nowrap">R$ {currentLevel.summary.totalInvested.toFixed(2)}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-primary" />
              <span className="text-[8px] font-bold text-primary uppercase tracking-tighter italic">Comissão</span>
            </div>
            <p className="text-sm font-black text-primary italic">R$ {currentLevel.summary.totalCommission.toFixed(2)}</p>
          </div>
        </motion.div>

        {/* Members List */}
        <div className="space-y-4">
          <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1">
            Lista de Indicados
          </h2>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-3"
            >
              {currentLevel.members.map((member) => (
                <div 
                  key={member.id}
                  className="group relative overflow-hidden rounded-[24px] bg-surface border border-border p-5 transition-all hover:border-primary/20"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-background border border-border flex items-center justify-center group-hover:border-primary/30 transition-colors">
                        <User className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white italic">{member.name}</h3>
                        <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-medium">
                          <Calendar className="h-3 w-3" />
                          Entrou em {member.joinDate}
                        </div>
                      </div>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary italic text-[10px] font-black">
                      N{activeTab}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-background/50 rounded-xl border border-white/[0.02]">
                      <p className="text-[8px] font-bold text-muted uppercase tracking-wider mb-1">Total Investido</p>
                      <p className="text-xs font-black text-white leading-none">R$ {member.invested.toFixed(2)}</p>
                    </div>
                    <div className="p-3 bg-primary/[0.03] rounded-xl border border-primary/5">
                      <p className="text-[8px] font-bold text-primary uppercase tracking-wider mb-1 italic">Sua Comissão</p>
                      <p className="text-xs font-black text-primary italic leading-none">R$ {member.commission.toFixed(2)}</p>
                    </div>
                  </div>

                  {member.deposits && member.deposits.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-[8px] font-bold text-muted uppercase tracking-wider">Aportes do indicado</p>
                      {member.deposits.map((dep, i) => (
                        <div
                          key={`${member.id}-${i}`}
                          className={cn(
                            "flex items-center justify-between rounded-xl border p-3",
                            i === 0
                              ? "bg-primary/[0.06] border-primary/20"
                              : "bg-background/50 border-white/[0.03]"
                          )}
                        >
                          <div>
                            <p className="text-[10px] font-black text-white leading-none">
                              {i === 0 ? '1º aporte' : `${i + 1}º aporte`} · R$ {dep.amount.toFixed(2)}
                            </p>
                            <p className="mt-1 text-[9px] text-muted-foreground font-medium">{dep.date}</p>
                          </div>
                          <div className="text-right">
                            <span
                              className={cn(
                                "inline-block rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-wider",
                                i === 0
                                  ? "bg-primary text-black"
                                  : "bg-white/5 text-muted-foreground"
                              )}
                            >
                              {i === 0 ? '20% de comissão' : '8% de comissão'}
                            </span>
                            <p className="mt-1 text-[10px] font-black text-primary italic leading-none">
                              + R$ {(dep.amount * (i === 0 ? L1_FIRST_RATE : L1_NEXT_RATE)).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                      <p className="pt-1 text-[9px] font-bold text-muted-foreground italic">
                        Comissão total gerada: <span className="text-primary">R$ {member.commission.toFixed(2)}</span> (20% no 1º aporte + 8% nos demais)
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {currentLevel.members.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center opacity-20">
                    <Users className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-xs font-bold text-muted uppercase tracking-widest italic">Nenhum membro neste nível</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}