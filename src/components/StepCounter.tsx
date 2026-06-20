import { useEffect, useState } from "react";

interface Props {
  steps: number;
  goal: number;
}

export function StepCounter({ steps, goal }: Props) {
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    setPulse((p) => p + 1);
  }, [steps]);

  const pct = Math.min(100, (steps / Math.max(1, goal)) * 100);

  return (
    <div className="brut-card p-6 sm:p-8">
      <div className="flex items-center justify-between text-xs font-display">
        <span className="bg-ink text-bg px-2 py-1">KROKI / DZIŚ</span>
        <span className="font-mono">{pct.toFixed(0)}%</span>
      </div>
      <div
        key={pulse}
        className="mt-4 animate-step-pulse font-display text-[22vw] sm:text-[140px] leading-none tracking-tighter text-ink"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {steps.toLocaleString("pl-PL").padStart(5, "0")}
      </div>
      <div className="mt-4 brut-border bg-bg h-5 relative overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-accent transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs font-mono">
        <span>0</span>
        <span className="font-display">CEL {goal.toLocaleString("pl-PL")}</span>
      </div>
    </div>
  );
}
