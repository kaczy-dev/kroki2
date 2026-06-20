import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";
import { CountUp } from "./CountUp";

interface Props {
  steps: number;
  goal: number;
  size?: number;
  onTap?: () => void;
}

export function AnimatedRing({ steps, goal, size = 280, onTap }: Props) {
  const stroke = 18;
  const radius = (size - stroke) / 2;
  const c = 2 * Math.PI * radius;
  const pct = Math.min(1, steps / Math.max(1, goal));
  const completed = pct >= 1;

  const pulseScale = useMotionValue(1);
  const prevSteps = useRef(steps);

  useEffect(() => {
    if (steps > prevSteps.current && steps > 0) {
      animate(pulseScale, [1, 1.02, 1], { duration: 0.2, ease: "easeOut" });
    }
    prevSteps.current = steps;
  }, [steps, pulseScale]);

  const scale = useTransform(pulseScale, (v) => v);

  return (
    <motion.div
      className="relative grid place-items-center cursor-pointer"
      style={{ width: size, height: size, scale }}
      onTap={onTap}
      whileTap={{ scale: 0.97 }}
    >
      {/* Polish eagle watermark in background */}
      <div
        className="absolute inset-0 grid place-items-center pointer-events-none animate-eagle"
        style={{ fontSize: size * 0.35 }}
      >
        🦅
      </div>

      {/* Ambient glow */}
      <div
        className="absolute rounded-full transition-opacity duration-500"
        style={{
          width: size + 20, height: size + 20,
          background: "radial-gradient(circle, var(--polska-red) 0%, transparent 70%)",
          opacity: pct > 0 ? 0.08 + pct * 0.07 : 0,
        }}
      />

      {/* Background plate — white like top of flag */}
      <div
        className="absolute rounded-full"
        style={{
          width: size, height: size,
          background: "var(--surface)",
          border: "2px solid var(--ink)",
          boxShadow: "4px 4px 0 0 var(--ink), inset 0 2px 12px rgba(0,0,0,0.03)",
        }}
      />

      {/* Completion glow */}
      {completed && (
        <motion.div
          className="absolute rounded-full"
          animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.02, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: size + 4, height: size + 4,
            border: "2px solid var(--success)",
            boxShadow: "0 0 20px 4px var(--success)",
          }}
        />
      )}

      <svg width={size} height={size} className="relative -rotate-90">
        <defs>
          {/* 🇵🇱 Polish flag gradient — white to red */}
          <linearGradient id="ring-pl-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={completed ? "var(--success)" : "#ffffff"} />
            <stop offset="40%" stopColor={completed ? "#6ee7b7" : "#ffa0a0"} />
            <stop offset="100%" stopColor={completed ? "var(--success)" : "var(--polska-red)"} />
          </linearGradient>
          <filter id="ring-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="var(--bg)" strokeWidth={stroke} opacity={0.5}
        />

        {/* Progress — biało-czerwony gradient */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="url(#ring-pl-gradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          filter={pct > 0.5 ? "url(#ring-glow)" : undefined}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ type: "spring", stiffness: 60, damping: 20 }}
        />

        {/* Borders */}
        <circle cx={size / 2} cy={size / 2} r={radius + stroke / 2} fill="none" stroke="var(--ink)" strokeWidth={2} />
        <circle cx={size / 2} cy={size / 2} r={radius - stroke / 2} fill="none" stroke="var(--ink)" strokeWidth={2} />

        {/* Progress dot */}
        {pct > 0.02 && pct < 1 && (
          <circle
            cx={size / 2 + radius * Math.cos(Math.PI * 2 * pct - Math.PI / 2)}
            cy={size / 2 + radius * Math.sin(Math.PI * 2 * pct - Math.PI / 2)}
            r={stroke / 2 + 2}
            fill="var(--polska-red)"
            stroke="var(--ink)"
            strokeWidth={2}
          />
        )}
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-[10px] font-display tracking-widest text-muted uppercase"
          >
            Kroki
          </motion.div>
          <CountUp
            value={steps}
            className="block font-display text-[52px] sm:text-6xl tracking-tighter text-ink tabular-nums leading-none mt-1"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-2.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
            style={{
              background: `linear-gradient(135deg, var(--polska-white) 0%, color-mix(in srgb, var(--polska-red) 15%, var(--surface)) 100%)`,
              border: "1.5px solid var(--ink)",
            }}
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-polska-red" />
            <span className="font-display text-[11px]">{Math.round(pct * 100)}%</span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
