"use client";

import { MessageSquare, Mail, Phone } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { NexusBackHeader } from "@/components/nexus/NexusBackHeader";
import { openExternalLink } from "@/lib/open-external-link";

export function SupportClient({ supportLink }: { supportLink: string }) {
  return (
    <div className="space-y-6 px-1 pt-4 pb-28">
      <NexusBackHeader title="Suporte" backHref="/profile" />
      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => openExternalLink(supportLink, "Link de atendimento ainda não configurado.")}
          className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface p-4"
        >
          <MessageSquare className="h-6 w-6 text-primary" />
          <span className="text-[9px] font-bold uppercase">Chat</span>
        </button>
        <button
          type="button"
          onClick={() => openExternalLink(supportLink, "Link de atendimento ainda não configurado.")}
          className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface p-4"
        >
          <Phone className="h-6 w-6 text-primary" />
          <span className="text-[9px] font-bold uppercase">WhatsApp</span>
        </button>
        <button type="button" className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface p-4">
          <Mail className="h-6 w-6 text-primary" />
          <span className="text-[9px] font-bold uppercase">E-mail</span>
        </button>
      </div>
      <Accordion type="single" collapsible className="w-full rounded-2xl border border-border bg-surface p-4">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-xs font-black uppercase">Como funciona o saque?</AccordionTrigger>
          <AccordionContent className="text-[10px] text-muted">O saque é processado em até 24h via Pix após aprovação.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger className="text-xs font-black uppercase">Como recarregar?</AccordionTrigger>
          <AccordionContent className="text-[10px] text-muted">Use Recarga Online, escolha a Opção 1 ou 2 e pague o Pix gerado.</AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
