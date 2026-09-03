import * as React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ChevronLeft, MessageSquare, Mail, Phone, ChevronDown } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute('/app/support')({
  component: SupportPage,
});

function SupportPage() {
  const navigate = useNavigate();

  return (
    <div className="pb-28 pt-4 px-4 space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate({ to: '/app/profile' })} className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface border border-border">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-sm font-black uppercase">Suporte</h1>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button className="flex flex-col items-center gap-2 rounded-xl bg-surface border border-border p-4">
            <MessageSquare className='h-6 w-6 text-primary' />
            <span className='text-[9px] font-bold uppercase'>Chat</span>
        </button>
        <button className="flex flex-col items-center gap-2 rounded-xl bg-surface border border-border p-4">
            <Phone className='h-6 w-6 text-primary' />
            <span className='text-[9px] font-bold uppercase'>WhatsApp</span>
        </button>
        <button className="flex flex-col items-center gap-2 rounded-xl bg-surface border border-border p-4">
            <Mail className='h-6 w-6 text-primary' />
            <span className='text-[9px] font-bold uppercase'>E-mail</span>
        </button>
      </div>

      <Accordion type="single" collapsible className="w-full rounded-2xl bg-surface border border-border p-4">
        <AccordionItem value="item-1">
          <AccordionTrigger className='text-xs font-black uppercase'>Como funciona o saque?</AccordionTrigger>
          <AccordionContent className='text-[10px] text-muted'>O saque é processado em até 24h via Pix.</AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
