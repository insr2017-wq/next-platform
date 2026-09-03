import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { brl, loadAccount, type Account } from "@/lib/store";
import bannerHero from "@/assets/banner-hero.jpg";
import rider from "@/assets/rider-cutout.png";

export const Route = createFileRoute("/equipe")({
  head: () => ({
    meta: [
      { title: "Minha Equipe — 3rd Cap" },
      { name: "description", content: "Convide amigos, acompanhe níveis LV1 a LV3 e os bônus de depósito da sua equipe." },
      { property: "og:title", content: "Minha Equipe — 3rd Cap" },
      { property: "og:description", content: "Convide amigos, acompanhe níveis LV1 a LV3 e os bônus de depósito da sua equipe." },
    ],
  }),
  component: () => (
    <AppShell>
      <EquipeContent />
    </AppShell>
  ),
});

const niveis = [
  { nome: "LV1", retorno: "20%", pessoas: 47, deposito: 690.25 },
  { nome: "LV2", retorno: "2%", pessoas: 37, deposito: 690.0 },
  { nome: "LV3", retorno: "1%", pessoas: 65, deposito: 380.0 },
];

function EquipeContent() {
  const { user } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    if (user) setAccount(loadAccount(user.phone));
  }, [user]);

  const link = `https://nx-tc.online/register?invite=${user?.code ?? ""}`;

  const copiar = async (valor: string, label: string) => {
    try {
      await navigator.clipboard.writeText(valor);
      toast.success(`${label} copiado!`);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  return (
    <div>
      <img src={bannerHero} alt="Equipe de motociclistas" width={1200} height={600} className="h-24 w-full object-cover" />

      <div className="grid grid-cols-3 gap-2 bg-secondary px-3 py-6 text-center">
        {niveis.map((n) => (
          <div key={n.nome}>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-card">
              <span className="text-lg font-bold text-primary">{n.nome}</span>
            </div>
            <p className="mt-3 text-sm font-bold text-foreground">Retorno{n.retorno}</p>
            <p className="mt-1 text-sm text-foreground">Pessoas Totais {n.pessoas}</p>
            <p className="mt-1 text-sm text-foreground">Depósito {brl(n.deposito)}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 bg-card px-4 py-6">
        <img src={rider} alt="Motociclista" loading="lazy" width={512} height={600} className="h-28 w-20 shrink-0 object-contain" />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-foreground">Compartilhar com um clique</h2>
          <p className="mt-1 text-sm text-muted-foreground">Compartilhe o código de convite ou site para convidar amigos</p>

          <div className="mt-3 flex items-center gap-2">
            <div className="min-w-0 flex-1 truncate rounded-full border border-primary px-4 py-2 text-sm">
              Código de convite: <span className="font-bold">{user?.code}</span>
            </div>
            <button onClick={() => copiar(user?.code ?? "", "Código")} className="shrink-0 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
              Copy
            </button>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <div className="min-w-0 flex-1 truncate rounded-full border border-primary px-4 py-2 text-sm">Link de convite: {link}</div>
            <button onClick={() => copiar(link, "Link")} className="shrink-0 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
              Copy
            </button>
          </div>
        </div>
      </div>

      <div className="relative mt-2 overflow-hidden bg-primary px-5 py-6 text-primary-foreground">
        <p className="text-2xl font-bold">149</p>
        <p className="mt-1">O número de pessoas</p>
        <p className="mt-4 text-2xl font-bold">{brl(account?.invested ?? 0)}</p>
        <p className="mt-1">Meu Investimento Total</p>
        <img src={rider} alt="" aria-hidden="true" loading="lazy" width={512} height={600} className="absolute bottom-0 right-2 h-40 object-contain opacity-90" />
      </div>

      <div className="mt-2 bg-card px-5 py-6">
        <h3 className="border-l-4 border-foreground pl-3 text-lg font-bold text-foreground">Bônus de convite</h3>
        <p className="mt-4 text-sm text-foreground">
          Você convida o amigo A para se inscrever na pilha de envio. "A" é seu membro de primeiro nível. Você receberá 20% de bônus do depósito do seu subordinado.
        </p>
        <p className="mt-4 text-sm text-foreground">
          A convida o amigo B para se inscrever na pilha de envio, e B é seu membro de segundo nível. Você receberá 2% de bônus do depósito do seu subordinado.
        </p>
        <p className="mt-4 text-sm text-foreground">
          B convida o amigo C, que é seu membro de terceiro nível. Você receberá 1% de bônus do depósito do seu subordinado.
        </p>
      </div>
    </div>
  );
}
