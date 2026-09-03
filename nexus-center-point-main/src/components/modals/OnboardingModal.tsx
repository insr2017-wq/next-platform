import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Zap, ShoppingBag, TrendingUp, Wallet } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SLIDES = [
  {
    title: "Recarregue sua conta",
    description: "Recarregue via PIX com valores pré-definidos ou personalizados. O crédito é instantâneo na sua conta Nexus.",
    icon: <Zap className="w-16 h-16 text-primary" />,
  },
  {
    title: "Adquira produtos",
    description: "Produtos geram retorno real. Veja o investimento e o retorno esperado detalhadamente antes de cada compra.",
    icon: <ShoppingBag className="w-16 h-16 text-primary" />,
  },
  {
    title: "Receba seu rendimento",
    description: "O retorno de cada produto é creditado automaticamente na sua conta 24 horas após a aquisição.",
    icon: <TrendingUp className="w-16 h-16 text-primary" />,
  },
  {
    title: "Saque quando quiser",
    description: "Saque via PIX a qualquer momento. Prazo de 1 a 24 horas para conclusão da transferência.",
    icon: <Wallet className="w-16 h-16 text-primary" />,
  },
];

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [currentSlide, setCurrentSlide] = React.useState(0);

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 p-6 backdrop-blur-sm"
      >
        <div className="relative w-full max-w-md flex flex-col items-center text-center">
          {/* Skip Button */}
          <button
            onClick={onClose}
            className="absolute -top-12 right-0 text-sm font-bold text-muted hover:text-foreground transition-colors p-2"
          >
            PULAR
          </button>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex flex-col items-center space-y-8 py-8"
            >
              {/* Illustration Area */}
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                <div className="relative bg-surface p-8 rounded-3xl border border-border/50 shadow-2xl">
                  {SLIDES[currentSlide]?.icon}
                </div>
              </div>

              {/* Text Area */}
              <div className="space-y-4">
                <h2 className="text-2xl font-black italic tracking-tighter uppercase text-foreground">
                  {SLIDES[currentSlide]?.title}
                </h2>
                <p className="text-muted text-sm leading-relaxed max-w-[280px]">
                  {SLIDES[currentSlide]?.description}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Indicators & Footer */}
          <div className="w-full mt-8 space-y-8">
            <div className="flex justify-center gap-2">
              {SLIDES.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === currentSlide ? 'w-6 bg-primary' : 'w-2 bg-muted/20'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="w-full bg-primary py-4 rounded-xl text-black font-black italic text-sm tracking-widest uppercase flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(163,230,53,0.3)] transition-transform active:scale-95"
            >
              {currentSlide === SLIDES.length - 1 ? 'COMEÇAR' : 'PRÓXIMO'}
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
