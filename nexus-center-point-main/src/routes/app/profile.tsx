import * as React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { 
  ChevronRight, 
  Wallet, 
  ArrowUpCircle, 
  Gift, 
  History, 
  ShieldCheck, 
  Headphones, 
  Settings, 
  LogOut,
  Copy,
  CheckCircle2,
  TrendingUp,
  UserPlus,
  Pencil
} from 'lucide-react';
import { toast } from 'sonner';
import { ProfitEvolutionModal } from '@/components/modals/ProfitEvolutionModal';



export const Route = createFileRoute('/app/profile')({
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const [isProfitModalOpen, setIsProfitModalOpen] = React.useState(false);

  
  const handleLogout = () => {
    toast.info("Saindo...");
    setTimeout(() => {
      navigate({ to: "/" });
    }, 500);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const MENU_ITEMS = [
    { icon: Wallet, label: "Registro de recargas", desc: "Veja todo o histórico de recargas realizadas", color: "text-primary", to: "/app/recharge-history" },
    { icon: ArrowUpCircle, label: "Registro de saques", desc: "Acompanhe seus saques e solicitações", color: "text-primary", to: "/app/withdraw-history" },
    { icon: Gift, label: "Resgatar código bônus", desc: "Digite seu código bônus e ganhe recompensas", color: "text-primary", to: "/app/bonus" },
    { icon: History, label: "Histórico completo", desc: "Consulte todas as movimentações da conta", color: "text-primary", to: "/app/history" },
    { icon: ShieldCheck, label: "Segurança da conta", desc: "Senha, autenticação e segurança", color: "text-primary", to: "/app/security" },
    { icon: Headphones, label: "Atendimento ao cliente", desc: "Fale com nossa equipe de suporte", color: "text-primary", to: "/app/support" },

  ];

  return (
    <div className="pb-28 pt-4 space-y-6">
      {/* Profile Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-surface p-6 border border-border">
        <div className="absolute top-0 right-0 p-4 opacity-10">
           <img 
            src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop" 
            alt="Nexus Logo" 
            className="h-20 w-20 object-contain grayscale"
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-primary/50 p-1">
              <img 
                src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1974&auto=format&fit=crop" 
                alt="Profile" 
                className="h-full w-full rounded-full object-cover"
              />
            </div>
            <button className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-background border border-border text-primary shadow-lg active:scale-95 transition-transform">
              <Pencil className="h-3 w-3" />
            </button>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <h2 className="text-xl font-black tracking-tight">Lucas Martins</h2>
              <CheckCircle2 className="h-4 w-4 fill-primary text-black" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 group cursor-pointer" onClick={() => copyToClipboard("(89) 9****-8523", "Telefone")}>
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">(89) 9****-8523</span>
                <Copy className="h-3 w-3 text-muted group-hover:text-primary transition-colors" />
              </div>
              <div className="flex items-center gap-2 group cursor-pointer" onClick={() => copyToClipboard("48A7B9", "Código")}>
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Código: 48A7B9</span>
                <Copy className="h-3 w-3 text-muted group-hover:text-primary transition-colors" />
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Balance Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-surface border border-border p-4 space-y-3 group cursor-pointer hover:border-primary/30 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Saldo da Conta</span>
            <div className="h-8 w-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-lg font-black text-primary italic leading-none">R$ 1.250,00</span>
              <ChevronRight className="h-4 w-4 text-muted group-hover:text-primary transition-colors" />
            </div>
            <p className="text-[8px] text-muted font-medium">Disponível para saque e compras</p>
          </div>
        </div>

        <div 
          onClick={() => setIsProfitModalOpen(true)}
          className="rounded-2xl bg-surface border border-border p-4 space-y-3 group cursor-pointer hover:border-primary/30 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Lucro Acumulado</span>
            <div className="h-8 w-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-lg font-black text-primary italic leading-none">R$ 750,00</span>
              <ChevronRight className="h-4 w-4 text-muted group-hover:text-primary transition-colors" />
            </div>
            <p className="text-[8px] text-muted font-medium">Total de ganhos obtidos</p>
          </div>
        </div>
      </div>

      {/* Menu List */}
      <div className="rounded-2xl bg-surface border border-border divide-y divide-border/50">
        {MENU_ITEMS.map((item, i) => (
          <button 
            key={i}
            onClick={() => item.to ? navigate({ to: item.to }) : toast.info(`Ação: ${item.label}`)}
            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors group text-left"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-background border border-border flex items-center justify-center text-primary group-hover:border-primary/50 transition-colors">
                <item.icon className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-black uppercase tracking-tight group-hover:text-primary transition-colors">
                  {item.label}
                </h4>
                <p className="text-[9px] text-muted font-medium">{item.desc}</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted group-hover:text-primary transition-colors" />
          </button>
        ))}
      </div>

      {/* Referral Banner Small */}
      <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 flex items-center justify-between group hover:bg-primary/10 transition-colors cursor-pointer">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 relative">
             <img 
              src="https://images.unsplash.com/photo-1634128221889-82ed6efebfc3?q=80&w=1000&auto=format&fit=crop" 
              alt="Gift" 
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-tight">Convide amigos e ganhe mais!</h4>
            <p className="text-[9px] text-muted">Quanto mais sua equipe cresce, maior é o seu ganho.</p>
          </div>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg bg-surface border border-border px-3 py-1.5 text-[9px] font-black group-hover:bg-primary group-hover:text-black group-hover:border-primary transition-all">
          <UserPlus className="h-3 w-3" />
          CONVIDAR AGORA
        </button>
      </div>

      {/* Logout Button */}
      <button 
        onClick={handleLogout}
        className="w-full flex flex-col items-center justify-center gap-1 py-4 group"
      >
        <div className="flex items-center gap-2 text-red-500 font-black text-xs uppercase tracking-widest group-hover:scale-105 transition-transform">
          <LogOut className="h-4 w-4" />
          Sair da conta
        </div>
        <span className="text-[9px] text-muted font-medium uppercase tracking-tighter">Você será desconectado do aplicativo</span>
      </button>
      {/* Profit Evolution Modal */}
      <ProfitEvolutionModal 
        isOpen={isProfitModalOpen} 
        onOpenChange={setIsProfitModalOpen} 
        currentProfit="750,00"
      />
    </div>
  );
}
