import { motion } from "framer-motion";
import { memo, useMemo } from "react";

interface Props {
  steps: number;
  goal: number;
}

const MOODS = [
  { emoji: "🛋️", label: "Dotknij ring aby zacząć!", sub: "Tap = start" },
  { emoji: "🥱", label: "Rozkręcam się...", sub: "" },
  { emoji: "🚶", label: "W drodze!", sub: "" },
  { emoji: "🏃", label: "Machina!", sub: "" },
  { emoji: "🦅", label: "Orzeł Biały mode!", sub: "" },
  { emoji: "⚔️", label: "HUSARIA!!!", sub: "Cel zaliczony! 🇵🇱" },
] as const;

export const MoodAvatar = memo(function MoodAvatar({ steps, goal }: Props) {
  const { mood, remaining } = useMemo(() => {
    const p = steps / Math.max(1, goal);
    const idx = steps === 0 ? 0 : p < 0.25 ? 1 : p < 0.5 ? 2 : p < 0.75 ? 3 : p < 1 ? 4 : 5;
    return { mood: MOODS[idx], remaining: Math.max(0, goal - steps) };
  }, [steps, goal]);

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface border border-ink/10"
    >
      <motion.span
        animate={steps > 0 ? { y: [0, -2, 0] } : {}}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="text-2xl shrink-0"
      >
        {mood.emoji}
      </motion.span>
      <div className="flex-1 min-w-0">
        <div className="font-display text-[11px] truncate">{mood.label}</div>
        <div className="text-[9px] font-mono text-muted truncate">
          {mood.sub || (remaining > 0 ? `Do celu: ${remaining.toLocaleString("pl-PL")} kr.` : "Cel osiągnięty! 🏆")}
        </div>
      </div>
    </motion.div>
  );
});
