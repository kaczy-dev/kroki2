import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";
import { CountUp } from "./CountUp";

interface Props {
  steps: number;
  goal: number;
  size?: number;
  onTap?: () => void;
}

export function AnimatedRing({ steps, goal, size = 260, onTap }: Props) {
  const stroke = 16;
  const radius = (size - stroke) / 2;
  const c = 2 * Math.PI * radius;
  const pct = Math.min(1, steps / Math.max(1, goal));
  const completed = pct >= 1;
  const remaining = Math.max(0, goal - steps);

  const pulseScale = useMotionValue(1);
  const prevSteps = useRef(steps);

  useEffect(() => {
    if (steps > prevSteps.current && steps > 0) {
      animate(pulseScale, [1, 1.015, 1], { duration: 0.15, ease: "easeOut" });
    }
    prevSteps.current = steps;
  }, [steps, pulseScale]);

  const scale = useTransform(pulseScale, (v) => v);

  return (
    <motion.div
      className="relative grid place-items-center"
      style={{ width: size, height: size, scale }}
      onTap={onTap}
      whileTap={{ scale: 0.97 }}
    >
      {/* Ambient glow — beer golden or success green */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: size + 24, height: size + 24,
          background: completed
            ? "radial-gradient(circle, var(--success) 0%, transparent 65%)"
            : "radial-gradient(circle, var(--beer) 0%, transparent 65%)",
          opacity: pct > 0 ? 0.06 + pct * 0.08 : 0,
          transition: "opacity 0.6s ease",
        }}
      />

      {/* Background plate */}
      <div
        className="absolute rounded-full"
        style={{
          width: size, height: size,
          background: "var(--surface)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06), inset 0 1px 4px rgba(255,255,255,0.5)",
          border: "1.5px solid color-mix(in srgb, var(--ink) 12%, transparent)",
        }}
      />

      {/* Completion glow ring */}
      {completed && (
        <motion.div
          className="absolute rounded-full pointer-events-none"
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: size + 6, height: size + 6,
            border: "2px solid var(--success)",
            boxShadow: "0 0 16px 3px var(--success)",
          }}
        />
      )}

      <svg width={size} height={size} className="relative -rotate-90">
        <defs>
          <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={completed ? "#34d399" : "var(--beer)"} />
            <stop offset="100%" stopColor={completed ? "#059669" : "var(--polska-red)"} />
          </linearGradient>
          <filter id="arc-glow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="var(--ink)" strokeWidth={stroke} opacity={0.04}
        />

        {/* Progress arc */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="url(#ring-grad)" strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c}
          filter={pct > 0.4 ? "url(#arc-glow)" : undefined}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ type: "spring", stiffness: 50, damping: 18 }}
        />
      </svg>

      {/* Center */}
      <div className="absolute inset-0 grid place-items-center pointer-events-none">
        <div className="text-center">
          <CountUp
            value={steps}
            className="block font-display text-[48px] tracking-tight text-ink tabular-nums leading-none"
          />
          <div className="mt-1.5 text-[10px] font-mono text-muted">
            {completed
              ? <span className="text-success font-display">Cel ✓</span>
              : `brakuje ${remaining.toLocaleString("pl-PL")}`}
          </div>
          <div className="mt-2 inline-flex items-center gap-1 bg-ink/5 rounded-full px-2 py-0.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: completed ? "var(--success)" : "var(--beer)" }} />
            <span className="text-[9px] font-display tabular-nums">{Math.round(pct * 100)}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
