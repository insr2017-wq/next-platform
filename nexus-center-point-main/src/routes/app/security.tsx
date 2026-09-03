import * as React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ChevronLeft, Lock, Save, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/app/security')({
  component: SecurityPage,
});

function SecurityPage() {
  const navigate = useNavigate();
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  
  const [form, setForm] = React.useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      toast.error('Preencha todos os campos.');
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      toast.error('As novas senhas não coincidem.');
      return;
    }

    // Mock logic: check current password (using '123456' as a simple mock check)
    if (form.currentPassword !== '123456') {
      toast.error('Senha atual incorreta.');
      return;
    }

    toast.success('Senha atualizada com sucesso!');
    setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  return (
    <div className="pb-28 pt-4 px-4 space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate({ to: '/app/profile' })} 
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface border border-border transition-colors hover:bg-surface/80"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-sm font-black uppercase tracking-wider">Segurança da Conta</h1>
      </div>

      <div className="rounded-2xl bg-surface border border-border p-6 shadow-xl shadow-black/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xs font-black uppercase">Trocar Senha</h2>
            <p className="text-[10px] text-muted uppercase tracking-tight">Atualize suas credenciais de acesso</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-muted ml-1">Senha atual</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                placeholder="Digite sua senha atual"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 transition-colors pr-10 text-white"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-muted ml-1">Nova senha</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 transition-colors pr-10 text-white"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-muted ml-1">Confirmar nova senha</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="Repita a nova senha"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary/50 transition-colors pr-10 text-white"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-background font-black text-xs uppercase py-4 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
          >
            <Lock size={16} />
            Salvar nova senha
          </button>
        </form>
      </div>

      <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
        <h3 className="text-[10px] font-black text-primary uppercase mb-2">Dica de Segurança</h3>
        <p className="text-[9px] text-muted leading-relaxed">
          Use uma combinação de letras, números e caracteres especiais para criar uma senha forte. 
          Nunca compartilhe sua senha com terceiros.
        </p>
      </div>
    </div>
  );
}
