import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, ArrowRight, Gift } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

export function MissionFAB() {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const navigate = useNavigate();

  const handleFabClick = () => {
    if (!isExpanded) {
      setIsExpanded(true);
    } else {
      setIsModalOpen(true);
    }
  };

  const handleCloseExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(false);
  };

  const handleCloseModal = () => setIsModalOpen(false);
  
  const handleGoToMissions = () => {
    setIsModalOpen(false);
    navigate({ to: '/app/missions' });
  };

  return (
    <>
      {/* Floating Action Button - Peek/Peek state */}
      <motion.div
        layout
        initial={false}
        animate={{
          x: isExpanded ? 0 : 35, // Partially hidden when not expanded
        }}
        className="fixed bottom-24 right-0 z-[60] flex items-center"
      >
        <div className="relative flex items-center">
          {/* Close expanded button */}
          <AnimatePresence>
            {isExpanded && (
              <motion.button
                initial={{ opacity: 0, scale: 0.5, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.5, x: 10 }}
                onClick={handleCloseExpanded}
                className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-muted backdrop-blur-sm transition-colors hover:text-foreground active:scale-90"
              >
                <X size={14} />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Main FAB */}
          <motion.button
            onClick={handleFabClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-14 w-14 items-center justify-center rounded-l-full bg-primary text-black shadow-lg shadow-primary/20 transition-all sm:rounded-full sm:mr-6"
            style={{ 
              borderTopRightRadius: isExpanded ? '9999px' : '0',
              borderBottomRightRadius: isExpanded ? '9999px' : '0',
              marginRight: isExpanded ? '24px' : '0'
            }}
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Trophy size={28} />
            </motion.div>
          </motion.button>
        </div>
      </motion.div>

      {/* Modal Popup */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-2xl"
            >
              <button
                onClick={handleCloseModal}
                className="absolute right-4 top-4 rounded-full p-2 text-muted hover:bg-white/5 hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col items-center text-center space-y-4 pt-4">
                <div className="relative">
                  <div className="absolute inset-0 animate-pulse rounded-full bg-primary/20 blur-xl" />
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                    <Gift size={40} className="text-primary" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-black italic text-foreground uppercase tracking-tight">
                    Suas Missões te esperam!
                  </h3>
                  <p className="text-sm text-muted leading-relaxed px-4">
                    Complete desafios simples e ganhe prêmios em dinheiro toda semana.
                  </p>
                </div>

                <div className="flex w-full flex-col gap-3 pt-2">
                  <button
                    onClick={handleGoToMissions}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-sm font-black text-black transition-all active:scale-[0.98] hover:shadow-lg hover:shadow-primary/20"
                  >
                    VER MISSÕES
                    <ArrowRight size={16} />
                  </button>
                  <button
                    onClick={handleCloseModal}
                    className="w-full py-2 text-xs font-bold text-muted hover:text-foreground transition-colors"
                  >
                    Agora não
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}