import { motion } from "framer-motion";
import { useMemo } from "react";

interface Props {
  steps: number;
  stepLengthCm: number;
}

interface FunFact {
  maxMeters: number;
  emoji: string;
  text: string;
}

// Polskie miejsca i dystanse (w metrach)
const POLISH_FACTS: FunFact[] = [
  { maxMeters: 100, emoji: "🏠", text: "Jak z kuchni do lodówki... 47 razy" },
  { maxMeters: 250, emoji: "🚶", text: "Długość Złotych Tarasów!" },
  { maxMeters: 500, emoji: "🌉", text: "Jak przejść Most Poniatowskiego" },
  { maxMeters: 1000, emoji: "🏰", text: "Trasa Królewska — Zamek → Łazienki!" },
  { maxMeters: 2000, emoji: "🏙️", text: "Jak z Dworca Centralnego na Starówkę" },
  { maxMeters: 3000, emoji: "🌳", text: "Okrążenie Parku Łazienkowskiego!" },
  { maxMeters: 5000, emoji: "⚽", text: "50 okrążeń boiska piłkarskiego!" },
  { maxMeters: 7500, emoji: "🏔️", text: "Wejście na Kasprowy Wierch!" },
  { maxMeters: 10000, emoji: "🗼", text: "Jak 43× Pałac Kultury na wysokość!" },
  { maxMeters: 15000, emoji: "🚂", text: "Jak z Krakowa na Wawel... 15 razy!" },
  { maxMeters: 20000, emoji: "🏃", text: "Pół maratonu! Szacunek!" },
  { maxMeters: 30000, emoji: "🗺️", text: "Jak z Warszawy do Grodziska!" },
  { maxMeters: 42195, emoji: "🏅", text: "MARATON! Biało-czerwona legenda!" },
  { maxMeters: 50000, emoji: "🦅", text: "Jak orzeł przelot nad Puszczą Białowieską!" },
  { maxMeters: Infinity, emoji: "🚀", text: "Nie do zatrzymania! Polska GÓRA!" },
];

export function DistanceFunFact({ steps, stepLengthCm }: Props) {
  const fact = useMemo(() => {
    if (steps === 0) return null;
    const meters = (steps * stepLengthCm) / 100;
    // Find the fact whose max is closest to but >= current meters
    for (const f of POLISH_FACTS) {
      if (meters <= f.maxMeters) return { ...f, meters };
    }
    return { ...POLISH_FACTS[POLISH_FACTS.length - 1], meters };
  }, [steps, stepLengthCm]);

  if (!fact) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface/50 border border-ink/6"
    >
      <span className="text-base">{fact.emoji}</span>
      <span className="text-[10px] font-mono text-ink/60 leading-snug">{fact.text}</span>
    </motion.div>
  );
}
