import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, CheckCircle2, Zap, ShieldCheck, Headphones, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import nexusMark from '@/assets/nexus-mark.png.asset.json';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-[320px] sm:max-w-sm overflow-hidden rounded-[24px] bg-[#0D1117] border border-white/10 shadow-2xl max-h-[85vh] overflow-y-auto"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            <div className="flex flex-col items-center p-5 text-center sm:p-7">
              {/* Logo/Icon */}
              <div className="relative mb-3">
                <img
                  src={nexusMark.url}
                  alt="Nexus Tech"
                  className="h-12 w-auto object-contain drop-shadow-[0_0_15px_rgba(163,230,53,0.3)]"
                />
              </div>

              {/* Title */}
              <h2 className="mb-1.5 text-lg font-black tracking-tight text-white sm:text-xl leading-tight">
                Seja bem-vindo à <br />
                <span className="text-primary italic">NEXUS TECH!</span>
              </h2>

              <p className="mb-4 text-[10px] sm:text-xs leading-relaxed text-muted-foreground max-w-[240px]">
                Aqui você encontra tecnologia de ponta, benefícios exclusivos e a oportunidade de ganhar mais.
              </p>

              {/* Commission Section */}
              <div className="mb-4 w-full rounded-xl bg-white/5 border border-white/5 p-3 text-left">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">Comissões:</h3>
                </div>
                
                <ul className="space-y-1.5 pl-9">
                  <li className="flex items-center gap-2 text-[11px] text-white/80">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    Nível 1: <span className="font-black text-primary ml-1">20% no 1º aporte + 8% nos demais</span>
                  </li>
                  <li className="flex items-center gap-2 text-[11px] text-white/80">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    Nível 2: <span className="font-black text-primary ml-1">2%</span>
                  </li>
                  <li className="flex items-center gap-2 text-[11px] text-white/80">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    Nível 3: <span className="font-black text-primary ml-1">1%</span>
                  </li>
                </ul>
              </div>

              {/* Features List */}
              <div className="mb-4 w-full grid grid-cols-2 gap-2">
                {[
                  { icon: Calendar, label: "Check-in" },
                  { icon: Zap, label: "Saques" },
                  { icon: ShieldCheck, label: "Seguro" },
                  { icon: Headphones, label: "Suporte" },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white/5 rounded-lg p-2 border border-white/5">
                    <div className="flex h-4 w-4 items-center justify-center text-primary shrink-0">
                      <item.icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[10px] font-bold text-white/90 truncate">{item.label}</span>
                  </div>
                ))}
              </div>

              <p className="mb-5 text-[9px] text-muted-foreground px-1 leading-tight">
                Convide amigos e aproveite todas as vantagens da <span className="text-primary font-bold">Nexus Tech</span>!
              </p>

              {/* Action Button */}
              <Button 
                onClick={onClose}
                className="w-full h-10 rounded-xl bg-primary hover:bg-primary/90 text-black font-black text-[10px] uppercase tracking-widest shadow-[0_5px_15px_rgba(163,230,53,0.2)] flex items-center justify-center gap-1.5"
              >
                <Send className="h-3 w-3 fill-current" />
                ENTRAR NO GRUPO
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
