"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, ArrowRight, Gift } from "lucide-react";

export function MissionFAB() {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const router = useRouter();

  const handleFabClick = () => {
    if (!isExpanded) setIsExpanded(true);
    else setIsModalOpen(true);
  };

  return (
    <>
      <motion.div
        layout
        initial={false}
        animate={{ x: isExpanded ? 0 : 35 }}
        className="fixed right-0 bottom-24 z-[60] flex items-center"
      >
        <div className="relative flex items-center">
          <AnimatePresence>
            {isExpanded && (
              <motion.button
                initial={{ opacity: 0, scale: 0.5, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.5, x: 10 }}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(false);
                }}
                className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-muted backdrop-blur-sm transition-colors hover:text-foreground"
              >
                <X size={14} />
              </motion.button>
            )}
          </AnimatePresence>

          <motion.button
            type="button"
            onClick={handleFabClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-14 w-14 items-center justify-center rounded-l-full bg-primary text-black shadow-lg shadow-primary/20 sm:mr-6 sm:rounded-full"
          >
            <Trophy size={28} />
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 rounded-full p-2 text-muted transition-colors hover:bg-white/5 hover:text-foreground"
              >
                <X size={20} />
              </button>
              <div className="flex flex-col items-center space-y-4 pt-4 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
                  <Gift size={40} className="text-primary" />
                </div>
                <h3 className="text-xl font-black tracking-tight text-foreground uppercase italic">
                  Suas Missões te esperam!
                </h3>
                <p className="px-4 text-sm leading-relaxed text-muted">
                  Complete desafios simples e ganhe prêmios em dinheiro toda semana.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    router.push("/missions");
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-sm font-black text-black"
                >
                  VER MISSÕES
                  <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
