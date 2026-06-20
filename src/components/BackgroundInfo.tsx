import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface Props {
  sensorActive: boolean;
  wakeLockActive: boolean;
}

export function BackgroundInfo({ sensorActive, wakeLockActive }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!sensorActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-lg border border-ink/8 bg-surface/50 overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
        data-compact
      >
        <span className="text-sm">
          {wakeLockActive ? "🟢" : "🟡"}
        </span>
        <span className="flex-1 text-[10px] font-mono text-muted">
          {wakeLockActive
            ? "Ekran aktywny — liczenie działa"
            : "Ekran może zgasnąć — włącz Wake Lock"}
        </span>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          className="text-[10px] text-muted"
        >
          ▼
        </motion.span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="px-3 pb-3"
          >
            <div className="text-[9px] font-mono text-muted/80 space-y-1.5 leading-relaxed">
              <p className="flex items-start gap-1.5">
                <span>📱</span>
                <span>Trzymaj apkę na wierzchu dla najlepszych wyników</span>
              </p>
              <p className="flex items-start gap-1.5">
                <span>🔋</span>
                <span>Niektóre telefony wyłączają sensor w tle — to normalne</span>
              </p>
              <p className="flex items-start gap-1.5">
                <span>💡</span>
                <span>Włącz "Ekran aktywny" w ustawieniach aby ekran nie gasł</span>
              </p>
              <p className="flex items-start gap-1.5">
                <span>🦅</span>
                <span>Gdy wrócisz, szacujemy kroki w tle na podstawie tempa</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
