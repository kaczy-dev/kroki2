import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { useStepContext } from "@/context/StepProvider";
import { StatsChart } from "@/components/StatsChart";
import { CountUp } from "@/components/CountUp";
import { PageTransition } from "@/components/PageTransition";
import { YearHeatmap } from "@/components/YearHeatmap";

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "KROKI — Statystyki" },
      { name: "description", content: "Twoja historia kroków, średnia, rekord i seria." },
    ],
  }),
  component: StatsPage,
});

function StatsPage() {
  const ctx = useStepContext();
  const todayKey = new Date().toISOString().slice(0, 10);

  const headline = [
    { label: "ŁĄCZNIE", value: ctx.lifetimeSteps, suffix: "kroków" },
    { label: "SERIA", value: ctx.streak, suffix: "dni z celem" },
    { label: "DYSTANS", value: (ctx.lifetimeSteps * (ctx.stepLength / 100)) / 1000, suffix: "km łącznie", format: (n: number) => n.toFixed(1) },
  ];

  // Week comparison: this week vs last week
  const weekComparison = useMemo(() => {
    const map = new Map<string, number>();
    ctx.history.forEach((h) => map.set(h.date, h.steps));
    map.set(todayKey, ctx.stepsToday);

    let thisWeek = 0;
    let lastWeek = 0;
    const today = new Date();
    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay(); // Mon=1, Sun=7

    for (let i = 0; i < dayOfWeek; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      thisWeek += map.get(k) ?? 0;
    }
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - dayOfWeek - i);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      lastWeek += map.get(k) ?? 0;
    }

    const diff = thisWeek - lastWeek;
    const diffPct = lastWeek > 0 ? Math.round((diff / lastWeek) * 100) : 0;
    return { thisWeek, lastWeek, diff, diffPct };
  }, [ctx.history, ctx.stepsToday, todayKey]);

  return (
    <PageTransition>
    <div className="min-h-dvh bg-bg text-ink">
      <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur-xl border-b border-ink/8">
        <div className="mx-auto max-w-md px-4 py-3">
          <h1 className="font-display text-2xl">Statystyki</h1>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-5 space-y-4 pb-28">
        <div className="grid grid-cols-3 gap-3">
          {headline.map((h, i) => (
            <motion.div
              key={h.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="brut-card p-3"
            >
              <div className="text-[9px] font-display text-muted">{h.label}</div>
              <CountUp
                value={h.value}
                format={h.format}
                className="block font-display text-2xl tabular-nums leading-tight mt-1"
              />
              <div className="text-[9px] font-mono text-ink/70 mt-1">{h.suffix}</div>
            </motion.div>
          ))}
        </div>

        {/* Week comparison */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="brut-card p-4"
        >
          <h2 className="text-base mb-3">Ten tydzień vs poprzedni</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="brut-border bg-bg p-3 text-center">
              <div className="text-[9px] font-display text-muted">TEN TYDZIEŃ</div>
              <div className="font-display text-xl tabular-nums mt-1">
                {weekComparison.thisWeek.toLocaleString("pl-PL")}
              </div>
            </div>
            <div className="brut-border bg-bg p-3 text-center">
              <div className="text-[9px] font-display text-muted">POPRZEDNI</div>
              <div className="font-display text-xl tabular-nums mt-1">
                {weekComparison.lastWeek.toLocaleString("pl-PL")}
              </div>
            </div>
          </div>
          {weekComparison.lastWeek > 0 && (
            <div className={`mt-3 text-center font-display text-sm ${weekComparison.diff >= 0 ? "text-success" : "text-accent"}`}>
              {weekComparison.diff >= 0 ? "↑" : "↓"} {Math.abs(weekComparison.diff).toLocaleString("pl-PL")} ({weekComparison.diff >= 0 ? "+" : ""}{weekComparison.diffPct}%)
            </div>
          )}
        </motion.div>

        <StatsChart
          history={ctx.history}
          todayKey={todayKey}
          todaySteps={ctx.stepsToday}
          goal={ctx.goal}
        />

        <div className="brut-card p-4">
          <h2 className="text-base mb-3">Ten tydzień vs cel</h2>
          <div className="space-y-2">
            {ctx.last7.map((d) => {
              const pct = Math.min(100, (d.steps / Math.max(1, ctx.goal)) * 100);
              const hit = d.steps >= ctx.goal;
              const dt = new Date(d.date + "T00:00:00");
              const label = dt.toLocaleDateString("pl-PL", { weekday: "short", day: "numeric", month: "short" });
              return (
                <div key={d.date} className="flex items-center gap-2">
                  <div className="w-24 text-[10px] font-mono uppercase">{label}</div>
                  <div className="flex-1 brut-border bg-bg h-5 relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full"
                      style={{ background: hit ? "var(--accent)" : "var(--surface)" }}
                    />
                  </div>
                  <div className="w-14 text-right font-mono text-xs tabular-nums">
                    {d.steps.toLocaleString("pl-PL")}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Year heatmap */}
        <YearHeatmap
          history={ctx.history}
          todayKey={todayKey}
          todaySteps={ctx.stepsToday}
          goal={ctx.goal}
        />
      </main>
    </div>
    </PageTransition>
  );
}
