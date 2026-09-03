import * as React from 'react';
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { WelcomeModal } from "@/components/modals/WelcomeModal";
import { DailyRouletteModal } from "@/components/modals/DailyRouletteModal";
import { OnboardingModal } from "@/components/modals/OnboardingModal";
import { InstallAppModal } from "@/components/modals/InstallAppModal";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, CreditCard, UserCheck, TrendingUp, Zap, Wallet, Headset, Download, Calendar, Users, Gift, Info, LogOut, Target, ClipboardCheck } from "lucide-react";

export const Route = createFileRoute("/app/")({
  component: Index,
});

const BANNER_IMAGES = [
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=2070",
  "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&q=80&w=2070",
  "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&q=80&w=2070",
  "https://images.unsplash.com/photo-1603481588273-2f908a9a7a1b?auto=format&fit=crop&q=80&w=2070"
];

const ACTIVITY_FEED = [
  { name: "João S.", action: "acabou de adquirir Teclado Gamer Pro X", icon: <ShoppingBag size={12} className="text-primary" /> },
  { name: "Maria O.", action: "realizou um saque de R$ 250,00", icon: <CreditCard size={12} className="text-primary" /> },
  { name: "Pedro L.", action: "está online agora", icon: <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> },
  { name: "Lucas M.", action: "acabou de adquirir Mouse Gamer Pro X", icon: <ShoppingBag size={12} className="text-primary" /> },
  { name: "Ana P.", action: "recebeu bônus de indicação R$ 50,00", icon: <TrendingUp size={12} className="text-primary" /> },
  { name: "Rafael K.", action: "realizou um saque de R$ 1.200,00", icon: <CreditCard size={12} className="text-primary" /> },
];

