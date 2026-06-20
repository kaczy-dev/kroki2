import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";

interface Props {
  lifetimeSteps: number;
  streak: number;
  stepLength: number;
}

export function QuickStats({ lifetimeSteps, streak, stepLength }: Props) {
  const totalKm = ((lifetimeSteps * stepLength) / 100 / 1000).toFixed(1);

  return (
    <Link to="/stats" className="block">
      <motion.div
        whileTap={{ scale: 0.98 }}
        className="brut-card p-3 flex items-center justify-between group"
      >
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-[8px] font-display text-muted tracking-wider">ŁĄCZNIE</div>
            <div className="font-display text-sm tabular-nums leading-tight">
              {lifetimeSteps >= 10000 ? `${(lifetimeSteps / 1000).toFixed(0)}k` : lifetimeSteps.toLocaleString("pl-PL")}
            </div>
          </div>
          <div className="w-px h-6 bg-ink/10" />
          <div className="text-center">
            <div className="text-[8px] font-display text-muted tracking-wider">DYSTANS</div>
            <div className="font-display text-sm tabular-nums leading-tight">{totalKm} km</div>
          </div>
          <div className="w-px h-6 bg-ink/10" />
          <div className="text-center">
            <div className="text-[8px] font-display text-muted tracking-wider">SERIA</div>
            <div className="font-display text-sm tabular-nums leading-tight">{streak}d</div>
          </div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted group-hover:text-ink transition-colors">
          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </motion.div>
    </Link>
  );
}
