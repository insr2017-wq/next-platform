import * as React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Wallet, QrCode, Copy, CheckCircle2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/app/recharge')({
  component: RechargePage,
});

const PRESET_VALUES = [60, 120, 180, 360, 600, 1200];

type PixOption = 'standard' | 'high';

interface PixOptionConfig {
  id: PixOption;
  label: string;
  limit: number;
  description: string;
}

const PIX_OPTIONS: PixOptionConfig[] = [
  {
    id: 'standard',
    label: 'Opção 1',
    limit: 1000,
    description: '',
  },
  {
    id: 'high',
    label: 'Opção 2',
    limit: 10000,
    description: '',
  },
];

function RechargePage() {
  const navigate = useNavigate();
  const [selectedValue, setSelectedValue] = React.useState<number | null>(60);
  const [customValue, setCustomValue] = React.useState<string>('60');
  const [selectedPixOption, setSelectedPixOption] = React.useState<PixOption>('standard');
  const [showPixModal, setShowPixModal] = React.useState(false);

  const amount = customValue ? parseInt(customValue) : selectedValue || 0;
  const activePixOption = PIX_OPTIONS.find((opt) => opt.id === selectedPixOption)!;
  const exceedsStandardLimit = amount > 1000;

  const handleValueSelect = (val: number) => {
    setSelectedValue(val);
    setCustomValue(val.toString());
  };

  const handleCustomValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setCustomValue(val);
    setSelectedValue(null);
  };

  const handlePixOptionChange = (option: PixOption) => {
    setSelectedPixOption(option);
  };

  const handleRecharge = () => {
    if (!amount || amount <= 0) {
      toast.error("Por favor, informe um valor válido para recarga.");
      return;
    }
    if (amount > activePixOption.limit) {
      toast.error(`O ${activePixOption.label} permite recargas de até R$ ${activePixOption.limit.toLocaleString('pt-BR')},00.`);
      return;
    }
    if (exceedsStandardLimit && selectedPixOption === 'standard') {
      toast.error("Para valores acima de R$ 1.000,00, selecione a Opção 2 (PIX Valores Maiores).");
      return;
    }
    setShowPixModal(true);
  };

  const copyPixCode = () => {
    navigator.clipboard.writeText("00020126360014BR.GOV.BCB.PIX0114+5589999999999520400005303986540560.005802BR5925LUCAS MARTINS6009TERESINA62070503***6304E2D1");
    toast.success("Código PIX copiado com sucesso!");
  };

  return (
    <div className="pb-44 pt-4 space-y-6">
      {/* Header with Back Arrow */}
      <div className="flex items-center gap-4 mb-2">
        <button 
          onClick={() => navigate({ to: '/app' })}
          className="h-10 w-10 rounded-xl bg-surface border border-border flex items-center justify-center text-primary active:scale-90 transition-transform"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-black uppercase tracking-tight">Recarga Online</h1>
      </div>

      {/* Saldo Disponível Card */}
      <div className="rounded-2xl bg-surface border border-border p-5 space-y-1">
        <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Saldo disponível</span>
        <div className="flex items-center gap-2">
          <span className="text-3xl font-black text-primary italic">R$ 1.250,00</span>
          <div className="h-6 w-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <CheckCircle2 className="h-3 w-3 text-primary" />
          </div>
        </div>
      </div>

      {/* Selecione o valor Grid */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Wallet className="h-4 w-4 text-primary" />
          <h2 className="text-xs font-black uppercase tracking-widest text-muted">Selecione o valor</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {PRESET_VALUES.map((val) => (
            <button
              key={val}
              onClick={() => handleValueSelect(val)}
              className={cn(
                "rounded-xl border p-4 text-center transition-all active:scale-95",
                selectedValue === val 
                  ? "bg-primary border-primary text-black shadow-[0_0_15px_rgba(163,230,53,0.3)]" 
                  : "bg-surface border-border text-foreground hover:border-primary/50"
              )}
            >
              <span className="text-sm font-black">R$ {val}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Ou informe outro valor Card */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <PencilIcon className="h-4 w-4 text-primary" />
          <h2 className="text-xs font-black uppercase tracking-widest text-muted">Ou informe outro valor</h2>
        </div>
        <div className="rounded-xl bg-surface border border-border p-4 flex items-center gap-3 focus-within:border-primary/50 transition-colors">
          <span className="text-lg font-black text-primary italic">R$</span>
          <input 
            type="text" 
            value={customValue}
            onChange={handleCustomValueChange}
            placeholder="0"
            className="w-full bg-transparent text-xl font-black outline-none placeholder:text-muted/30"
          />
        </div>
      </div>

      {/* Método de Pagamento Card */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <QrCode className="h-4 w-4 text-primary" />
          <h2 className="text-xs font-black uppercase tracking-widest text-muted">Método de pagamento</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {PIX_OPTIONS.map((option) => {
            const isSelected = selectedPixOption === option.id;
            const isDisabled = option.id === 'standard' && exceedsStandardLimit;
            return (
              <button
                key={option.id}
                onClick={() => !isDisabled && handlePixOptionChange(option.id)}
                disabled={isDisabled}
                className={cn(
                  "rounded-xl border p-4 transition-all active:scale-95 relative overflow-hidden flex items-center justify-center min-h-[72px]",
                  isDisabled
                    ? "bg-surface/50 border-border/50 opacity-50 cursor-not-allowed"
                    : isSelected
                    ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(163,230,53,0.15)]"
                    : "bg-surface border-border hover:border-primary/50"
                )}
              >
                <h4 className={cn(
                  "text-sm font-black uppercase tracking-tight",
                  isSelected ? "text-primary" : "text-foreground/80"
                )}>
                  {option.label}
                </h4>
                {isSelected && !isDisabled && (
                  <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                    <CheckCircle2 className="h-2.5 w-2.5 text-black" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="rounded-xl bg-primary/5 border border-primary/10 p-3 flex items-start gap-2">
          <Info className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted font-medium leading-relaxed">
            A Opção 1 permite recargas de até R$ 1.000,00.
          </p>
        </div>
      </div>

      {/* Bloco de Informações */}
      <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted font-medium leading-relaxed">
            O valor será creditado instantaneamente após a confirmação do pagamento.
          </p>
        </div>
        <div className="space-y-2 pl-7 border-l border-primary/20">
          <h5 className="text-[9px] font-black uppercase text-primary">Como depositar:</h5>
          <ol className="text-[9px] text-muted font-medium space-y-1 list-decimal list-inside">
            <li>Escolha ou digite o valor desejado.</li>
            <li>Clique no botão "Realizar recarga" abaixo.</li>
            <li>Escaneie o QR Code ou copie o código PIX gerado.</li>
            <li>Realize o pagamento no aplicativo do seu banco.</li>
          </ol>
        </div>
      </div>

      {/* Botão Fixo Realizar Recarga */}
      <div className="fixed bottom-[80px] left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent z-40">
        <div className="mx-auto max-w-lg">
          <button 
            onClick={handleRecharge}
            className="w-full rounded-2xl bg-primary py-4 text-sm font-black text-black shadow-[0_4px_20px_rgba(163,230,53,0.3)] active:scale-[0.98] transition-all hover:brightness-110"
          >
            REALIZAR RECARGA
          </button>
        </div>
      </div>

      {/* PIX Modal Overlay */}
      {showPixModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-3xl bg-surface border border-border p-6 space-y-6 text-center animate-in zoom-in duration-300">
            <div className="space-y-2">
              <h3 className="text-lg font-black uppercase tracking-tight">Pagamento PIX</h3>
              <p className="text-[10px] text-muted">Escaneie o QR Code abaixo para pagar</p>
            </div>
            
            <div className="aspect-square w-full rounded-2xl bg-white p-4 mx-auto">
              <img 
                src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=00020126360014BR.GOV.BCB.PIX0114%2B5589999999999520400005303986540560.005802BR5925LUCAS%20MARTINS6009TERESINA62070503***6304E2D1" 
                alt="QR Code" 
                className="w-full h-full object-contain"
              />
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-muted uppercase tracking-widest">Valor a pagar:</span>
                <div className="text-xl font-black text-primary italic">R$ {customValue || selectedValue}</div>
              </div>

              <button 
                onClick={copyPixCode}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-background border border-border py-3 text-[10px] font-black hover:border-primary/50 transition-colors"
              >
                <Copy className="h-3 w-3 text-primary" />
                COPIAR CÓDIGO PIX
              </button>

              <button 
                onClick={() => setShowPixModal(false)}
                className="w-full text-[10px] font-bold text-muted uppercase pt-2"
              >
                FECHAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
      <path d="m15 5 4 4"/>
    </svg>
  );
}