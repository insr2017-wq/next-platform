"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Zap, ShoppingBag, TrendingUp, Wallet } from "lucide-react";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SLIDES = [
  {
    title: "Recarregue sua conta",
    description:
      "Recarregue via PIX com valores pré-definidos ou personalizados. O crédito é instantâneo na sua conta Nexus.",
    icon: <Zap className="h-16 w-16 text-primary" />,
  },
  {
    title: "Adquira produtos",
    description: "Produtos geram retorno real. Veja o investimento e o retorno esperado detalhadamente antes de cada compra.",
    icon: <ShoppingBag className="h-16 w-16 text-primary" />,
  },
  {
    title: "Receba seu rendimento",
    description: "O retorno de cada produto é creditado automaticamente na sua conta 24 horas após a aquisição.",
    icon: <TrendingUp className="h-16 w-16 text-primary" />,
  },
  {
    title: "Saque quando quiser",
    description: "Saque via PIX a qualquer momento. Prazo de 1 a 24 horas para conclusão da transferência.",
    icon: <Wallet className="h-16 w-16 text-primary" />,
  },
];

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [currentSlide, setCurrentSlide] = React.useState(0);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) setCurrentSlide((s) => s + 1);
    else onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 p-6 backdrop-blur-sm"
      >
        <div className="relative flex w-full max-w-md flex-col items-center text-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute -top-12 right-0 p-2 text-sm font-bold text-muted hover:text-foreground"
          >
            PULAR
          </button>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              className="flex flex-col items-center space-y-8 py-8"
            >
              <div className="relative bg-surface rounded-3xl border border-border/50 p-8 shadow-2xl">
                {SLIDES[currentSlide]?.icon}
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl font-black tracking-tighter text-foreground uppercase italic">
                  {SLIDES[currentSlide]?.title}
                </h2>
                <p className="max-w-[280px] text-sm leading-relaxed text-muted">
                  {SLIDES[currentSlide]?.description}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="mt-8 w-full space-y-8">
            <div className="flex justify-center gap-2">
              {SLIDES.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${i === currentSlide ? "w-6 bg-primary" : "w-2 bg-muted/20"}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={handleNext}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-sm font-black tracking-widest text-black uppercase italic"
            >
              {currentSlide === SLIDES.length - 1 ? "COMEÇAR" : "PRÓXIMO"}
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
