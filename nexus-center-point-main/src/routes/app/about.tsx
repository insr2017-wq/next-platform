import * as React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ChevronLeft, Info, Cpu, ShieldCheck, Zap } from 'lucide-react';

export const Route = createFileRoute('/app/about')({
  component: AboutPage,
});

function AboutPage() {
  const navigate = useNavigate();

  const PILLARS = [
    {
      title: "Inovação",
      text: "Sempre um passo à frente no desenvolvimento de hardware gamer.",
      img: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop",
      icon: Cpu
    },
    {
      title: "Confiança",
      text: "Segurança e transparência em todas as nossas operações e produtos.",
      img: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=2070&auto=format&fit=crop",
      icon: ShieldCheck
    },
    {
      title: "Tecnologia de Ponta",
      text: "Performance máxima garantida pelos componentes mais avançados do mercado.",
      img: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop",
      icon: Zap
    }
  ];

  return (
    <div className="pb-28">
      {/* Header */}
      <div className="sticky top-0 z-50 flex items-center justify-between bg-background/80 px-4 py-4 backdrop-blur-lg">
        <button 
          onClick={() => navigate({ to: '/app' })}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface border border-border text-foreground transition-colors active:scale-95"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-sm font-black uppercase tracking-[0.2em]">Sobre Nós</h1>
        <div className="w-10" />
      </div>

      {/* Hero Section */}
      <div className="relative h-64 w-full overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop" 
          alt="Nexus Tech Office" 
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6">
          <h2 className="text-3xl font-black italic text-primary leading-none uppercase">Nexus Tech</h2>
          <p className="mt-2 text-sm font-bold text-white uppercase tracking-wider">A tecnologia que define o futuro do gaming.</p>
        </div>
      </div>

      {/* Institutional Text */}
      <div className="px-6 py-8 space-y-6">
        <p className="text-sm text-muted leading-relaxed text-justify">
          Fundada em 2020, a <span className="text-primary font-bold italic">Nexus Tech</span> nasceu de uma paixão inabalável por tecnologia e pela busca constante da excelência no mundo gamer. Nossa missão é transformar o mercado através de soluções inteligentes, entregando hardware de alta performance para quem não aceita nada menos que o melhor.
        </p>
        <p className="text-sm text-muted leading-relaxed text-justify">
          Ao longo dos anos, consolidamos nossa marca como sinônimo de inovação e confiança. Acreditamos que a tecnologia deve ser uma ponte para grandes conquistas, e é por isso que cada produto em nosso catálogo é rigorosamente selecionado para garantir durabilidade, velocidade e uma experiência sem precedentes.
        </p>
      </div>

      {/* Pillars Section */}
      <div className="px-4 space-y-4">
        {PILLARS.map((pillar, i) => (
          <div key={i} className="relative h-48 w-full overflow-hidden rounded-2xl border border-border group">
            <img 
              src={pillar.img} 
              alt={pillar.title} 
              className="h-full w-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/20 to-transparent" />
            <div className="absolute inset-0 p-6 flex flex-col justify-end">
              <div className="flex items-center gap-2 mb-1">
                <pillar.icon className="h-4 w-4 text-primary" />
                <h3 className="text-lg font-black uppercase italic text-primary">{pillar.title}</h3>
              </div>
              <p className="text-[10px] text-white font-medium max-w-[70%]">{pillar.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Manifesto */}
      <div className="mt-12 px-8 text-center">
        <div className="h-px w-12 bg-primary/30 mx-auto mb-6" />
        <h4 className="text-[10px] font-black italic text-primary uppercase tracking-[0.3em] mb-2">Manifesto Nexus</h4>
        <p className="text-[11px] text-muted italic font-medium leading-relaxed">
          "Não apenas vendemos equipamentos. Nós construímos a base para a sua vitória. Nexus Tech: Inovação em cada pixel, poder em cada clique."
        </p>
      </div>
    </div>
  );
}
