import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";
import type { HistoryEntry } from "@/hooks/useLocalHistory";

interface Props {
  stepsToday: number;
  history: HistoryEntry[];
}

export function DailyRecord({ stepsToday, history }: Props) {
  const isNewRecord = useMemo(() => {
    if (stepsToday === 0 || history.length === 0) return false;
    const best = Math.max(...history.map((h) => h.steps));
    return stepsToday > best;
  }, [stepsToday, history]);

  return (
    <AnimatePresence>
      {isNewRecord && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="brut-card p-2.5 flex items-center justify-center gap-2 border-warning"
          style={{ borderColor: "var(--warning)" }}
        >
          <motion.span
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
            className="text-lg"
          >
            👑
          </motion.span>
          <span className="font-display text-[11px] text-warning">NOWY REKORD DNIA!</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
