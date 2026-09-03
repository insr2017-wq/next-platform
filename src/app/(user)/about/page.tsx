"use client";

import { Cpu, ShieldCheck, Zap } from "lucide-react";
import { NexusBackHeader } from "@/components/nexus/NexusBackHeader";

const PILLARS = [
  {
    title: "Inovação",
    text: "Sempre um passo à frente no desenvolvimento de hardware gamer.",
    img: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop",
    icon: Cpu,
  },
  {
    title: "Confiança",
    text: "Segurança e transparência em todas as nossas operações e produtos.",
    img: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=2070&auto=format&fit=crop",
    icon: ShieldCheck,
  },
  {
    title: "Tecnologia de Ponta",
    text: "Performance máxima garantida pelos componentes mais avançados do mercado.",
    img: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop",
    icon: Zap,
  },
];

export default function AboutPage() {
  return (
    <div className="pt-4 pb-28">
      <NexusBackHeader title="Sobre Nós" />
      <div className="relative mt-4 h-64 w-full overflow-hidden rounded-2xl">
        <img
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop"
          alt="Nexus Tech"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute right-6 bottom-6 left-6">
          <h2 className="text-3xl leading-none font-black text-primary uppercase italic">Nexus Tech</h2>
          <p className="mt-2 text-sm font-bold tracking-wider text-white uppercase">A tecnologia que define o futuro do gaming.</p>
        </div>
      </div>
      <div className="space-y-6 py-8">
        <p className="text-justify text-sm leading-relaxed text-muted">
          Fundada em 2020, a <span className="font-bold text-primary italic">Nexus Tech</span> nasceu de uma paixão inabalável por tecnologia e pela busca constante da excelência no mundo gamer.
        </p>
        {PILLARS.map((pillar) => (
          <div key={pillar.title} className="relative h-48 w-full overflow-hidden rounded-2xl border border-border">
            <img src={pillar.img} alt={pillar.title} className="h-full w-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <div className="mb-1 flex items-center gap-2">
                <pillar.icon className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-black uppercase">{pillar.title}</h3>
              </div>
              <p className="text-[11px] text-muted">{pillar.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
