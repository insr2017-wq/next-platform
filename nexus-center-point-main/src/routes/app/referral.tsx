import * as React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ChevronLeft, Share2, Users, TrendingUp, Zap, ChevronRight, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/app/referral')({
  component: ReferralPage,
});

function ReferralPage() {
  const navigate = useNavigate();
  const [copied, setCopied] = React.useState(false);
  const referralCode = "NEXUS777";
  const referralLink = "https://nexus.tech/register?ref=NEXUS777";

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copiado com sucesso!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="pb-28">
      {/* Header */}
      <div className="sticky top-0 z-50 flex items-center justify-between bg-background/80 px-4 py-4 backdrop-blur-lg">
        <button 
          onClick={() => navigate({ to: '/app' })}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface border border-border text-foreground transition-colors active:scale-95"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-sm font-black uppercase tracking-[0.2em]">Indique e Ganhe</h1>
        <div className="w-10" />
      </div>

      {/* Hero Section */}
      <div className="relative h-64 w-full overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop" 
          alt="Networking and Connections" 
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6">
          <h2 className="text-3xl font-black italic text-primary leading-none uppercase">Indique. Ganhe. Cresça.</h2>
          <p className="mt-2 text-sm font-bold text-white uppercase tracking-wider">Aumente sua renda conectando amigos à elite tecnológica.</p>
        </div>
      </div>

      {/* Institutional/Explanatory Text */}
      <div className="px-6 py-8 space-y-6">
        <p className="text-sm text-muted leading-relaxed text-justify">
          Na <span className="text-primary font-bold italic">Nexus Tech</span>, acreditamos que o crescimento deve ser compartilhado. Ao indicar novos membros para nossa plataforma, você não apenas fortalece nossa comunidade, mas também é recompensado por isso através de um sistema de comissões exclusivo.
        </p>
        <p className="text-sm text-muted leading-relaxed text-justify">
          Nosso programa de afiliados opera em múltiplos níveis, permitindo que você ganhe sobre as atividades das suas indicações diretas e indiretas. É a sua oportunidade de escalar seus ganhos de forma exponencial enquanto ajuda seus amigos a acessarem o melhor do hardware gamer.
        </p>
      </div>

      {/* Referral Content */}
      <div className="px-4 space-y-4">
        {/* Commission Levels Card */}
        <div className="rounded-2xl bg-surface border border-border p-5 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-black uppercase italic text-primary tracking-widest">Níveis de Comissão</h3>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {[
              { level: "1º Nível", rate: "20% / 8%", color: "primary" },
              { level: "2º Nível", rate: "2%", color: "white" },
              { level: "3º Nível", rate: "1%", color: "white" },
            ].map((lvl, i) => (
              <div key={i} className="flex flex-col items-center justify-center rounded-xl bg-background/50 border border-border/50 py-3">
                <span className="text-[9px] font-bold text-muted uppercase mb-1">{lvl.level}</span>
                <span className={`text-xl font-black italic ${lvl.color === 'primary' ? 'text-primary' : 'text-white'}`}>{lvl.rate}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Invite Code & Link */}
        <div className="space-y-3">
          {/* Code */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div className="w-full bg-surface border border-border rounded-xl px-12 py-4 flex items-center justify-between">
              <div>
                <div className="text-[8px] font-black text-muted uppercase tracking-widest">Seu Código</div>
                <div className="text-base font-black text-foreground">{referralCode}</div>
              </div>
              <button 
                onClick={() => handleCopy(referralCode)}
                className="h-10 w-10 flex items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary transition-colors active:scale-95"
              >
                {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Link */}
          <div className="relative group">
            <div className="w-full bg-surface border border-border rounded-xl p-4 flex items-center justify-between">
              <div className="flex-1 mr-4 overflow-hidden">
                <div className="text-[8px] font-black text-muted uppercase tracking-widest">Link de Convite</div>
                <div className="text-[10px] font-medium text-muted truncate">{referralLink}</div>
              </div>
              <button 
                onClick={() => handleCopy(referralLink)}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-black text-black transition-transform active:scale-95"
              >
                <Share2 className="h-4 w-4" />
                CONVIDAR
              </button>
            </div>
          </div>
        </div>

        {/* Benefits List */}
        <div className="rounded-2xl bg-surface border border-border p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-black uppercase italic text-primary tracking-widest">Por que indicar?</h3>
          </div>
          
          <div className="space-y-3">
            {[
              "Comissão creditada instantaneamente",
              "Ganhos recorrentes sobre atividades",
              "Sem limite de indicações por usuário",
              "Suporte prioritário para grandes afiliados"
            ].map((benefit, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-[11px] text-muted font-medium">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Manifesto */}
      <div className="mt-12 px-8 text-center">
        <div className="h-px w-12 bg-primary/30 mx-auto mb-6" />
        <h4 className="text-[10px] font-black italic text-primary uppercase tracking-[0.3em] mb-2">Manifesto Nexus</h4>
        <p className="text-[11px] text-muted italic font-medium leading-relaxed">
          "Conectando pessoas ao futuro. Nexus Tech: Onde sua rede se transforma em poder."
        </p>
      </div>
    </div>
  );
}
