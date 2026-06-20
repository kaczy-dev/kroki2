import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface Props {
  open: boolean;
  date: string;
  currentSteps: number;
  onSave: (date: string, steps: number) => void;
  onClose: () => void;
}

export function EditHistoryModal({ open, date, currentSteps, onSave, onClose }: Props) {
  const [value, setValue] = useState(currentSteps);

  const dateLabel = new Date(date + "T00:00:00").toLocaleDateString("pl-PL", {
    weekday: "long", day: "numeric", month: "long"
  });

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-ink/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed inset-x-4 top-1/3 z-[61] mx-auto max-w-sm bg-bg border-2 border-ink rounded-2xl p-5 shadow-lg"
          >
            <h3 className="font-display text-sm text-center">Edytuj dzień</h3>
            <p className="text-center font-mono text-[10px] text-muted mt-1">{dateLabel}</p>

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => setValue(Math.max(0, value - 500))}
                className="w-10 h-10 grid place-items-center rounded-xl border-2 border-ink font-display text-lg active:scale-90"
              >
                −
              </button>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(Math.max(0, Number(e.target.value)))}
                className="flex-1 text-center font-display text-2xl tabular-nums bg-surface border-2 border-ink rounded-xl py-2 focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
              <button
                onClick={() => setValue(value + 500)}
                className="w-10 h-10 grid place-items-center rounded-xl border-2 border-ink font-display text-lg active:scale-90"
              >
                +
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={onClose}
                className="py-2.5 rounded-xl border-2 border-ink font-display text-[11px] active:scale-95"
              >
                Anuluj
              </button>
              <button
                onClick={() => { onSave(date, value); onClose(); }}
                className="py-2.5 rounded-xl bg-accent border-2 border-accent text-white font-display text-[11px] active:scale-95"
              >
                Zapisz
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
