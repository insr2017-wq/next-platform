import * as React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { ShoppingCart, Package, Clock, TrendingUp, Calendar, ArrowRight, X, Lock, Gift, Info } from 'lucide-react';
import { LEVELS, UserLevel } from '@/constants/levels';

import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

export const Route = createFileRoute('/app/products')({
  component: ProductsPage,
});

const AVAILABLE_PRODUCTS = [
  {
    id: 1,
    name: "Teclado Mecânico Gamer",
    price: "499,90",
    invested: "499,90",
    return: "750,00 (150%)",
    duration: "30 dias",
    image: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?q=80&w=2070&auto=format&fit=crop",
    inStock: true,
    requiredLevel: 'Bronze' as UserLevel
  },
  {
    id: 2,
    name: "Mouse Gamer Pro X",
    price: "299,90",
    invested: "299,90",
    return: "450,00 (150%)",
    duration: "30 dias",
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3a70?q=80&w=2070&auto=format&fit=crop",
    inStock: true,
    requiredLevel: 'Bronze' as UserLevel
  },
  {
    id: 3,
    name: "Headset Wireless 7.1",
    price: "699,90",
    invested: "699,90",
    return: "1.050,00 (150%)",
    duration: "30 dias",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop",
    inStock: true,
    requiredLevel: 'Prata' as UserLevel
  },
  {
    id: 4,
    name: "Monitor Gamer 24\" 144Hz",
    price: "899,90",
    invested: "899,90",
    return: "1.350,00 (150%)",
    duration: "30 dias",
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3a70?q=80&w=2070&auto=format&fit=crop",
    inStock: true,
    requiredLevel: 'Diamante' as UserLevel
  }
];

const MOCK_MY_PRODUCTS = [
  {
    id: 101,
    name: "Cadeira Gamer Elite",
    invested: "1.299,90",
    return: "R$ 1.950,00 (150%)",
    duration: "30 dias",
    date: "10/08/2026",
    time: "14:30",
    expiresAt: "11/08/2026 às 14:30",
    image: "https://images.unsplash.com/photo-1598550476439-6847785fce66?q=80&w=2070&auto=format&fit=crop"
  },
  {
    id: 102,
    name: "Mousepad RGB Nexus",
    invested: "129,90",
    return: "R$ 195,00 (150%)",
    duration: "30 dias",
    date: "05/08/2026",
    time: "09:15",
    expiresAt: "06/08/2026 às 09:15",
    image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=2070&auto=format&fit=crop"
  }
];

const parseBRL = (value: string) => {
  const match = value.replace(/\./g, '').match(/[\d,]+/);
  if (!match) return 0;
  return parseFloat(match[0].replace(',', '.'));
};

const formatBRL = (value: number) =>
  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const getDailyYield = (returnStr: string, durationStr: string) => {
  const total = parseBRL(returnStr);
  const days = parseInt(durationStr, 10) || 1;
  return formatBRL(total / days);
};

