"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShoppingCart, Package, Clock, TrendingUp, Calendar, ArrowRight, Gift, Lock, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatBRL } from "@/lib/format-brl";
import type { CatalogProduct, UserOrder } from "@/lib/vip-catalog";
import { cashbackExamples, type CashbackConfig } from "@/lib/cashback";
import { cn } from "@/lib/utils";

const fallbackImg =
  "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?q=80&w=800&auto=format&fit=crop";

export function VipClient({
  catalog,
  orders: initialOrders,
  cashback,
}: {
  catalog: CatalogProduct[];
  orders: UserOrder[];
  cashback: CashbackConfig;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<"available" | "mine">("available");
  const [orders, setOrders] = React.useState(initialOrders);
  const [selected, setSelected] = React.useState<CatalogProduct | null>(null);
  const [selectedMine, setSelectedMine] = React.useState<UserOrder | null>(null);
  const [purchaseOpen, setPurchaseOpen] = React.useState(false);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [cashbackOpen, setCashbackOpen] = React.useState(false);
  const [buying, setBuying] = React.useState(false);

  React.useEffect(() => setOrders(initialOrders), [initialOrders]);
  React.useEffect(() => {
    if (!localStorage.getItem("nexus-cashback-seen")) {
      setCashbackOpen(true);
      localStorage.setItem("nexus-cashback-seen", "true");
    }
  }, []);

  const confirmPurchase = async () => {
    if (!selected) return;
    setBuying(true);
    try {
      const res = await fetch(`/api/user/products/${selected.id}/purchase`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Não foi possível concluir a compra.");
        return;
      }
      const credited = Number(data.cashback) || 0;
      toast.success(
        credited > 0
          ? `Produto adquirido! Cashback de ${formatBRL(credited)} creditado.`
          : "Produto adquirido com sucesso!",
      );
      setPurchaseOpen(false);
      setActiveTab("mine");
      router.refresh();
    } catch {
      toast.error("Erro de conexão.");
    } finally {
      setBuying(false);
    }
  };

  return (
    <div className="space-y-6 pt-4 pb-8">
      <div className="flex rounded-xl border border-border bg-surface p-1">
        {(
          [
            { id: "available", label: "Disponíveis" },
            { id: "mine", label: "Adquiridos" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 rounded-lg py-2 text-[10px] font-black uppercase",
              activeTab === tab.id ? "bg-primary text-black" : "text-muted",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "available" ? (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setCashbackOpen(true)}
            className="flex w-full items-center gap-3 rounded-2xl border border-primary/20 bg-primary/10 p-4 text-left"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20">
              <Gift className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs font-black uppercase tracking-tight">
                Quanto mais você investe, mais você ganha de volta!
              </h3>
              <p className="mt-0.5 text-[9px] font-medium text-muted">Toque para ver exemplos de cashback.</p>
            </div>
            <Info className="h-4 w-4 shrink-0 text-primary" />
          </button>
          {catalog.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted">
              Nenhum produto disponível.
            </p>
          ) : (
            catalog.map((product) => (
              <div key={product.id} className="overflow-hidden rounded-2xl border border-border bg-surface">
                <div className="relative aspect-[16/9] w-full bg-background">
                  <img src={product.imageUrl || fallbackImg} alt={product.code} className="h-full w-full object-cover opacity-80" />
                  <span className="absolute top-2 left-2 rounded bg-primary px-1.5 py-0.5 text-[7px] font-black text-black uppercase">
                    {product.featured ? "Em Destaque" : "Em Estoque"}
                  </span>
                </div>
                <div className="space-y-3 p-4">
                  <h3 className="text-sm font-black uppercase">{product.code}</h3>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[8px] font-bold text-muted uppercase">Investido</p>
                      <p className="text-[11px] font-black text-primary">{formatBRL(product.price)}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-muted uppercase">Retorno</p>
                      <p className="text-[11px] font-black">{formatBRL(product.total)}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-muted uppercase">Ciclo</p>
                      <p className="text-[11px] font-black">{product.cycleDays} dias</p>
                    </div>
                  </div>
                  <p className="text-[10px] font-black text-primary italic">Renda diária: {formatBRL(product.daily)}/dia</p>
                  <p className="text-[10px] font-black">Renda total: {formatBRL(product.total)}</p>
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
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(product);
                        setPurchaseOpen(true);
                      }}
                      className="w-full rounded-xl bg-primary py-3 text-[10px] font-black text-black uppercase"
                    >
                      ADQUIRIR
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="space-y-2 rounded-2xl border border-dashed border-border p-8 text-center">
              <Package className="mx-auto h-8 w-8 text-muted opacity-20" />
              <p className="text-xs text-muted">Você ainda não adquiriu nenhum produto.</p>
            </div>
          ) : (
            orders.map((item) => (
              <div key={item.id} className="space-y-3 rounded-2xl border border-border bg-surface p-4">
                <div className="flex gap-3">
                  <img src={item.imageUrl || fallbackImg} alt={item.code} className="h-16 w-16 rounded-xl object-cover" />
                  <div className="flex-1">
                    <h4 className="text-xs font-black uppercase">{item.code}</h4>
                    <p className="text-[10px] text-muted">Investido {formatBRL(item.price)}</p>
                    <p className="text-[10px] font-black text-primary italic">Rende {formatBRL(item.daily)}/dia</p>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-border/30 pt-2">
                  <span className="text-[8px] font-bold text-muted">Expira em: {item.validade}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMine(item);
                      setDetailsOpen(true);
                    }}
                    className="flex items-center gap-1 rounded-full border border-border px-3 py-1 text-[8px] font-black text-primary uppercase"
                  >
                    DETALHES <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <Dialog open={purchaseOpen} onOpenChange={setPurchaseOpen}>
        <DialogContent className="max-w-[90vw] rounded-3xl border-border bg-surface p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-black uppercase italic">
              <ShoppingCart className="h-5 w-5 text-primary" /> Confirmar Aquisição
            </DialogTitle>
          </DialogHeader>
          {selected ? (
            <div className="space-y-4 py-2">
              <p className="text-[11px] text-muted">
                Adquirir <span className="font-bold text-foreground">{selected.code}</span> por{" "}
                <span className="font-black text-primary">{formatBRL(selected.price)}</span>?
              </p>
              <div className="rounded-xl border border-primary/10 bg-primary/5 p-3 text-[10px] text-muted">
                Retorno esperado {formatBRL(selected.total)} em {selected.cycleDays} dias. Rendimento diário {formatBRL(selected.daily)}.
              </div>
            </div>
          ) : null}
          <DialogFooter className="mt-2 flex-row gap-2">
            <button type="button" onClick={() => setPurchaseOpen(false)} className="flex-1 rounded-xl border border-border py-3 text-[10px] font-black uppercase">
              Cancelar
            </button>
            <button
              type="button"
              disabled={buying}
              onClick={() => void confirmPurchase()}
              className="flex-1 rounded-xl bg-primary py-3 text-[10px] font-black text-black uppercase"
            >
              {buying ? "..." : "Confirmar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-[90vw] rounded-3xl border-border bg-surface p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-black uppercase italic">
              <Package className="h-5 w-5 text-primary" /> Detalhes da Aquisição
            </DialogTitle>
          </DialogHeader>
          {selectedMine ? (
            <div className="grid grid-cols-2 gap-3 py-2">
              <div className="rounded-2xl border border-border/50 p-3">
                <span className="flex items-center gap-1 text-[7px] font-black text-muted uppercase">
                  <ShoppingCart className="h-2.5 w-2.5" /> Valor Investido
                </span>
                <p className="text-[11px] font-black">{formatBRL(selectedMine.price)}</p>
              </div>
              <div className="rounded-2xl border border-border/50 p-3">
                <span className="flex items-center gap-1 text-[7px] font-black text-muted uppercase">
                  <TrendingUp className="h-2.5 w-2.5 text-primary" /> Retorno Esperado
                </span>
                <p className="text-[11px] font-black text-primary italic">{formatBRL(selectedMine.total)}</p>
              </div>
              <div className="rounded-2xl border border-border/50 p-3">
                <span className="flex items-center gap-1 text-[7px] font-black text-muted uppercase">
                  <Calendar className="h-2.5 w-2.5" /> Data da Compra
                </span>
                <p className="text-[10px] font-black">
                  {selectedMine.purchasedDate} às {selectedMine.purchasedTime}
                </p>
              </div>
              <div className="rounded-2xl border border-border/50 p-3">
                <span className="flex items-center gap-1 text-[7px] font-black text-muted uppercase">
                  <Clock className="h-2.5 w-2.5" /> Duração
                </span>
                <p className="text-[11px] font-black">{selectedMine.cycleDays} dias</p>
              </div>
              <div className="col-span-2 rounded-2xl border border-primary/20 bg-primary/5 p-3">
                <span className="text-[7px] font-black text-muted uppercase">Rendimento Diário</span>
                <p className="text-[11px] font-black text-primary italic">{formatBRL(selectedMine.daily)}/dia</p>
              </div>
              <div className="col-span-2 rounded-2xl border border-border p-3">
                <span className="text-[7px] font-black text-muted uppercase">Expiração</span>
                <p className="text-[10px] font-black italic">{selectedMine.validade}</p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={cashbackOpen} onOpenChange={setCashbackOpen}>
        <DialogContent className="max-w-[90vw] rounded-3xl border-border bg-surface p-6">
          <DialogHeader>
            <DialogTitle className="flex items-start gap-2 text-base font-black uppercase italic">
              <Gift className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              Quanto mais você investe, mais você ganha de volta!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {cashbackExamples(cashback).map((item) => (
              <div key={item.invest} className="flex items-center justify-between rounded-xl border border-border bg-background/50 p-3">
                <span className="text-[10px] text-muted">
                  Investindo <span className="font-black text-foreground">{formatBRL(item.invest)}</span>
                </span>
                <span className="text-[10px] font-black text-primary">ganhe {formatBRL(item.cashback)} de cashback</span>
              </div>
            ))}
            <p className="pt-1 text-center text-[9px] text-muted italic">
              {cashback.cashbackPercent}% de cashback a partir de {formatBRL(cashback.cashbackMinInvest)},
              com exemplos a cada {formatBRL(cashback.cashbackBandAmount)}.
            </p>
          </div>
          <button type="button" onClick={() => setCashbackOpen(false)} className="w-full rounded-xl bg-primary py-3 text-[10px] font-black text-black uppercase">
            Entendi
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
