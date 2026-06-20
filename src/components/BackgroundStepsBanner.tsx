import { motion, AnimatePresence } from "framer-motion";

interface Props {
  backgroundSteps: number;
  onAccept: () => void;
  onDismiss: () => void;
}

export function BackgroundStepsBanner({ backgroundSteps, onAccept, onDismiss }: Props) {
  if (backgroundSteps === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="brut-card p-4 polska-stripe"
      >
        <div className="flex items-start gap-3">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-2xl shrink-0 mt-0.5"
          >
            🚶
          </motion.div>
          <div className="flex-1 min-w-0">
            <div className="font-display text-[12px]">Kroki w tle!</div>
            <div className="text-[10px] font-mono text-muted mt-0.5">
              Szacujemy ~{backgroundSteps.toLocaleString("pl-PL")} kroków gdy app była w tle.
              Dodać je?
            </div>
            <div className="flex gap-2 mt-2.5">
              <button
                onClick={onAccept}
                className="flex-1 bg-success/15 border border-success/30 text-success font-display text-[10px] py-2 rounded-lg active:scale-95 transition-transform"
              >
                ✓ Dodaj +{backgroundSteps.toLocaleString("pl-PL")}
              </button>
              <button
                onClick={onDismiss}
                className="flex-1 bg-surface border border-ink/10 text-muted font-display text-[10px] py-2 rounded-lg active:scale-95 transition-transform"
              >
                ✗ Odrzuć
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
