import { memo } from "react";
import { motion } from "framer-motion";
import { CountUp } from "./CountUp";
import { useStepContext } from "@/context/StepProvider";

interface Props {
  steps: number;
  cadence: number;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

export const MetricsGrid = memo(function MetricsGrid({ steps, cadence }: Props) {
  const { stepLength, regularity } = useStepContext();
  const km = (steps * (stepLength / 100)) / 1000;
  const kcal = steps * 0.04;
  const activeMin = Math.round(steps / 100);

  const tiles = [
    { label: "DYSTANS", value: km, unit: "km", format: (n: number) => n.toFixed(2), icon: "📍" },
    { label: "KALORIE", value: kcal, unit: "kcal", format: (n: number) => Math.round(n).toString(), icon: "🔥" },
    { label: "TEMPO", value: cadence, unit: "kr/min", format: (n: number) => Math.round(n).toString(), icon: "⚡" },
    { label: "CZAS", value: activeMin, unit: "min", format: (n: number) => Math.round(n).toString(), icon: "⏱" },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-4 gap-2">
      {tiles.map((t) => (
        <motion.div
          key={t.label}
          variants={item}
          whileTap={{ scale: 0.95 }}
          className="brut-card p-2.5 text-center"
        >
          <div className="text-base mb-0.5">{t.icon}</div>
          <CountUp
            value={t.value}
            format={t.format}
            className="block font-display text-base text-ink tabular-nums leading-none"
          />
          <div className="mt-0.5 text-[8px] font-mono text-muted">{t.unit}</div>
        </motion.div>
      ))}

      {/* Regularity bar — only when walking */}
      {cadence > 0 && (
        <motion.div variants={item} className="col-span-4 bg-surface rounded-lg border border-ink/10 p-2 flex items-center gap-2">
          <span className="text-[9px] font-display text-muted">CHÓD</span>
          <div className="flex-1 h-1.5 rounded-full bg-ink/10 overflow-hidden">
            <motion.div
              animate={{ width: `${regularity * 100}%` }}
              transition={{ duration: 0.4 }}
              className="h-full rounded-full"
              style={{
                background: regularity > 0.7 ? "var(--success)" : regularity > 0.4 ? "var(--warning)" : "var(--accent)",
              }}
            />
          </div>
          <span className="text-[9px] font-mono text-ink/60 tabular-nums w-7 text-right">{Math.round(regularity * 100)}%</span>
        </motion.div>
      )}
    </motion.div>
  );
});
