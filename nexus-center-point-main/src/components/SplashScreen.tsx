import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import nexusMark from "@/assets/nexus-mark.png.asset.json";

export function SplashScreen() {
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    const t = setTimeout(() => setVisible(false), 1400);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 bg-[#05070A]"
        >
          <motion.img
            src={nexusMark.url}
            alt="Nexus Tech"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-20 w-20 object-contain"
          />
          <span className="text-xs font-black uppercase tracking-[0.4em] text-foreground">
            Nexus Tech
          </span>
          <div className="h-0.5 w-24 overflow-hidden rounded-full bg-border">
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              className="h-full w-1/2 rounded-full bg-primary"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
