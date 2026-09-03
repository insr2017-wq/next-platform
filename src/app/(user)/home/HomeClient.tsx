"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { WelcomeModal } from "@/components/modals/WelcomeModal";
import { DailyRouletteModal } from "@/components/modals/DailyRouletteModal";
import { OnboardingModal } from "@/components/modals/OnboardingModal";
import { InstallAppModal } from "@/components/modals/InstallAppModal";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  CreditCard,
  UserCheck,
  TrendingUp,
  Zap,
  Wallet,
  Headset,
  Download,
  Users,
  Gift,
  Info,
  LogOut,
  Target,
  ClipboardCheck,
  Sparkles,
  Lock,
} from "lucide-react";
import { clearSessionMarker } from "@/components/auth/SessionGate";
import { formatBRL } from "@/lib/format-brl";
import { openExternalLink } from "@/lib/open-external-link";
import type { CatalogProduct } from "@/lib/vip-catalog";

type HomeClientProps = {
  products: CatalogProduct[];
  featuredProducts: CatalogProduct[];
  welcome: {
    enabled: boolean;
    title: string;
    text: string;
    link: string;
  };
  commissions: {
    l1First: number;
    l1Next: number;
    l2: number;
    l3: number;
  };
  links: {
    support: string;
    appDownload: string;
    community: string;
  };
};

const BANNER_IMAGES = [
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=2070",
  "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&q=80&w=2070",
  "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&q=80&w=2070",
  "https://images.unsplash.com/photo-1603481588273-2f908a9a7a1b?auto=format&fit=crop&q=80&w=2070",
];

const ACTIVITY_FEED = [
  { name: "João S.", action: "acabou de adquirir Teclado Gamer Pro X", icon: <ShoppingBag size={12} className="text-primary" /> },
  { name: "Maria O.", action: "realizou um saque de R$ 250,00", icon: <CreditCard size={12} className="text-primary" /> },
  { name: "Pedro L.", action: "está online agora", icon: <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> },
  { name: "Lucas M.", action: "acabou de adquirir Mouse Gamer Pro X", icon: <ShoppingBag size={12} className="text-primary" /> },
  { name: "Ana P.", action: "recebeu bônus de indicação R$ 50,00", icon: <TrendingUp size={12} className="text-primary" /> },
  { name: "Rafael K.", action: "realizou um saque de R$ 1.200,00", icon: <CreditCard size={12} className="text-primary" /> },
];