function Index() {
  const navigate = useNavigate();
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = React.useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = React.useState(false);
  const [isRouletteOpen, setIsRouletteOpen] = React.useState(false);
  const [isAlreadySpun, setIsAlreadySpun] = React.useState(false);
  const [currentBanner, setCurrentBanner] = React.useState(0);
  const [activityIndex, setActivityIndex] = React.useState(0);
  const [isInstallModalOpen, setIsInstallModalOpen] = React.useState(false);
  const { canInstall, isIOS, isInstalled, promptInstall } = usePwaInstall();

  React.useEffect(() => {
    const bannerInterval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % BANNER_IMAGES.length);
    }, 5000);

    const activityInterval = setInterval(() => {
      setActivityIndex((prev) => (prev + 1) % ACTIVITY_FEED.length);
    }, 4000);

    return () => {
      clearInterval(bannerInterval);
      clearInterval(activityInterval);
    };
  }, []);

  React.useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem('has_seen_onboarding');
    
    if (!hasSeenOnboarding) {
      setIsOnboardingOpen(true);
    } else {
      // Only show welcome modal if onboarding wasn't shown
      setIsWelcomeModalOpen(true);
    }
    
    // Check if already spun today (mock logic using localStorage)
    const lastSpin = localStorage.getItem('last_spin_date');
    const today = new Date().toDateString();
    if (lastSpin === today) {
      setIsAlreadySpun(true);
    }
  }, []);

  const handleCloseOnboarding = () => {
    localStorage.setItem('has_seen_onboarding', 'true');
    setIsOnboardingOpen(false);
    // Show welcome modal after onboarding
    setIsWelcomeModalOpen(true);
  };

  const handleSpinComplete = (amount: number) => {
    localStorage.setItem('last_spin_date', new Date().toDateString());
    setIsAlreadySpun(true);
    toast.success(`Prêmio de R$ ${amount.toFixed(2)} adicionado ao seu saldo!`);
  };

  const handleAction = (label: string) => {
    if (label === "Sair do aplicativo") {
      toast.info("Saindo...");
      setTimeout(() => {
        navigate({ to: "/" });
      }, 500);
      return;
    }
    if (label === "Recarga Online") {
      navigate({ to: "/app/recharge" });
      return;
    }
    if (label === "Sacar Dinheiro") {
      navigate({ to: "/app/withdraw" });
      return;
    }
    if (label === "Sobre Nós") {
      navigate({ to: "/app/about" });
      return;
    }
    if (label === "Indique e Ganhe") {
      navigate({ to: "/app/referral" });
      return;
    }
    if (label === "Roleta Diária") {
      setIsRouletteOpen(true);
      return;
    }
    if (label === "Missões") {
      navigate({ to: "/app/missions" });
      return;
    }
    if (label === "Baixar Aplicativo") {
      if (isInstalled) {
        toast.success("O aplicativo já está instalado no seu dispositivo.");
        return;
      }
      if (canInstall) {
        promptInstall().then((outcome) => {
          if (outcome === "accepted") toast.success("Instalando o aplicativo...");
        });
        return;
      }
      setIsInstallModalOpen(true);
      return;
    }
    toast.info(`Ação: ${label}`);
  };

  return (
    <div className="space-y-6 pt-4">
      {/* Banner Section */}
      <div className="relative overflow-hidden rounded-2xl bg-surface border border-border group h-48 bg-[#0D1117]">
        {/* Background Carousel */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentBanner}
              src={BANNER_IMAGES[currentBanner]}
              alt="Banner Image"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 0.5, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="h-full w-full object-cover"
            />
          </AnimatePresence>
          {/* Overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent z-[1]" />
        </div>

        {/* Fixed Content */}
        <div className="relative z-10 p-6 h-full flex flex-col justify-center max-w-[65%] space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Tecnologia que</span>
          <h1 className="text-2xl font-black leading-tight">
            IMPULSIONA <br />
            <span className="text-primary italic">SEU MUNDO.</span>
          </h1>
          <p className="text-xs text-muted leading-relaxed line-clamp-2">
            Os melhores produtos com a segurança e qualidade que você merece.
          </p>
          <button className="mt-2 w-fit flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-black transition-transform active:scale-95">
            VER COLEÇÃO 
            <span className="text-lg leading-none">›</span>
          </button>
        </div>
        
        {/* Indicators */}
        <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-1.5">
          {BANNER_IMAGES.map((_, i) => (
            <div 
              key={i} 
              className={`h-1 rounded-full transition-all duration-500 ${i === currentBanner ? 'w-4 bg-primary' : 'w-2 bg-muted/30'}`} 
            />
          ))}
        </div>
      </div>

      {/* Activity Feed (Ticker) */}
      <div className="relative overflow-hidden rounded-xl bg-surface/30 border border-border h-10 px-4 flex items-center">
        <div className="flex items-center gap-2 mr-3 border-r border-border pr-3 flex-shrink-0">
          <div className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-tighter text-primary italic">LIVE</span>
        </div>
        <div className="flex-1 relative overflow-hidden h-full flex items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activityIndex}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-2 w-full"
            >
              <div className="flex-shrink-0 bg-primary/10 p-1 rounded-md">
                {ACTIVITY_FEED[activityIndex]?.icon}
              </div>
              <p className="text-[10px] text-muted truncate">
                <span className="font-bold text-foreground">{ACTIVITY_FEED[activityIndex]?.name}</span> {ACTIVITY_FEED[activityIndex]?.action}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Quick Links Grid */}
      <div className="grid grid-cols-5 gap-y-6">
        {[
          { icon: <Zap size={20} className="text-primary" />, label: "Recarga Online" },
          { icon: <Wallet size={20} className="text-primary" />, label: "Sacar Dinheiro" },
          { icon: <Headset size={20} className="text-primary" />, label: "Atendimento ao Cliente" },
          { icon: <Download size={20} className="text-primary" />, label: "Baixar Aplicativo" },
          { icon: <Target size={20} className={isAlreadySpun ? "text-muted/40" : "text-primary"} />, label: "Roleta Diária", isRedeemed: isAlreadySpun },
          { icon: <Users size={20} className="text-primary" />, label: "Junte-se a nós" },
          { icon: <Gift size={20} className="text-primary" />, label: "Indique e Ganhe" },
          { icon: <Info size={20} className="text-primary" />, label: "Sobre Nós" },
          { icon: <ClipboardCheck size={20} className="text-primary" />, label: "Missões" },
          { icon: <LogOut size={20} className="text-primary" />, label: "Sair do aplicativo" },
        ].map((item: any, i) => (
          <div key={i} onClick={() => handleAction(item.label)} className={`flex flex-col items-center gap-2 text-center cursor-pointer group ${item.isRedeemed ? 'opacity-60' : ''}`}>
            <div className={`relative flex h-10 w-10 items-center justify-center rounded-xl bg-surface border border-border transition-colors ${item.isRedeemed ? 'border-border' : 'group-hover:border-primary group-hover:bg-primary/5'}`}>
              {item.icon}
              {item.isRedeemed && (
                <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-surface border border-border shadow-sm">
                  <UserCheck size={8} className="text-primary" />
                </div>
              )}
            </div>
            <span className={`text-[9px] font-medium leading-tight text-muted transition-colors ${item.isRedeemed ? '' : 'group-hover:text-foreground'}`}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Featured Products */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black tracking-widest uppercase">Nossos Produtos</h2>
          <button className="text-[10px] font-bold text-muted hover:text-primary transition-colors flex items-center gap-1">
            VER TODOS <span>›</span>
          </button>
        </div>

        <div className="space-y-3">
          {[
            {
              name: "Teclado Mecânico Gamer",
              desc: "Desempenho incomparável e máxima precisão em cada tecla.",
              price: "499,90",
              daily: "25,00",
              total: "750,00",
              validity: "30 DIAS",
              img: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?q=80&w=2070&auto=format&fit=crop"
            },
            {
              name: "Mouse Gamer Pro X",
              desc: "Precisão extrema para você dominar todas as partidas.",
              price: "299,90",
              daily: "15,00",
              total: "450,00",
              validity: "30 DIAS",
              img: "https://images.unsplash.com/photo-1527443224154-c4a3942d3a70?q=80&w=2070&auto=format&fit=crop"
            }
          ].map((product, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl bg-surface p-3 border border-border group hover:border-primary/50 transition-colors">
              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-background">
                <img src={product.img} alt={product.name} className="h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold leading-none">{product.name}</h3>
                  <span className="rounded bg-primary/10 px-1 py-0.5 text-[8px] font-bold text-primary border border-primary/20">EM ESTOQUE</span>
                </div>
                <p className="text-[9px] text-muted line-clamp-2">{product.desc}</p>
                <div className="text-sm font-black text-primary italic leading-none">R$ {product.price}</div>
                <div className="flex gap-4 pt-1">
                  <div className="flex flex-col">
                    <span className="text-[8px] text-muted-foreground uppercase font-bold">Renda diária</span>
                    <span className="text-[10px] font-bold text-foreground">R$ {product.daily}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] text-muted-foreground uppercase font-bold">Renda total</span>
                    <span className="text-[10px] font-bold text-foreground">R$ {product.total}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2 border-l border-border pl-4">
                <div className="text-center">
                  <div className="text-[8px] text-muted font-bold uppercase">Validade</div>
                  <div className="text-[10px] font-black">{product.validity}</div>
                </div>
                <button className="rounded-lg bg-primary px-3 py-1.5 text-[10px] font-black text-black transition-transform active:scale-95">
                  ADQUIRIR
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <OnboardingModal 
        isOpen={isOnboardingOpen} 
        onClose={handleCloseOnboarding} 
      />

      <WelcomeModal 
        isOpen={isWelcomeModalOpen} 
        onClose={() => setIsWelcomeModalOpen(false)} 
      />

      <DailyRouletteModal
        isOpen={isRouletteOpen}
        onClose={() => setIsRouletteOpen(false)}
        onSpinComplete={handleSpinComplete}
        isAlreadySpun={isAlreadySpun}
      />
    </div>
  );
}