function ProductsPage() {
  const [myProducts, setMyProducts] = React.useState(MOCK_MY_PRODUCTS);
  const [activeTab, setActiveTab] = React.useState<'available' | 'mine'>('available');
  const [selectedProduct, setSelectedProduct] = React.useState<typeof AVAILABLE_PRODUCTS[0] | null>(null);
  const [selectedMyProduct, setSelectedMyProduct] = React.useState<typeof MOCK_MY_PRODUCTS[0] | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = React.useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = React.useState(false);
  const [isCashbackModalOpen, setIsCashbackModalOpen] = React.useState(false);
  const userLevel = 'Elite' as UserLevel; // Mock state


  React.useEffect(() => {
    const hasSeen = localStorage.getItem('nexus-cashback-seen');
    if (!hasSeen) {
      setIsCashbackModalOpen(true);
      localStorage.setItem('nexus-cashback-seen', 'true');
    }
  }, []);

  const getLevelRank = (level: UserLevel) => {
    const ranks: Record<UserLevel, number> = {
      'Bronze': 1,
      'Prata': 2,
      'Ouro': 3,
      'Elite': 4,
      'Diamante': 5
    };
    return ranks[level];
  };

  const isUnlocked = (required: UserLevel) => {
    return getLevelRank(userLevel) >= getLevelRank(required);
  };


  const handleAcquire = (product: typeof AVAILABLE_PRODUCTS[0]) => {
    setSelectedProduct(product);
    setIsPurchaseModalOpen(true);
  };

  const handleDetails = (product: typeof MOCK_MY_PRODUCTS[0]) => {
    setSelectedMyProduct(product);
    setIsDetailsModalOpen(true);
  };

  const confirmPurchase = () => {
    if (!selectedProduct) return;

    const now = new Date();
    const expiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const newProduct = {
      id: Math.random(),
      name: selectedProduct.name,
      invested: selectedProduct.invested,
      return: `R$ ${selectedProduct.return}`,
      duration: selectedProduct.duration,
      date: now.toLocaleDateString('pt-BR'),
      time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      expiresAt: `${expiry.toLocaleDateString('pt-BR')} às ${expiry.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
      image: selectedProduct.image
    };

    setMyProducts([newProduct, ...myProducts]);
    setIsPurchaseModalOpen(false);
    toast.success("Compra realizada!", {
      description: `${selectedProduct.name} foi adicionado aos seus produtos.`,
    });
  };

  const sortedProducts = [...AVAILABLE_PRODUCTS].sort(
    (a, b) => parseBRL(a.invested) - parseBRL(b.invested)
  );
  const unlockedProducts = sortedProducts.filter((p) => isUnlocked(p.requiredLevel));
  const lockedProducts = sortedProducts.filter((p) => !isUnlocked(p.requiredLevel));

  const renderProductCard = (product: typeof AVAILABLE_PRODUCTS[0], unlocked: boolean) => {
    const levelConfig = LEVELS[product.requiredLevel];

    return (
      <div
        key={product.id}
        className={cn(
          "flex flex-col rounded-2xl bg-surface border border-border overflow-hidden group transition-all duration-300",
          unlocked ? "hover:border-primary/50" : "opacity-75 grayscale-[0.5]"
        )}
      >
        <div className="relative aspect-square w-full overflow-hidden bg-background/50">
          <img
            src={product.image}
            alt={product.name}
            className={cn(
              "h-full w-full object-cover transition-opacity duration-500",
              unlocked ? "opacity-80 group-hover:opacity-100 group-hover:scale-110" : "opacity-40"
            )}
          />

          {unlocked ? (
            <div className="absolute top-2 left-2">
              <span className="rounded bg-primary px-1.5 py-0.5 text-[7px] font-black text-black uppercase tracking-tighter shadow-lg shadow-black/20">
                EM ESTOQUE
              </span>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 text-center">
              <div className={`h-10 w-10 rounded-full bg-background/80 flex items-center justify-center mb-2 border ${levelConfig.borderColor} ${levelConfig.color}`}>
                <Lock className="h-5 w-5" />
              </div>
              <span className="text-[8px] font-black text-white uppercase tracking-widest leading-tight">
                Requisito de Conta <br />
                <span className="text-primary">Nível {product.requiredLevel}</span>
              </span>
            </div>
          )}
        </div>

        <div className="p-3 space-y-2.5 flex-1 flex flex-col">
          <div className="space-y-0.5">
            <h3 className="text-[11px] font-black leading-tight line-clamp-1 uppercase tracking-tight">
              {product.name}
            </h3>
            <div className="grid grid-cols-3 gap-1 mt-2">
              <div className="space-y-0.5">
                <span className="text-[7px] text-muted font-black uppercase tracking-tighter flex items-center gap-0.5">
                  <Package className="h-2 w-2" /> Invest
                </span>
                <p className="text-[9px] font-black text-foreground">R$ {product.invested}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[7px] text-muted font-black uppercase tracking-tighter flex items-center gap-0.5">
                  <TrendingUp className="h-2 w-2 text-primary" /> Retorno
                </span>
                <p className="text-[9px] font-black text-primary italic">{product.return}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[7px] text-muted font-black uppercase tracking-tighter flex items-center gap-0.5">
                  <Clock className="h-2 w-2" /> Duração
                </span>
                <p className="text-[9px] font-black text-foreground">{product.duration}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 rounded-lg bg-primary/5 border border-primary/10 px-2 py-1">
              <TrendingUp className="h-2.5 w-2.5 text-primary" />
              <span className="text-[9px] font-black text-primary italic">
                Rende {getDailyYield(product.return, product.duration)}/dia
              </span>
            </div>
          </div>

          <button
            disabled={!unlocked}
            onClick={() => handleAcquire(product)}
            className={cn(
              "mt-auto w-full flex items-center justify-center gap-2 rounded-lg py-2 text-[10px] font-black transition-all active:scale-95 group/btn shadow-inner",
              unlocked
                ? "bg-surface border border-border hover:bg-primary hover:text-black hover:border-primary"
                : "bg-muted/50 border border-border/50 text-muted cursor-not-allowed"
            )}
          >
            {unlocked ? <ShoppingCart className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
            {unlocked ? 'ADQUIRIR' : 'BLOQUEADO'}
          </button>
        </div>
      </div>
    );
  };


  return (
    <div className="pb-32 pt-4 space-y-8">
      {/* Header */}
      <div className="space-y-1 px-1">
        <h1 className="text-2xl font-black text-foreground uppercase tracking-tight italic">Produtos</h1>
        <p className="text-xs text-muted font-medium">Equipamentos de alta performance para elevar seu nível.</p>
      </div>

      {/* Cashback CTA */}
      <button
        onClick={() => setIsCashbackModalOpen(true)}
        className="mx-1 flex items-center gap-3 rounded-2xl bg-primary/10 border border-primary/20 p-4 text-left transition-all active:scale-[0.98] hover:bg-primary/15"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20">
          <Gift className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-black uppercase tracking-tight text-foreground">
            Quanto mais você investe, mais você ganha de volta!
          </h3>
          <p className="text-[9px] text-muted font-medium mt-0.5">
            Toque para ver exemplos de cashback.
          </p>
        </div>
        <Info className="h-4 w-4 text-primary shrink-0" />
      </button>

      {/* Abas */}
      <div className="px-1">
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-surface border border-border p-1">
          {([
            { key: 'available', label: 'Disponíveis' },
            { key: 'mine', label: 'Meus Investimentos' },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98]",
                activeTab === tab.key
                  ? "bg-primary text-black shadow-[0_0_20px_rgba(163,230,53,0.2)]"
                  : "text-muted hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Seção: Produtos Disponíveis */}
      {activeTab === 'available' && (
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <div className="h-4 w-1 bg-primary rounded-full" />
              <h2 className="text-[10px] font-black uppercase tracking-widest text-muted">Produtos Disponíveis</h2>
            </div>

            <div className="grid grid-cols-2 gap-3 px-1">
              {unlockedProducts.map((product) => renderProductCard(product, true))}
            </div>
          </div>

          {lockedProducts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="h-4 w-1 bg-muted rounded-full" />
                <h2 className="text-[10px] font-black uppercase tracking-widest text-muted">Desbloqueie mais produtos investindo mais</h2>
              </div>

              <div className="grid grid-cols-2 gap-3 px-1">
                {lockedProducts.map((product) => renderProductCard(product, false))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Seção: Meus Produtos Adquiridos */}
      {activeTab === 'mine' && (
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <div className="h-4 w-1 bg-primary rounded-full" />
          <h2 className="text-[10px] font-black uppercase tracking-widest text-muted">Meus Produtos Adquiridos</h2>
        </div>

        <div className="space-y-3 px-1">
          {myProducts.length > 0 ? (
            myProducts.map((item) => (
              <div 
                key={item.id}
                className="flex flex-col gap-3 rounded-2xl bg-surface border border-border p-3 hover:border-primary/30 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-background border border-border/50">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="h-full w-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" 
                    />
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase tracking-tight">{item.name}</h3>
                      <div className="flex items-center gap-1 text-[8px] text-muted font-bold">
                        <Calendar className="h-2.5 w-2.5" />
                        {item.date} {item.time}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[7px] text-muted font-black uppercase tracking-tighter flex items-center gap-0.5">
                          <Package className="h-2 w-2" /> Investido
                        </span>
                        <p className="text-[9px] font-black text-foreground">R$ {item.invested}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[7px] text-muted font-black uppercase tracking-tighter flex items-center gap-0.5">
                          <TrendingUp className="h-2 w-2 text-primary" /> Retorno
                        </span>
                        <p className="text-[9px] font-black text-primary italic">{item.return}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[7px] text-muted font-black uppercase tracking-tighter flex items-center gap-0.5">
                          <Clock className="h-2 w-2" /> Duração
                        </span>
                        <p className="text-[9px] font-black text-foreground">{item.duration}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 rounded-lg bg-primary/5 border border-primary/10 px-2 py-1">
                      <TrendingUp className="h-2.5 w-2.5 text-primary" />
                      <span className="text-[9px] font-black text-primary italic">
                        Rende {getDailyYield(item.return, item.duration)}/dia
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/30 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[8px] text-muted font-bold">
                    <Clock className="h-2.5 w-2.5 text-primary" />
                    <span>Expira em: <span className="text-foreground">{item.expiresAt}</span></span>
                  </div>
                  <button 
                    onClick={() => handleDetails(item)}
                    className="h-6 px-3 rounded-full bg-background border border-border flex items-center justify-center gap-1 text-[8px] font-black text-primary uppercase active:scale-90 transition-transform">
                    DETALHES
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center space-y-2">
              <Package className="h-8 w-8 text-muted mx-auto opacity-20" />
              <p className="text-xs text-muted font-medium">Você ainda não adquiriu nenhum produto.</p>
            </div>
          )}
        </div>
      </div>
      )}


      {/* Trust Message Small */}
      <div className="px-1">
        <div className="rounded-xl bg-primary/5 border border-primary/10 p-3 text-center">
          <p className="text-[8px] text-muted font-bold uppercase tracking-widest">
            Todos os produtos possuem garantia de suporte e retorno garantido Nexus Tech
          </p>
        </div>
      </div>

      {/* Modal de Confirmação de Compra */}
      <Dialog open={isPurchaseModalOpen} onOpenChange={setIsPurchaseModalOpen}>
        <DialogContent className="bg-surface border-border text-foreground max-w-[90vw] rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase italic tracking-tighter text-left flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Confirmar Aquisição
            </DialogTitle>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-4 py-4">
              <div className="flex gap-4 items-center rounded-2xl bg-background/50 border border-border p-3">
                <img 
                  src={selectedProduct.image} 
                  alt={selectedProduct.name} 
                  className="h-16 w-16 object-cover rounded-xl"
                />
                <div className="space-y-1">
                  <h4 className="text-[11px] font-black uppercase tracking-tight">{selectedProduct.name}</h4>
                  <p className="text-[10px] font-black text-primary italic">R$ {selectedProduct.invested}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-[11px] text-muted leading-relaxed">
                  Tem certeza que deseja adquirir <span className="text-foreground font-bold">{selectedProduct.name}</span> por <span className="text-primary font-black">R$ {selectedProduct.invested}</span>?
                </p>
                <div className="rounded-xl bg-primary/5 border border-primary/10 p-3">
                   <p className="text-[10px] text-muted font-medium">
                     Você receberá um retorno de <span className="text-primary font-black">R$ {selectedProduct.return}</span> em <span className="text-foreground font-black">{selectedProduct.duration}</span>.
                   </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-row gap-2 mt-2">
            <button 
              onClick={() => setIsPurchaseModalOpen(false)}
              className="flex-1 py-3 rounded-xl bg-background border border-border text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={confirmPurchase}
              className="flex-1 py-3 rounded-xl bg-primary text-black text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(163,230,53,0.3)]"
            >
              Confirmar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes do Produto Adquirido */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="bg-surface border-border text-foreground max-w-[90vw] rounded-3xl p-6">
          <DialogHeader className="relative">
            <DialogTitle className="text-lg font-black uppercase italic tracking-tighter text-left flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Detalhes da Aquisição
            </DialogTitle>
          </DialogHeader>
          
          {selectedMyProduct && (
            <div className="space-y-5 py-4 overflow-y-auto max-h-[70vh] pr-1 scrollbar-hide">
              {/* Product Info Card */}
              <div className="flex gap-4 items-center rounded-2xl bg-background/50 border border-border p-4">
                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-border/50 bg-background">
                  <img 
                    src={selectedMyProduct.image} 
                    alt={selectedMyProduct.name} 
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="space-y-1.5 flex-1">
                  <h4 className="text-xs font-black uppercase tracking-tight leading-tight">{selectedMyProduct.name}</h4>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-[8px] font-black text-primary uppercase italic">
                      Em andamento
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-background/30 border border-border/50 p-3 space-y-1">
                  <span className="text-[7px] text-muted font-black uppercase tracking-tighter flex items-center gap-1">
                    <ShoppingCart className="h-2.5 w-2.5" /> Valor Investido
                  </span>
                  <p className="text-[11px] font-black text-foreground">R$ {selectedMyProduct.invested}</p>
                </div>
                <div className="rounded-2xl bg-background/30 border border-border/50 p-3 space-y-1">
                  <span className="text-[7px] text-muted font-black uppercase tracking-tighter flex items-center gap-1">
                    <TrendingUp className="h-2.5 w-2.5 text-primary" /> Retorno Esperado
                  </span>
                  <p className="text-[11px] font-black text-primary italic">{selectedMyProduct.return}</p>
                </div>
                <div className="rounded-2xl bg-background/30 border border-border/50 p-3 space-y-1">
                  <span className="text-[7px] text-muted font-black uppercase tracking-tighter flex items-center gap-1">
                    <Calendar className="h-2.5 w-2.5" /> Data da Compra
                  </span>
                  <p className="text-[10px] font-black text-foreground">{selectedMyProduct.date} às {selectedMyProduct.time}</p>
                </div>
                <div className="rounded-2xl bg-background/30 border border-border/50 p-3 space-y-1">
                  <span className="text-[7px] text-muted font-black uppercase tracking-tighter flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" /> Duração Total
                  </span>
                  <p className="text-[11px] font-black text-foreground">{selectedMyProduct.duration}</p>
                </div>
                <div className="col-span-2 rounded-2xl bg-primary/5 border border-primary/20 p-3 space-y-1">
                  <span className="text-[7px] text-muted font-black uppercase tracking-tighter flex items-center gap-1">
                    <TrendingUp className="h-2.5 w-2.5 text-primary" /> Rendimento Diário
                  </span>
                  <p className="text-[11px] font-black text-primary italic">
                    {getDailyYield(selectedMyProduct.return, selectedMyProduct.duration)}/dia
                  </p>
                </div>
              </div>


              {/* Status and Yield Info */}
              <div className="space-y-3">
                <div className="rounded-2xl bg-primary/5 border border-primary/10 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-[9px] font-black text-primary uppercase tracking-wider">Informação de Rendimento</span>
                  </div>
                  <p className="text-[10px] text-muted font-medium leading-relaxed">
                    O rendimento é liberado <span className="text-foreground font-black">24 horas</span> após a aquisição.
                  </p>
                </div>

                <div className="rounded-2xl bg-background/50 border border-border p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[7px] text-muted font-black uppercase tracking-tighter block">Expiração do Rendimento</span>
                    <p className="text-[10px] font-black text-foreground italic">{selectedMyProduct.expiresAt}</p>
                  </div>
                  <Clock className="h-4 w-4 text-muted opacity-50" />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-2">
            <button 
              onClick={() => setIsDetailsModalOpen(false)}
              className="w-full py-3 rounded-xl bg-background border border-border text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-colors active:scale-[0.98]"
            >
              Fechar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Cashback */}
      <Dialog open={isCashbackModalOpen} onOpenChange={setIsCashbackModalOpen}>
        <DialogContent className="bg-surface border-border text-foreground max-w-[90vw] rounded-3xl p-6">
          <DialogHeader className="relative">
            <DialogTitle className="text-base font-black uppercase italic tracking-tighter text-left flex items-start gap-2 leading-tight">
              <Gift className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              Quanto mais você investe, mais você ganha de volta!
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 py-4">
            {[
              { invest: 'R$ 500', cashback: 'R$ 15' },
              { invest: 'R$ 900', cashback: 'R$ 27' },
              { invest: 'R$ 1.500', cashback: 'R$ 45' },
              { invest: 'R$ 2.000', cashback: 'R$ 60' },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-xl bg-background/50 border border-border p-3"
              >
                <span className="text-[10px] text-muted font-medium">
                  Investindo <span className="text-foreground font-black">{item.invest}</span>
                </span>
                <span className="text-[10px] font-black text-primary">
                  ganhe {item.cashback} de cashback
                </span>
              </div>
            ))}
          </div>

          <DialogFooter className="mt-2">
            <button
              onClick={() => setIsCashbackModalOpen(false)}
              className="w-full py-3 rounded-xl bg-primary text-black text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(163,230,53,0.3)] active:scale-[0.98]"
            >
              Entendi
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}