export function HomeClient({ products, featuredProducts, welcome, commissions, links }: HomeClientProps) {
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = React.useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = React.useState(false);
  const [isRouletteOpen, setIsRouletteOpen] = React.useState(false);
  const [isAlreadySpun, setIsAlreadySpun] = React.useState(false);
  const [extraSpins, setExtraSpins] = React.useState(0);
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
    const hasSeenOnboarding = localStorage.getItem("has_seen_onboarding");
    if (!hasSeenOnboarding) setIsOnboardingOpen(true);
    else if (welcome.enabled) setIsWelcomeModalOpen(true);

    const lastSpin = localStorage.getItem("last_spin_date");
    if (lastSpin === new Date().toDateString()) setIsAlreadySpun(true);
    void fetch("/api/user/missions")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.extraRouletteSpins === "number") {
          setExtraSpins(data.extraRouletteSpins);
        }
      })
      .catch(() => {});
  }, [welcome.enabled]);

  const logout = async () => {
    toast.info("Saindo...");
    clearSessionMarker();
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    window.location.assign("/login");
  };

  const handleCloseOnboarding = () => {
    localStorage.setItem("has_seen_onboarding", "true");
    setIsOnboardingOpen(false);
    setIsWelcomeModalOpen(true);
  };

  const handleAction = (label: string) => {
    if (label === "Sair do aplicativo") {
      void logout();
      return;
    }
    if (label === "Atendimento ao Cliente") {
      openExternalLink(links.support, "Link de atendimento ainda não configurado. Peça ao administrador.");
      return;
    }
    if (label === "Junte-se a nós") {
      openExternalLink(links.community, "Link da comunidade ainda não configurado. Peça ao administrador.");
      return;
    }
    if (label === "Roleta Diária") {
      setIsRouletteOpen(true);
      return;
    }
    if (label === "Baixar Aplicativo") {
      if (isInstalled) {
        toast.success("O aplicativo já está instalado no seu dispositivo.");
        return;
      }
      if (isIOS) {
        setIsInstallModalOpen(true);
        return;
      }
      if (canInstall) {
        void promptInstall().then((outcome) => {
          if (outcome === "accepted") toast.success("Instalando o aplicativo...");
          else if (outcome === "unavailable") setIsInstallModalOpen(true);
        });
        return;
      }
      setIsInstallModalOpen(true);
    }
  };

  const navItems: Array<{
    icon: React.ReactNode;
    label: string;
    href?: string;
    isRedeemed?: boolean;
  }> = [
    { icon: <Zap size={20} className="text-primary" />, label: "Recarga Online", href: "/deposit" },
    { icon: <Wallet size={20} className="text-primary" />, label: "Sacar Dinheiro", href: "/withdraw" },
    { icon: <Headset size={20} className="text-primary" />, label: "Atendimento ao Cliente" },
    { icon: <Download size={20} className="text-primary" />, label: "Baixar Aplicativo" },
    {
      icon: <Target size={20} className={isAlreadySpun ? "text-muted/40" : "text-primary"} />,
      label: "Roleta Diária",
      isRedeemed: isAlreadySpun,
    },
    { icon: <Users size={20} className="text-primary" />, label: "Junte-se a nós" },
    { icon: <Gift size={20} className="text-primary" />, label: "Indique e Ganhe", href: "/referral" },
    { icon: <Info size={20} className="text-primary" />, label: "Sobre Nós", href: "/about" },
    { icon: <ClipboardCheck size={20} className="text-primary" />, label: "Missões", href: "/missions" },
    { icon: <LogOut size={20} className="text-primary" />, label: "Sair do aplicativo" },
  ];

  return (
    <div className="space-y-6 pt-4">
      <div className="group relative h-48 overflow-hidden rounded-2xl border border-border bg-[#0D1117]">
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentBanner}
              src={BANNER_IMAGES[currentBanner]}
              alt="Banner"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 0.5, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="h-full w-full object-cover"
            />
          </AnimatePresence>
          <div className="absolute inset-0 z-1 bg-gradient-to-r from-background via-background/40 to-transparent" />
        </div>
        <div className="relative z-10 flex h-full max-w-[65%] flex-col justify-center space-y-2 p-6">
          <span className="text-[10px] font-bold tracking-widest text-muted uppercase">Tecnologia que</span>
          <h1 className="text-2xl leading-tight font-black">
            IMPULSIONA <br />
            <span className="text-primary italic">SEU MUNDO.</span>
          </h1>
          <Link
            href="/vip"
            className="mt-2 flex w-fit items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-black"
          >
            VER COLEÇÃO <span className="text-lg leading-none">›</span>
          </Link>
        </div>
        <div className="absolute bottom-4 left-0 z-20 flex w-full justify-center gap-1.5">
          {BANNER_IMAGES.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all ${i === currentBanner ? "w-4 bg-primary" : "w-2 bg-muted/30"}`}
            />
          ))}
        </div>
      </div>

      <div className="relative flex h-10 items-center overflow-hidden rounded-xl border border-border bg-surface/30 px-4">
        <div className="mr-3 flex shrink-0 items-center gap-2 border-r border-border pr-3">
          <div className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-black tracking-tighter text-primary uppercase italic">LIVE</span>
        </div>
        <div className="relative flex h-full flex-1 items-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activityIndex}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="flex w-full items-center gap-2"
            >
              <div className="shrink-0 rounded-md bg-primary/10 p-1">{ACTIVITY_FEED[activityIndex]?.icon}</div>
              <p className="truncate text-[10px] text-muted">
                <span className="font-bold text-foreground">{ACTIVITY_FEED[activityIndex]?.name}</span>{" "}
                {ACTIVITY_FEED[activityIndex]?.action}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {featuredProducts.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-primary" />
            <h2 className="text-sm font-black tracking-widest uppercase">Em Destaque</h2>
          </div>
          {featuredProducts.map((product) => (
            <div
              key={product.id}
              className="overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/10 via-surface to-surface"
            >
              <div className="relative aspect-[16/9] w-full bg-background">
                <img
                  src={product.imageUrl || "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?q=80&w=800&auto=format&fit=crop"}
                  alt={product.code}
                  className="h-full w-full object-cover opacity-85"
                />
                <span className="absolute top-2 left-2 rounded bg-primary px-1.5 py-0.5 text-[7px] font-black text-black uppercase">
                  Em Destaque
                </span>
              </div>
              <div className="space-y-3 p-4">
                <h3 className="text-sm font-black uppercase">{product.code}</h3>
                <div className="text-lg font-black text-primary italic">{formatBRL(product.price)}</div>
                <div className="flex gap-6">
                  <div>
                    <p className="text-[8px] font-bold text-muted uppercase">Renda diária</p>
                    <p className="text-[11px] font-black">{formatBRL(product.daily)}/dia</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-muted uppercase">Renda total</p>
                    <p className="text-[11px] font-black">{formatBRL(product.total)}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-muted uppercase">Duração</p>
                    <p className="text-[11px] font-black">{product.cycleDays} dias</p>
                  </div>
                </div>
                {product.locked ? (
                  <button
                    type="button"
                    disabled
                    className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-border/50 bg-muted/50 py-3 text-[10px] font-black text-muted uppercase"
                  >
                    <Lock className="h-3 w-3" />
                    Bloqueado
                  </button>
                ) : (
                  <Link
                    href="/vip"
                    className="flex w-full items-center justify-center rounded-xl bg-primary py-3 text-[10px] font-black text-black uppercase"
                  >
                    ADQUIRIR
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-5 gap-y-6">
        {navItems.map((item) => {
          const className = `group flex cursor-pointer flex-col items-center gap-2 text-center ${item.isRedeemed ? "opacity-60" : ""}`;
          const inner = (
            <>
              <div
                className={`relative flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface ${item.isRedeemed ? "" : "group-hover:border-primary group-hover:bg-primary/5"}`}
              >
                {item.icon}
                {item.isRedeemed ? (
                  <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-border bg-surface">
                    <UserCheck size={8} className="text-primary" />
                  </div>
                ) : null}
              </div>
              <span className="text-[9px] leading-tight font-medium text-muted">{item.label}</span>
            </>
          );
          if (item.href) {
            return (
              <Link key={item.label} href={item.href} className={className}>
                {inner}
              </Link>
            );
          }
          return (
            <button key={item.label} type="button" onClick={() => handleAction(item.label)} className={className}>
              {inner}
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black tracking-widest uppercase">Nossos Produtos</h2>
          <Link
            href="/vip"
            className="flex items-center gap-1 text-[10px] font-bold text-muted hover:text-primary"
          >
            VER TODOS <span>›</span>
          </Link>
        </div>
        <div className="space-y-3">
          {products.length === 0 ? (
            <p className="rounded-xl border border-border bg-surface p-4 text-xs text-muted">Nenhum produto disponível no momento.</p>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className="group flex items-center gap-4 rounded-xl border border-border bg-surface p-3"
              >
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-background">
                  <img
                    src={product.imageUrl || "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?q=80&w=400&auto=format&fit=crop"}
                    alt={product.code}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="text-xs leading-none font-bold">{product.code}</h3>
                  <div className="text-sm font-black text-primary italic">{formatBRL(product.price)}</div>
                  <div className="flex gap-4 pt-1">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-bold text-muted-foreground uppercase">Renda diária</span>
                      <span className="text-[10px] font-bold">{formatBRL(product.daily)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-bold text-muted-foreground uppercase">Renda total</span>
                      <span className="text-[10px] font-bold">{formatBRL(product.total)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2 border-l border-border pl-4">
                  <div className="text-center">
                    <div className="text-[8px] font-bold text-muted uppercase">Validade</div>
                    <div className="text-[10px] font-black">{product.cycleDays} DIAS</div>
                  </div>
                  {product.locked ? (
                    <button
                      type="button"
                      disabled
                      className="flex cursor-not-allowed items-center justify-center gap-1 rounded-lg border border-border/50 bg-muted/50 px-3 py-1.5 text-[10px] font-black text-muted uppercase"
                    >
                      <Lock className="h-3 w-3" />
                      Bloqueado
                    </button>
                  ) : (
                    <Link
                      href="/vip"
                      className="rounded-lg bg-primary px-3 py-1.5 text-[10px] font-black text-black"
                    >
                      ADQUIRIR
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <OnboardingModal isOpen={isOnboardingOpen} onClose={handleCloseOnboarding} />
      <WelcomeModal
        isOpen={isWelcomeModalOpen}
        onClose={() => setIsWelcomeModalOpen(false)}
        title={welcome.title}
        text={welcome.text}
        link={welcome.link}
        commissions={commissions}
      />
      <DailyRouletteModal
        isOpen={isRouletteOpen}
        onClose={() => setIsRouletteOpen(false)}
        isAlreadySpun={isAlreadySpun && extraSpins <= 0}
        onSpinComplete={(result) => {
          localStorage.setItem("last_spin_date", new Date().toDateString());
          setExtraSpins(result.extraRemaining);
          setIsAlreadySpun(result.alreadySpun || result.extraRemaining <= 0);
        }}
      />
      <InstallAppModal open={isInstallModalOpen} onOpenChange={setIsInstallModalOpen} isIOS={isIOS} />
    </div>
  );
}
