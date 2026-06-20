import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";
import { CountUp } from "./CountUp";

interface Props {
  steps: number;
  goal: number;
  size?: number;
}

export function AnimatedRing({ steps, goal, size = 280 }: Props) {
  const stroke = 18;
  const radius = (size - stroke) / 2;
  const c = 2 * Math.PI * radius;
  const pct = Math.min(1, steps / Math.max(1, goal));
  const completed = pct >= 1;

  // Smooth pulse on step count change
  const pulseScale = useMotionValue(1);
  const prevSteps = useRef(steps);

  useEffect(() => {
    if (steps > prevSteps.current && steps > 0) {
      animate(pulseScale, [1, 1.02, 1], { duration: 0.2, ease: "easeOut" });
    }
    prevSteps.current = steps;
  }, [steps, pulseScale]);

  const scale = useTransform(pulseScale, (v) => v);

  // Gradient rotation for active state
  const gradientId = "ring-gradient";
  const glowId = "ring-glow";

  return (
    <motion.div
      className="relative grid place-items-center"
      style={{ width: size, height: size, scale }}
    >
      {/* Outer glow — subtle ambient */}
      <div
        className="absolute rounded-full"
        style={{
          width: size + 16, height: size + 16,
          background: completed
            ? "radial-gradient(circle, var(--success) 0%, transparent 70%)"
            : "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
          opacity: pct > 0 ? 0.12 + pct * 0.08 : 0,
          transition: "opacity 0.5s ease",
        }}
      />

      {/* Background plate */}
      <div
        className="absolute rounded-full"
        style={{
          width: size, height: size,
          background: "var(--surface)",
          border: "2px solid var(--ink)",
          boxShadow: `
            4px 4px 0 0 var(--ink),
            inset 0 2px 8px rgba(0,0,0,0.04)
          `,
        }}
      />

      {/* Completion glow ring */}
      {completed && (
        <motion.div
          className="absolute rounded-full"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.02, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: size + 4, height: size + 4,
            border: "2px solid var(--success)",
            boxShadow: "0 0 16px 2px var(--success)",
          }}
        />
      )}

      <svg width={size} height={size} className="relative -rotate-90">
        <defs>
          {/* Gradient stroke */}
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={completed ? "var(--success)" : "var(--accent)"} />
            <stop offset="100%" stopColor={completed ? "#6ee7b7" : "#ff8a80"} />
          </linearGradient>
          {/* Glow filter */}
          <filter id={glowId}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track ring (background) */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="var(--bg)" strokeWidth={stroke}
          opacity={0.6}
        />

        {/* Progress arc with gradient */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          filter={pct > 0.5 ? `url(#${glowId})` : undefined}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ type: "spring", stiffness: 60, damping: 20 }}
        />

        {/* Outer border */}
        <circle
          cx={size / 2} cy={size / 2} r={radius + stroke / 2}
          fill="none" stroke="var(--ink)" strokeWidth={2}
        />
        {/* Inner border */}
        <circle
          cx={size / 2} cy={size / 2} r={radius - stroke / 2}
          fill="none" stroke="var(--ink)" strokeWidth={2}
        />

        {/* Progress dot indicator */}
        {pct > 0 && pct < 1 && (
          <motion.circle
            cx={size / 2 + radius * Math.cos(Math.PI * 2 * pct - Math.PI / 2)}
            cy={size / 2 + radius * Math.sin(Math.PI * 2 * pct - Math.PI / 2)}
            r={stroke / 2 + 2}
            fill={completed ? "var(--success)" : "var(--accent)"}
            stroke="var(--ink)"
            strokeWidth={2}
            initial={false}
            animate={{ r: stroke / 2 + 2 }}
            className="-rotate-90"
            style={{ transformOrigin: "center" }}
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
            className="mt-2.5 inline-flex items-center gap-1.5 bg-ink/90 text-bg font-display text-[11px] px-2.5 py-1 rounded-full"
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: completed ? "var(--success)" : "var(--accent)" }} />
            {Math.round(pct * 100)}%
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
