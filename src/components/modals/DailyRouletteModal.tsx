"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Disc } from "lucide-react";
import { toast } from "sonner";

interface DailyRouletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAlreadySpun: boolean;
  onSpinComplete: (result: { extraRemaining: number; alreadySpun: boolean; prizeLabel: string }) => void;
}

const PRIZES = [
  { value: 0.01, label: "R$ 0,01", color: "#1A1A1A" },
  { value: 0.5, label: "R$ 0,50", color: "#A3E635" },
  { value: 1, label: "R$ 1,00", color: "#1A1A1A" },
  { value: 5, label: "R$ 5,00", color: "#A3E635" },
  { value: 20, label: "R$ 20,00", color: "#1A1A1A" },
  { value: 50, label: "R$ 50,00", color: "#A3E635" },
  { value: 100, label: "R$ 100,00", color: "#1A1A1A" },
  { value: 200, label: "R$ 200,00", color: "#A3E635" },
];

export function DailyRouletteModal({ isOpen, onClose, isAlreadySpun, onSpinComplete }: DailyRouletteModalProps) {
  const [isSpinning, setIsSpinning] = React.useState(false);
  const [rotation, setRotation] = React.useState(0);
  const [winner, setWinner] = React.useState<(typeof PRIZES)[0] | null>(null);
  const [showResult, setShowResult] = React.useState(false);
  const sliceAngle = 360 / PRIZES.length;

  const spin = async () => {
    if (isSpinning || isAlreadySpun) return;
    setIsSpinning(true);
    setShowResult(false);
    try {
      const res = await fetch("/api/user/missions/roulette-spin", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Não foi possível girar agora.");
        setIsSpinning(false);
        return;
      }
      const prizeLabel = typeof data.prize?.label === "string" ? data.prize.label : "Prêmio";
      const prizeIndex = Math.max(
        0,
        PRIZES.findIndex((p) => p.label === prizeLabel),
      );
      const extraRotations = 5 + Math.floor(Math.random() * 5);
      const idx = prizeIndex >= 0 ? prizeIndex : 0;
      setRotation(extraRotations * 360 + (360 - (idx * sliceAngle + sliceAngle / 2)));
      setTimeout(() => {
        setIsSpinning(false);
        setWinner({ value: Number(data.prize?.value) || 0, label: prizeLabel, color: "#A3E635" });
        setShowResult(true);
        onSpinComplete({
          extraRemaining: Number(data.extraRemaining) || 0,
          alreadySpun: Boolean(data.alreadySpun),
          prizeLabel,
        });
        toast.success(`Você ganhou ${prizeLabel}!`);
      }, 4000);
    } catch {
      setIsSpinning(false);
      toast.error("Erro de conexão.");
    }
  };

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
            className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-surface p-6 text-center"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 z-10 rounded-full bg-background/50 p-2 text-muted"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-black tracking-tight text-primary uppercase">Roleta Diária</h2>
            <p className="mb-6 text-xs text-muted">Tente a sua sorte e ganhe prêmios em dinheiro!</p>
            <div className="relative mx-auto mb-8 aspect-square w-full max-w-[280px]">
              <div className="absolute -top-2 left-1/2 z-20 -translate-x-1/2 text-primary">
                <div className="h-6 w-6 rotate-45 border-r-4 border-b-4 border-primary bg-primary" />
              </div>
              <motion.div
                animate={{ rotate: rotation }}
                transition={{ duration: 4, ease: [0.15, 0, 0.15, 1] }}
                className="relative h-full w-full overflow-hidden rounded-full border-8 border-surface"
                style={{
                  background:
                    "conic-gradient(from 0deg, " +
                    PRIZES.map((p, i) => `${p.color} ${i * sliceAngle}deg ${(i + 1) * sliceAngle}deg`).join(", ") +
                    ")",
                }}
              >
                <div className="absolute inset-[35%] z-10 flex items-center justify-center rounded-full border-4 border-border bg-surface">
                  <Disc size={32} className="text-primary opacity-20" />
                </div>
              </motion.div>
            </div>
            {showResult && winner ? (
              <div className="space-y-2 py-2">
                <Trophy className="mx-auto text-primary" size={32} />
                <div className="text-lg font-black text-primary uppercase">Parabéns!</div>
                <div className="text-2xl font-black text-white">Você ganhou {winner.label}</div>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-2 w-full rounded-xl border border-border py-3 text-xs font-bold text-muted"
                >
                  CONTINUAR
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={isSpinning || isAlreadySpun}
                onClick={spin}
                className={`w-full rounded-xl py-4 text-sm font-black tracking-widest uppercase ${
                  isAlreadySpun
                    ? "cursor-not-allowed border border-border bg-muted/20 text-muted"
                    : "bg-primary text-black"
                }`}
              >
                {isSpinning ? "Girando..." : isAlreadySpun ? "Já Resgatado Hoje" : "Girar Roleta"}
              </button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
