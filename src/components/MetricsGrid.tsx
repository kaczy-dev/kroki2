import { motion } from "framer-motion";
import { CountUp } from "./CountUp";
import { useStepContext } from "@/context/StepProvider";

interface Props {
  steps: number;
  cadence: number;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1 },
};

export function MetricsGrid({ steps, cadence }: Props) {
  const { stepLength, regularity } = useStepContext();
  const km = (steps * (stepLength / 100)) / 1000;
  const kcal = steps * 0.04;
  const activeMin = Math.round(steps / 100);

  const tiles = [
    { label: "DYSTANS", value: km, unit: "km", format: (n: number) => n.toFixed(2), icon: "📍" },
    { label: "KALORIE", value: kcal, unit: "kcal", format: (n: number) => Math.round(n).toLocaleString("pl-PL"), icon: "🔥" },
    { label: "TEMPO", value: cadence, unit: "kr./min", format: (n: number) => Math.round(n).toString(), icon: "⚡" },
    { label: "AKTYWNOŚĆ", value: activeMin, unit: "min", format: (n: number) => Math.round(n).toString(), icon: "⏱" },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-2.5"
    >
      {tiles.map((t) => (
        <motion.div
          key={t.label}
          variants={item}
          whileTap={{ scale: 0.97 }}
          className="brut-card p-3.5 relative overflow-hidden"
        >
          {/* Subtle icon watermark */}
          <span className="absolute -right-1 -bottom-1 text-3xl opacity-[0.06] select-none pointer-events-none">
            {t.icon}
          </span>
          <div className="text-[9px] font-display tracking-wider text-muted">{t.label}</div>
          <CountUp
            value={t.value}
            format={t.format}
            className="mt-1 block font-display text-2xl text-ink tabular-nums leading-none"
          />
          <div className="mt-0.5 text-[9px] font-mono text-ink/50">{t.unit}</div>
        </motion.div>
      ))}

      {/* Walking regularity — animated bar */}
      {cadence > 0 && (
        <motion.div
          variants={item}
          className="col-span-2 brut-card p-3 flex items-center gap-3"
        >
          <div className="flex-1 min-w-0">
            <div className="text-[9px] font-display tracking-wider text-muted">REGULARNOŚĆ CHODU</div>
            <div className="mt-1.5 h-2 rounded-full bg-bg border border-ink/20 relative overflow-hidden">
              <motion.div
                animate={{ width: `${regularity * 100}%` }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className="h-full rounded-full"
                style={{
                  background: regularity > 0.7
                    ? "linear-gradient(90deg, var(--success), #6ee7b7)"
                    : regularity > 0.4
                    ? "linear-gradient(90deg, var(--warning), #fcd34d)"
                    : "linear-gradient(90deg, var(--accent), #ff8a80)",
                }}
              />
            </div>
          </div>
          <div className="font-display text-sm tabular-nums text-ink/80">
            {Math.round(regularity * 100)}%
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
