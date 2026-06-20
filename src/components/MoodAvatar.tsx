import { motion } from "framer-motion";
import { useMemo } from "react";

interface Props {
  steps: number;
  goal: number;
}

interface MoodLevel {
  emoji: string;
  label: string;
  animation: { rotate?: number[]; y?: number[]; x?: number[]; scale?: number[] };
}

const MOOD_LEVELS: MoodLevel[] = [
  { emoji: "🛋️", label: "Ziemniak mode", animation: { rotate: [0, -2, 2, 0] } },
  { emoji: "🥱", label: "Dopiero się rozkręcam", animation: { y: [0, -2, 0] } },
  { emoji: "🚶", label: "Normalka", animation: { x: [0, 2, -2, 0] } },
  { emoji: "🏃", label: "Machina!", animation: { x: [0, 3, -3, 0], y: [0, -2, 0] } },
  { emoji: "🦅", label: "Orzeł Biały mode!", animation: { y: [0, -5, 0], scale: [1, 1.1, 1] } },
  { emoji: "⚔️", label: "HUSARIA!!!", animation: { rotate: [0, -5, 5, 0], scale: [1, 1.15, 1] } },
];

export function MoodAvatar({ steps, goal }: Props) {
  const { mood, pct } = useMemo(() => {
    const p = steps / Math.max(1, goal);
    let idx: number;
    if (p === 0) idx = 0;
    else if (p < 0.25) idx = 1;
    else if (p < 0.5) idx = 2;
    else if (p < 0.75) idx = 3;
    else if (p < 1) idx = 4;
    else idx = 5;
    return { mood: MOOD_LEVELS[idx], pct: p };
  }, [steps, goal]);

  return (
    <motion.div
      className="brut-card p-3 flex items-center gap-3 polska-stripe"
      whileTap={{ scale: 0.97 }}
    >
      <motion.div
        animate={mood.animation}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="text-3xl shrink-0"
      >
        {mood.emoji}
      </motion.div>
      <div className="flex-1 min-w-0">
        <div className="font-display text-[11px] tracking-wide">{mood.label}</div>
        <div className="text-[9px] font-mono text-muted mt-0.5">
          {pct >= 1.5 ? "Nie do zatrzymania!" :
           pct >= 1 ? "Cel zaliczony! 🇵🇱" :
           `Do celu: ${(goal - steps).toLocaleString("pl-PL")} kr.`}
        </div>
      </div>
      {pct >= 1 && (
        <motion.span
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="text-lg"
        >
          🏆
        </motion.span>
      )}
    </motion.div>
  );
}
