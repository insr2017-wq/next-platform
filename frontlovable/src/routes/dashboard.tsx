import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDownToLine,
  Bell,
  CalendarClock,
  CircleDollarSign,
  Headphones,
  LogOut,
  Send,
  Wallet,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { brl, loadAccount, saveAccount, type Account } from "@/lib/store";
import bannerHero from "@/assets/banner-hero.jpg";
import helmetRoad from "@/assets/helmet-road.jpg";
import bannerProdutos from "@/assets/banner-produtos.jpg";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Início — 3rd Cap" },
      { name: "description", content: "Painel com saldo da conta, lucro acumulado, check-in diário e recargas." },
      { property: "og:title", content: "Início — 3rd Cap" },
      { property: "og:description", content: "Painel com saldo da conta, lucro acumulado, check-in diário e recargas." },
    ],
  }),
  component: DashboardPage,
});

const slides = [bannerHero, bannerProdutos, helmetRoad];

function DashboardPage() {
  return (
    <AppShell>
      <DashboardContent />
    </AppShell>
  );
}

function DashboardContent() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [slide, setSlide] = useState(1);
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    if (user) setAccount(loadAccount(user.phone));
  }, [user]);

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % slides.length), 4000);
    return () => clearInterval(t);
  }, []);

  const update = (next: Account) => {
    if (!user) return;
    setAccount(next);
    saveAccount(user.phone, next);
  };

  const actions = [
    {
      label: "Recarga Online",
      icon: CircleDollarSign,
      onClick: () => {
        if (!account) return;
        update({ ...account, balance: account.balance + 50 });
        toast.success("Recarga de R$50,00 realizada com sucesso!");
      },
    },
    {
      label: "Sacar Dinheiro",
      icon: Wallet,
      onClick: () => {
        if (!account) return;
        if (account.balance < 50) return toast.error("Saldo insuficiente para saque (mínimo R$50,00).");
        update({ ...account, balance: account.balance - 50 });
        toast.success("Saque de R$50,00 solicitado. Aguarde a aprovação.");
      },
    },
    { label: "Atendimento ao Cliente", icon: Headphones, onClick: () => toast("Atendimento disponível das 09h às 21h.") },
    { label: "Baixar Aplicativo", icon: ArrowDownToLine, onClick: () => toast("O download do aplicativo começará em breve.") },
    {
      label: "Check-in Diário",
      icon: CalendarClock,
      onClick: () => {
        if (!account) return;
        const hoje = new Date().toDateString();
        if (account.lastCheckin === hoje) return toast.error("Você já fez o check-in de hoje.");
        update({ ...account, balance: account.balance + 2, lastCheckin: hoje });
        toast.success("Check-in feito! +R$2,00 de bônus.");
      },
    },
    { label: "Junte-se a nós", icon: Send, onClick: () => toast("Entre no nosso canal oficial do Telegram!") },
    {
      label: "Sair do aplicativo",
      icon: LogOut,
      onClick: () => {
        logout();
        navigate({ to: "/", replace: true });
      },
    },
  ];

  return (
    <div>
      <div className="relative">
        <img src={slides[slide]} alt="Destaque 3rd Cap" width={1200} height={600} className="h-44 w-full object-cover" />
      </div>
      <div className="flex justify-center gap-2 bg-secondary py-3">
        {slides.map((_, i) => (
          <button
            key={i}
            aria-label={`Ir para o banner ${i + 1}`}
            onClick={() => setSlide(i)}
            className={i === slide ? "h-2 w-2 rounded-full bg-foreground" : "h-2 w-2 rounded-full bg-border"}
          />
        ))}
      </div>

      <div className="grid grid-cols-4 gap-y-5 bg-card px-3 py-5">
        {actions.map(({ label, icon: Icon, onClick }) => (
          <button key={label} onClick={onClick} className="flex flex-col items-center gap-2 px-1 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
              <Icon className="h-6 w-6 text-primary" />
            </span>
            <span className="text-xs leading-tight text-foreground">{label}</span>
          </button>
        ))}
      </div>

      <div className="mt-2 flex items-center gap-3 bg-card px-4 py-4">
        <Bell className="h-5 w-5 shrink-0 text-primary" />
        <p className="text-sm text-foreground">Seja bem-vindo, acesse canal oficial no Telegram!</p>
      </div>

      <img src={helmetRoad} alt="Capacete esportivo na estrada" loading="lazy" width={1200} height={900} className="mt-2 w-full object-cover" />

      <div className="grid grid-cols-2 gap-3 p-3">
        <div className="rounded-lg bg-card p-4 shadow-[var(--shadow-card)]">
          <p className="text-lg font-bold text-foreground">{brl(account?.balance ?? 0)}</p>
          <p className="mt-1 text-sm text-muted-foreground">Saldo da Conta</p>
        </div>
        <div className="rounded-lg bg-card p-4 text-right shadow-[var(--shadow-card)]">
          <p className="text-lg font-bold text-foreground">{brl(account?.profit ?? 0)}</p>
          <p className="mt-1 text-sm text-muted-foreground">Lucro Acumulado</p>
        </div>
      </div>
    </div>
  );
}
