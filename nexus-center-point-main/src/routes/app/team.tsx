import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Copy, HelpCircle, Share2, Wallet, DollarSign, Megaphone, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ReferralGoalsTrack } from '@/components/ReferralGoalsTrack';


export const Route = createFileRoute('/app/team')({
  component: TeamPage,
});

function TeamPage() {
  const navigate = useNavigate();
  const referralCode = "48A7B9";
  const referralLink = `https://nexustech.com/${referralCode}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado com sucesso!`);
  };

  const commissionLevels = [
    { level: 'LV1', return: '20% / 8%', members: 0, deposit: 'R$ 0,00' },
    { level: 'LV2', return: '2%', members: 0, deposit: 'R$ 0,00' },
    { level: 'LV3', return: '1%', members: 0, deposit: 'R$ 0,00' },
  ];

  const teamStats = [
    { label: 'MEMBROS TOTAIS', value: '0', icon: Users },
    { label: 'GANHOS TOTAIS', value: 'R$ 0,00', icon: DollarSign },
    { label: 'SAQUE DISPONÍVEL', value: 'R$ 0,00', icon: Wallet },
  ];

  return (
    <div className="py-6 space-y-8 pb-10">
      {/* Hero Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#0D1117] to-[#05070A] border border-white/5 p-8"
      >
        <div className="relative z-10 max-w-[200px]">
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Construa sua equipe</span>
          <h1 className="mt-2 text-3xl font-black leading-tight text-white uppercase italic">
            Junte-se.<br />
            Cresça. <span className="text-primary">Ganhe.</span>
          </h1>
          <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
            Convide amigos e ganhe comissões em diferentes níveis.
          </p>
        </div>
        
        {/* Background Graphic - Simplified placeholder for the image graphic */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-l from-primary/20 to-transparent" />
          <Users className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 text-primary" />
        </div>
      </motion.div>

      {/* Commission Levels */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-black text-white uppercase tracking-widest">Níveis de Comissão</h2>
          <button className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-white transition-colors">
            Saiba como funciona <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {commissionLevels.map((item, idx) => (
            <motion.div 
              key={item.level}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="flex flex-col items-center p-4 rounded-2xl bg-[#0D1117] border border-white/5 text-center"
            >
              <div className="w-10 h-10 rounded-full border border-primary/30 flex items-center justify-center mb-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-[10px] font-black text-primary">{item.level}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground">Retorno <span className="text-primary font-bold">{item.return}</span></p>
                <div className="py-2">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-tighter">Pessoas Totais</p>
                  <p className="text-xs font-black text-white">{item.members}</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-tighter">Depósito</p>
                  <p className="text-[10px] font-black text-white">{item.deposit}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Invite Section */}
      <section className="relative overflow-hidden rounded-[32px] bg-[#0D1117] border border-white/5 p-6 sm:p-8">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <Share2 className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-black text-white uppercase italic mb-2">Convite e Ganhe</h2>
          <p className="text-xs text-muted-foreground max-w-[280px]">
            Compartilhe seu código ou link e comece a ganhar com cada novo membro que se juntar à Nexus Tech!
          </p>
        </div>

        <div className="space-y-3">
          {/* Referral Code */}
          <div className="flex items-center gap-3 bg-black/40 rounded-2xl p-3 border border-white/5">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-0.5">Código de convite</p>
              <p className="text-sm font-black text-primary truncate">{referralCode}</p>
            </div>
            <Button 
              size="sm"
              onClick={() => copyToClipboard(referralCode, "Código")}
              className="bg-primary hover:bg-primary/90 text-black font-black text-[10px] rounded-lg h-8 px-4"
            >
              COPIAR <Copy className="w-3 h-3 ml-1.5" />
            </Button>
          </div>

          {/* Referral Link */}
          <div className="flex items-center gap-3 bg-black/40 rounded-2xl p-3 border border-white/5">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
              <Share2 className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-0.5">Link de convite</p>
              <p className="text-[10px] font-medium text-white/60 truncate italic">{referralLink}</p>
            </div>
            <Button 
              size="sm"
              onClick={() => copyToClipboard(referralLink, "Link")}
              className="bg-primary hover:bg-primary/90 text-black font-black text-[10px] rounded-lg h-8 px-4"
            >
              COPIAR <Copy className="w-3 h-3 ml-1.5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Summary */}
      <section className="bg-[#0D1117] border border-white/5 rounded-[32px] p-6">
        <div className="grid grid-cols-3 gap-2 mb-6">
          {teamStats.map((stat) => (
            <div key={stat.label} className="space-y-2">
              <div className="flex items-center gap-1.5">
                <stat.icon className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[8px] font-black text-muted-foreground tracking-tighter uppercase">{stat.label}</span>
              </div>
              <p className="text-sm font-black text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        <Button 
          variant="outline"
          onClick={() => navigate({ to: '/app/network-extract' })}
          className="w-full border-primary/20 bg-transparent text-primary hover:bg-primary/5 hover:text-primary rounded-xl h-10 text-[10px] font-black uppercase tracking-widest"
        >
          Ver extrato completo <ChevronRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </section>

      {/* Referral Goals Track */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-black text-white uppercase tracking-widest">Metas de Indicação</h2>
          <button
            onClick={() => navigate({ to: '/app/missions' })}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-white transition-colors"
          >
            Ver missões <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <ReferralGoalsTrack />
      </section>

      {/* Nexus Tip */}

      <section className="bg-primary/5 border border-primary/10 rounded-2xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
          <Megaphone className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] font-black text-white uppercase italic mb-1">Dica NEXUS</h3>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Quanto mais sua equipe cresce, maior é o seu potencial de ganhos!
          </p>
        </div>
        <Button size="sm" variant="ghost" className="text-primary font-black text-[10px] p-0 h-auto hover:bg-transparent uppercase tracking-wider">
          Saiba mais
        </Button>
      </section>
    </div>
  );
}