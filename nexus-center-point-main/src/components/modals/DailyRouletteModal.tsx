import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Disc } from 'lucide-react';
import { toast } from 'sonner';

interface DailyRouletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpinComplete: (amount: number) => void;
  isAlreadySpun: boolean;
}

const PRIZES = [
  { value: 0.01, label: 'R$ 0,01', color: '#1A1A1A' },
  { value: 0.50, label: 'R$ 0,50', color: '#A3E635' },
  { value: 1.00, label: 'R$ 1,00', color: '#1A1A1A' },
  { value: 5.00, label: 'R$ 5,00', color: '#A3E635' },
  { value: 20.00, label: 'R$ 20,00', color: '#1A1A1A' },
  { value: 50.00, label: 'R$ 50,00', color: '#A3E635' },
  { value: 100.00, label: 'R$ 100,00', color: '#1A1A1A' },
  { value: 200.00, label: 'R$ 200,00', color: '#A3E635' },
];

export function DailyRouletteModal({ isOpen, onClose, onSpinComplete, isAlreadySpun }: DailyRouletteModalProps) {
  const [isSpinning, setIsSpinning] = React.useState(false);
  const [rotation, setRotation] = React.useState(0);
  const [winner, setWinner] = React.useState<typeof PRIZES[0] | null>(null);
  const [showResult, setShowResult] = React.useState(false);

  const spin = () => {
    if (isSpinning || isAlreadySpun) return;

    setIsSpinning(true);
    setShowResult(false);
    
    // Calculate a random prize
    const prizeIndex = Math.floor(Math.random() * PRIZES.length);
    const prize = PRIZES[prizeIndex] as typeof PRIZES[0];
    
    // Each slice is 360 / PRIZES.length degrees
    const sliceAngle = 360 / PRIZES.length;
    
    // Extra rotations for effect (at least 5 full circles)
    const extraRotations = 5 + Math.floor(Math.random() * 5);
    
    // Final rotation targets the center of the slice
    // We subtract the slice center from 360 because the wheel rotates clockwise
    const finalRotation = (extraRotations * 360) + (360 - (prizeIndex * sliceAngle + sliceAngle / 2));
    
    setRotation(finalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setWinner(prize || PRIZES[0]);
      setShowResult(true);
      if (prize) onSpinComplete(prize.value);
    }, 4000); // Match CSS transition duration
  };

  const sliceAngle = 360 / PRIZES.length;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-surface border border-border p-6 text-center"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 rounded-full bg-background/50 p-2 text-muted transition-colors hover:text-foreground"
            >
              <X size={20} />
            </button>

            <div className="mb-6 space-y-1">
              <h2 className="text-xl font-black uppercase tracking-tight text-primary">Roleta Diária</h2>
              <p className="text-xs text-muted">Tente a sua sorte e ganhe prêmios em dinheiro!</p>
            </div>

            {/* Roulette Container */}
            <div className="relative mx-auto mb-8 aspect-square w-full max-w-[280px]">
              {/* Indicator Arrow */}
              <div className="absolute -top-2 left-1/2 z-20 -translate-x-1/2 text-primary drop-shadow-[0_0_8px_rgba(163,230,53,0.5)]">
                <div className="h-6 w-6 rotate-45 border-b-4 border-r-4 border-primary bg-primary" />
              </div>

              {/* The Wheel */}
              <motion.div
                animate={{ rotate: rotation }}
                transition={{ duration: 4, ease: [0.15, 0, 0.15, 1] }}
                className="relative h-full w-full rounded-full border-8 border-surface shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden"
                style={{ 
                  background: 'conic-gradient(from 0deg, ' + 
                    PRIZES.map((p, i) => `${p.color} ${i * sliceAngle}deg ${(i + 1) * sliceAngle}deg`).join(', ') + 
                  ')' 
                }}
              >
                {/* Prize Labels */}
                {PRIZES.map((prize, i) => (
                  <div
                    key={i}
                    className="absolute inset-0 flex justify-center pt-8"
                    style={{ 
                      transform: `rotate(${i * sliceAngle + sliceAngle / 2}deg)`,
                      transformOrigin: '50% 50%'
                    }}
                  >
                    <span 
                      className={`text-[10px] font-black uppercase ${prize.color === '#A3E635' ? 'text-black' : 'text-primary'}`}
                      style={{ transform: 'rotate(0deg)' }}
                    >
                      {prize.label}
                    </span>
                  </div>
                ))}

                {/* Inner Circle / Center Button area visual */}
                <div className="absolute inset-[35%] rounded-full bg-surface border-4 border-border flex items-center justify-center z-10 shadow-inner">
                  <Disc size={32} className="text-primary opacity-20" />
                </div>
              </motion.div>
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="wait">
                {showResult && winner ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-2 py-2"
                  >
                    <div className="flex justify-center">
                      <div className="rounded-full bg-primary/20 p-3 text-primary animate-bounce">
                        <Trophy size={32} />
                      </div>
                    </div>
                    <div className="text-lg font-black text-primary uppercase">Parabéns!</div>
                    <div className="text-2xl font-black text-white">Você ganhou {winner.label}</div>
                  </motion.div>
                ) : (
                  <button
                    disabled={isSpinning || isAlreadySpun}
                    onClick={spin}
                    className={`w-full rounded-xl py-4 text-sm font-black uppercase tracking-widest transition-all ${
                      isAlreadySpun 
                        ? 'bg-muted/20 text-muted cursor-not-allowed border border-border' 
                        : 'bg-primary text-black hover:shadow-[0_0_20px_rgba(163,230,53,0.4)] active:scale-95'
                    }`}
                  >
                    {isSpinning ? 'Girando...' : isAlreadySpun ? 'Já Resgatado Hoje' : 'Girar Roleta'}
                  </button>
                )}
              </AnimatePresence>

              {showResult && (
                <button
                  onClick={onClose}
                  className="w-full rounded-xl border border-border bg-surface/50 py-3 text-xs font-bold text-muted transition-colors hover:bg-surface hover:text-foreground"
                >
                  CONTINUAR
                </button>
              )}

              {isAlreadySpun && !showResult && (
                <p className="text-[10px] text-muted italic">Você já participou hoje. Volte em 24h!</p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
