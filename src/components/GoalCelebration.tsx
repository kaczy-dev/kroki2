import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback } from "react";

interface Props {
  show: boolean;
  steps: number;
  goal: number;
  onDismiss: () => void;
}

// Floating particle component
function Particle({ delay, x }: { delay: number; x: number }) {
  return (
    <motion.div
      className="absolute text-2xl pointer-events-none"
      initial={{ opacity: 0, y: 0, x, scale: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: [0, -80, -160, -200],
        x: [x, x + (Math.random() - 0.5) * 60],
        scale: [0, 1.2, 1, 0.8],
        rotate: [0, Math.random() * 30 - 15],
      }}
      transition={{ duration: 2, delay, ease: "easeOut" }}
    >
      {["✨", "⭐", "🌟", "💫", "🎯"][Math.floor(Math.random() * 5)]}
    </motion.div>
  );
}

export function GoalCelebration({ show, steps, goal, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);

  const dismiss = useCallback(() => {
    setVisible(false);
    onDismiss();
  }, [onDismiss]);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(dismiss, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, dismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onClick={dismiss}
        >
          {/* Backdrop with Polish red gradient */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              background: "radial-gradient(circle at 50% 40%, rgba(220, 20, 60, 0.2) 0%, rgba(0,0,0,0.85) 100%)",
            }}
          />

          {/* Floating particles */}
          <div className="absolute inset-0 flex justify-center items-center overflow-hidden">
            {Array.from({ length: 12 }).map((_, i) => (
              <Particle key={i} delay={0.1 + i * 0.12} x={(i - 6) * 25} />
            ))}
          </div>

          {/* Main card */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 250, damping: 18, delay: 0.1 }}
            className="relative brut-card p-8 text-center mx-6 max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Trophy animation */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.3 }}
              className="text-7xl mb-3"
            >
              🦅
            </motion.div>

            {/* Title — POLSKA GÓRA! */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="font-display text-2xl text-polska-red"
            >
              POLSKA GÓRA!
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="font-display text-sm text-ink/70 mt-1"
            >
              Cel osiągnięty! 🇵🇱🇵🇱🇵🇱
            </motion.p>

            {/* Steps display */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-3 font-mono text-xl tabular-nums text-ink/80"
            >
              {steps.toLocaleString("pl-PL")} <span className="text-muted text-sm">/ {goal.toLocaleString("pl-PL")}</span>
            </motion.div>

            {/* CTA button */}
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              onClick={dismiss}
              className="mt-5 brut-border press bg-polska-red text-surface font-display text-sm px-6 py-2.5 inline-block"
            >
              BIAŁO-CZERWONI! 🇵🇱
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
