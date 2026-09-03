import * as React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ChevronLeft, Wallet, CheckCircle, Clock, XCircle } from 'lucide-react';

export const Route = createFileRoute('/app/recharge-history')({
  component: RechargeHistoryPage,
});

const MOCK_DATA = [
  { id: 1, amount: 150.00, date: '11/08/2026 - 14:30', status: 'concluída', method: 'PIX' },
  { id: 2, amount: 60.00, date: '10/08/2026 - 09:15', status: 'concluída', method: 'PIX' },
  { id: 3, amount: 300.00, date: '08/08/2026 - 18:45', status: 'falhou', method: 'PIX' },
];

function RechargeHistoryPage() {
  const navigate = useNavigate();
  const total = MOCK_DATA.filter(i => i.status === 'concluída').reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="pb-28 pt-4 px-4 space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate({ to: '/app/profile' })} className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface border border-border">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-sm font-black uppercase">Registro de Recargas</h1>
      </div>

      <div className="rounded-2xl bg-primary/10 border border-primary/20 p-6 flex flex-col items-center justify-center">
        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Total Recarregado</span>
        <span className="text-3xl font-black italic text-primary">R$ {total.toFixed(2)}</span>
      </div>

      <div className="space-y-3">
        {MOCK_DATA.map((item) => (
          <div key={item.id} className="rounded-2xl bg-surface border border-border p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-background border border-border flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-xs font-black text-foreground">R$ {item.amount.toFixed(2)}</div>
                <div className="text-[9px] text-muted">{item.date}</div>
              </div>
            </div>
            <div className={`px-2 py-1 rounded text-[8px] font-bold uppercase ${item.status === 'concluída' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
              {item.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
