import * as React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Wallet, CheckCircle2, Info, User, Key, CreditCard, PencilLine, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export const Route = createFileRoute('/app/withdraw')({
  component: WithdrawPage,
});

type PixKeyType = 'CPF' | 'Telefone';

interface PixData {
  name: string;
  type: PixKeyType;
  key: string;
  cpf: string;
}

function WithdrawPage() {
  const navigate = useNavigate();
  const [step, setStep] = React.useState<'register' | 'request'>('register');
  const [pixData, setPixData] = React.useState<PixData | null>(null);
  
  // Form State
  const [formData, setFormData] = React.useState<PixData>({
    name: '',
    type: 'CPF',
    key: '',
    cpf: ''
  });
  
  const [withdrawAmount, setWithdrawAmount] = React.useState('');

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.key || !formData.cpf) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }
    setPixData(formData);
    setStep('request');
    toast.success("Chave Pix cadastrada com sucesso!");
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.error("Informe um valor válido para saque.");
      return;
    }
    if (amount > 1250) {
      toast.error("Saldo insuficiente.");
      return;
    }
    toast.success(`Solicitação de saque de R$ ${amount.toFixed(2)} enviada!`);
    setTimeout(() => navigate({ to: '/app' }), 1500);
  };

  return (
    <div className="pb-32 pt-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <button 
          onClick={() => navigate({ to: '/app' })}
          className="h-10 w-10 rounded-xl bg-surface border border-border flex items-center justify-center text-primary active:scale-90 transition-transform"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-black uppercase tracking-tight">Sacar Dinheiro</h1>
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

      <AnimatePresence mode="wait">
        {step === 'register' ? (
          <motion.div 
            key="register"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <Key className="h-4 w-4 text-primary" />
                <h2 className="text-xs font-black uppercase tracking-widest text-muted">Cadastro da chave Pix</h2>
              </div>
              
              <form onSubmit={handleSaveKey} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted uppercase ml-1">Nome do titular</label>
                  <div className="rounded-xl bg-surface border border-border p-4 flex items-center gap-3 focus-within:border-primary/50 transition-colors">
                    <User className="h-4 w-4 text-muted" />
                    <input 
                      type="text" 
                      placeholder="Nome completo"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-transparent text-sm font-bold outline-none placeholder:text-muted/30"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted uppercase ml-1">Tipo de chave Pix</label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-background rounded-xl border border-border">
                    {(['CPF', 'Telefone'] as PixKeyType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({...formData, type})}
                        className={cn(
                          "py-2 rounded-lg text-[10px] font-black transition-all",
                          formData.type === type ? "bg-primary text-black" : "text-muted hover:text-foreground"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted uppercase ml-1">Chave Pix</label>
                  <div className="rounded-xl bg-surface border border-border p-4 flex items-center gap-3 focus-within:border-primary/50 transition-colors">
                    <CreditCard className="h-4 w-4 text-muted" />
                    <input 
                      type="text" 
                      placeholder={formData.type === 'CPF' ? "000.000.000-00" : "(00) 00000-0000"}
                      value={formData.key}
                      onChange={e => setFormData({...formData, key: e.target.value})}
                      className="w-full bg-transparent text-sm font-bold outline-none placeholder:text-muted/30"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted uppercase ml-1">CPF do titular</label>
                  <div className="rounded-xl bg-surface border border-border p-4 flex items-center gap-3 focus-within:border-primary/50 transition-colors">
                    <ShieldCheckIcon className="h-4 w-4 text-muted" />
                    <input 
                      type="text" 
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={e => setFormData({...formData, cpf: e.target.value})}
                      className="w-full bg-transparent text-sm font-bold outline-none placeholder:text-muted/30"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full rounded-2xl bg-black py-4 text-sm font-black text-primary border border-primary/20 shadow-[0_4px_20px_rgba(0,0,0,0.3)] active:scale-[0.98] transition-all hover:brightness-110"
                >
                  SALVAR CHAVE PIX
                </button>
              </form>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="request"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-primary" />
                  <h2 className="text-xs font-black uppercase tracking-widest text-muted">Dados do recebedor</h2>
                </div>
                <button 
                  onClick={() => setStep('register')}
                  className="text-[10px] font-bold text-primary flex items-center gap-1"
                >
                  <PencilLine className="h-3 w-3" />
                  EDITAR
                </button>
              </div>

              <div className="rounded-2xl bg-surface border border-border p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                  <span className="text-[9px] font-bold text-muted uppercase tracking-wider">Titular</span>
                  <span className="text-[10px] font-black">{pixData?.name}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                  <span className="text-[9px] font-bold text-muted uppercase tracking-wider">Tipo de Chave</span>
                  <span className="text-[10px] font-black">{pixData?.type}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-muted uppercase tracking-wider">Chave Pix</span>
                  <span className="text-[10px] font-black text-primary italic">{pixData?.key}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted uppercase ml-1">Valor do saque</label>
                <div className="rounded-xl bg-surface border border-border p-4 flex items-center gap-3 focus-within:border-primary/50 transition-colors">
                  <span className="text-lg font-black text-primary italic">R$</span>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(e.target.value)}
                    className="w-full bg-transparent text-xl font-black outline-none placeholder:text-muted/30"
                  />
                </div>
              </div>

              <button 
                onClick={handleWithdraw}
                className="w-full rounded-2xl bg-black py-4 text-sm font-black text-primary border border-primary/20 shadow-[0_4px_20px_rgba(0,0,0,0.3)] active:scale-[0.98] transition-all hover:brightness-110 flex items-center justify-center gap-2"
              >
                SOLICITAR SAQUE
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tutorial Block */}
      <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
          <h5 className="text-[10px] font-black uppercase text-primary">Informações Importantes:</h5>
        </div>
        <div className="space-y-3 pl-7 border-l border-primary/20">
          <div className="space-y-1">
            <h6 className="text-[9px] font-black text-muted uppercase tracking-widest">Como cadastrar sua chave Pix:</h6>
            <ol className="text-[9px] text-muted font-medium space-y-1 list-decimal list-inside">
              <li>Insira seu nome completo exatamente como no banco.</li>
              <li>Escolha entre CPF ou Telefone.</li>
              <li>Digite a chave correspondente ao tipo escolhido.</li>
              <li>Confirme seu CPF para maior segurança.</li>
            </ol>
          </div>
          <div className="space-y-1">
            <h6 className="text-[9px] font-black text-muted uppercase tracking-widest">Prazos e Regras:</h6>
            <ul className="text-[9px] text-muted font-medium space-y-1 list-disc list-inside">
              <li>Saques são processados em até 24 horas úteis.</li>
              <li>Limite mínimo de saque: R$ 50,00.</li>
              <li>Verifique seus dados antes de solicitar, erros podem atrasar o envio.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
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
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  );
}