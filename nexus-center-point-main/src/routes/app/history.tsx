import * as React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ChevronLeft, Wallet, ArrowUpCircle, Gift } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute('/app/history')({
  component: HistoryPage,
});

function HistoryPage() {
  const navigate = useNavigate();

  return (
    <div className="pb-28 pt-4 px-4 space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate({ to: '/app/profile' })} className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface border border-border">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-sm font-black uppercase">Histórico Completo</h1>
      </div>

      <Tabs defaultValue="recharges" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-surface">
          <TabsTrigger value="recharges" className="text-[9px] uppercase font-black">Recargas</TabsTrigger>
          <TabsTrigger value="withdrawals" className="text-[9px] uppercase font-black">Saques</TabsTrigger>
          <TabsTrigger value="bonus" className="text-[9px] uppercase font-black">Bônus</TabsTrigger>
        </TabsList>
        <TabsContent value="recharges" className="mt-4 space-y-2">
            <div className="rounded-2xl bg-surface border border-border p-4 flex items-center justify-between">
                <div className='flex items-center gap-3'>
                    <Wallet className='h-4 w-4 text-primary' />
                    <span className='text-xs font-bold'>R$ 150,00</span>
                </div>
                <span className='text-[10px] text-muted'>11/08/2026 - Concluída</span>
            </div>
        </TabsContent>
        <TabsContent value="withdrawals" className="mt-4 space-y-2">
            <div className="rounded-2xl bg-surface border border-border p-4 flex items-center justify-between">
                <div className='flex items-center gap-3'>
                    <ArrowUpCircle className='h-4 w-4 text-primary' />
                    <span className='text-xs font-bold'>R$ 200,00</span>
                </div>
                <span className='text-[10px] text-muted'>10/08/2026 - Aprovado</span>
            </div>
        </TabsContent>
        <TabsContent value="bonus" className="mt-4 space-y-2">
            <div className="rounded-2xl bg-surface border border-border p-4 flex items-center justify-between">
                <div className='flex items-center gap-3'>
                    <Gift className='h-4 w-4 text-primary' />
                    <span className='text-xs font-bold'>Bônus: R$ 50,00</span>
                </div>
                <span className='text-[10px] text-muted'>Missão concluída</span>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
