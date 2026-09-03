import * as React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ChevronLeft, Gift } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/app/bonus')({
  component: BonusPage,
});

function BonusPage() {
  const navigate = useNavigate();
  const [code, setCode] = React.useState('');

  const handleRedeem = () => {
    if (!code) {
      toast.error("Digite um código válido!");
      return;
    }
    toast.success("Código resgatado com sucesso!");
    setCode('');
  };

  return (
    <div className="pb-28">
      <div className="sticky top-0 z-50 flex items-center justify-between bg-background/80 px-4 py-4 backdrop-blur-lg">
        <button onClick={() => navigate({ to: '/app/profile' })} className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface border border-border">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-sm font-black uppercase">Resgatar Bônus</h1>
        <div className="w-10" />
      </div>

      <div className="relative h-48 w-full overflow-hidden">
        <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6">
          <h2 className="text-2xl font-black italic text-primary uppercase">Resgate seu Bônus</h2>
          <p className="text-xs font-bold text-white uppercase">Aumente sua renda com nossos códigos exclusivos.</p>
        </div>
      </div>

      <div className="px-6 py-8 space-y-6">
        <input 
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="DIGITE O CÓDIGO AQUI"
          className="w-full rounded-2xl bg-surface border border-border p-4 text-center font-black uppercase tracking-widest text-primary focus:border-primary outline-none"
        />
        <button onClick={handleRedeem} className="w-full rounded-2xl bg-primary py-4 text-sm font-black uppercase tracking-widest text-black">
          Resgatar Bônus
        </button>
        <p className="text-[10px] text-muted text-center leading-relaxed italic">
          Os códigos bônus são distribuídos em eventos, parcerias e promoções exclusivas da Nexus Tech.
        </p>
      </div>
    </div>
  );
}
