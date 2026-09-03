import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ChevronRight, Headphones, LogOut, ShieldCheck, Ticket, UserRound, Wallet } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { brl, loadAccount, type Account } from "@/lib/store";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil — 3rd Cap" },
      { name: "description", content: "Seus dados, saldo, lucro acumulado e configurações da conta 3rd Cap." },
      { property: "og:title", content: "Perfil — 3rd Cap" },
      { property: "og:description", content: "Seus dados, saldo, lucro acumulado e configurações da conta 3rd Cap." },
    ],
  }),
  component: () => (
    <AppShell>
      <PerfilContent />
    </AppShell>
  ),
});

function PerfilContent() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    if (user) setAccount(loadAccount(user.phone));
  }, [user]);

  const itens = [
    { label: "Registro de recargas", icon: Wallet },
    { label: "Registro de saques", icon: Ticket },
    { label: "Segurança da conta", icon: ShieldCheck },
    { label: "Atendimento ao cliente", icon: Headphones },
  ];

  return (
    <div>
      <div className="bg-primary px-5 pb-10 pt-8 text-primary-foreground">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-foreground/20">
            <UserRound className="h-8 w-8" />
          </span>
          <div>
            <p className="text-lg font-bold">{user?.name}</p>
            <p className="text-sm opacity-90">{user?.phone}</p>
            <p className="text-sm opacity-90">Código: {user?.code}</p>
          </div>
        </div>
      </div>

      <div className="-mt-6 grid grid-cols-2 gap-3 px-3">
        <div className="rounded-lg bg-card p-4 shadow-[var(--shadow-card)]">
          <p className="text-lg font-bold text-foreground">{brl(account?.balance ?? 0)}</p>
          <p className="mt-1 text-sm text-muted-foreground">Saldo da Conta</p>
        </div>
        <div className="rounded-lg bg-card p-4 shadow-[var(--shadow-card)]">
          <p className="text-lg font-bold text-foreground">{brl(account?.profit ?? 0)}</p>
          <p className="mt-1 text-sm text-muted-foreground">Lucro Acumulado</p>
        </div>
      </div>

      <div className="mt-4 divide-y divide-border bg-card">
        {itens.map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => toast("Disponível em breve.")}
            className="flex w-full items-center gap-3 px-5 py-4 text-left"
          >
            <Icon className="h-5 w-5 text-primary" />
            <span className="flex-1 text-sm text-foreground">{label}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      <div className="p-5">
        <button
          onClick={() => {
            logout();
            navigate({ to: "/", replace: true });
          }}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground"
        >
          <LogOut className="h-4 w-4" /> Sair da conta
        </button>
      </div>
    </div>
  );
}
