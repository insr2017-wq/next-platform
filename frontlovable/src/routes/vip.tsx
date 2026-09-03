import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { brl, loadAccount, saveAccount, type Account, type Order } from "@/lib/store";
import bannerProdutos from "@/assets/banner-produtos.jpg";
import n004 from "@/assets/helmet-n004.png";
import n005 from "@/assets/helmet-n005.png";

export const Route = createFileRoute("/vip")({
  head: () => ({
    meta: [
      { title: "Os Produtos — 3rd Cap" },
      { name: "description", content: "Catálogo de capacetes com renda diária e acompanhamento dos seus pedidos ativos." },
      { property: "og:title", content: "Os Produtos — 3rd Cap" },
      { property: "og:description", content: "Catálogo de capacetes com renda diária e acompanhamento dos seus pedidos ativos." },
    ],
  }),
  component: () => (
    <AppShell>
      <ProdutosContent />
    </AppShell>
  ),
});

const imgs = { n004, n005 } as const;

const catalogo = [
  { code: "N004", price: 100, daily: 10, total: 300, image: "n004" as const },
  { code: "N005", price: 300, daily: 36, total: 1080, image: "n005" as const },
  { code: "N006", price: 500, daily: 65, total: 1950, image: "n004" as const },
];

function ProdutosContent() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"produtos" | "pedidos">("produtos");
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    if (user) setAccount(loadAccount(user.phone));
  }, [user]);

  const comprar = (item: (typeof catalogo)[number]) => {
    if (!user || !account) return;
    if (account.balance < item.price) return toast.error("Saldo insuficiente. Faça uma recarga.");
    const validade = new Date(Date.now() + 30 * 864e5).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const order: Order = { id: crypto.randomUUID(), ...item, validade };
    const next: Account = {
      ...account,
      balance: account.balance - item.price,
      invested: account.invested + item.price,
      orders: [order, ...account.orders],
    };
    setAccount(next);
    saveAccount(user.phone, next);
    toast.success(`${item.code} comprado com sucesso!`);
    setTab("pedidos");
  };

  return (
    <div>
      <div className="relative">
        <img src={bannerProdutos} alt="Motociclista segurando capacete" width={1200} height={512} className="h-40 w-full object-cover" />
        <h1 className="absolute inset-x-0 top-5 text-center text-lg font-bold text-primary-foreground">Os Produtos</h1>
        <p className="absolute bottom-6 right-4 text-sm text-primary-foreground">Equipamento ordinário</p>
      </div>

      <div className="p-3">
        <div className="grid grid-cols-2 overflow-hidden rounded-md">
          <button
            onClick={() => setTab("produtos")}
            className={tab === "produtos" ? "bg-primary py-3 text-sm font-semibold text-primary-foreground" : "bg-secondary py-3 text-sm font-semibold text-muted-foreground"}
          >
            Produtos
          </button>
          <button
            onClick={() => setTab("pedidos")}
            className={tab === "pedidos" ? "bg-primary py-3 text-sm font-semibold text-primary-foreground" : "bg-secondary py-3 text-sm font-semibold text-muted-foreground"}
          >
            Meus Pedidos
          </button>
        </div>

        <div className="mt-3 divide-y divide-border rounded-md bg-card">
          {tab === "produtos"
            ? catalogo.map((item) => (
                <Row
                  key={item.code}
                  item={item}
                  validade="30 dias após a compra"
                  action={
                    <button onClick={() => comprar(item)} className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground">
                      Comprar
                    </button>
                  }
                />
              ))
            : (account?.orders ?? []).map((o) => (
                <Row
                  key={o.id}
                  item={o}
                  validade={o.validade}
                  action={<span className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground">Ativo</span>}
                />
              ))}
          {tab === "pedidos" && (account?.orders.length ?? 0) === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">Você ainda não possui pedidos.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({
  item,
  validade,
  action,
}: {
  item: { code: string; price: number; daily: number; total: number; image: "n004" | "n005" };
  validade: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 p-4">
      <img src={imgs[item.image]} alt={`Capacete ${item.code}`} loading="lazy" width={600} height={600} className="h-20 w-20 shrink-0 object-contain" />
      <div className="min-w-0 flex-1">
        <p className="font-bold text-foreground">{item.code}</p>
        <p className="text-sm text-foreground">
          Preço: <span className="font-semibold text-primary">{brl(item.price)}</span>
        </p>
        <p className="text-sm text-foreground">
          Período de validade: <span className="font-semibold text-primary">{validade}</span>
        </p>
        <p className="text-sm text-foreground">
          Renda diária: <span className="font-semibold text-primary">{brl(item.daily)}</span>
        </p>
        <p className="text-sm text-foreground">
          Renda total: <span className="font-semibold text-primary">{brl(item.total)}</span>
        </p>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}
