import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useStepContext } from "@/context/StepProvider";
import { StatsChart } from "@/components/StatsChart";
import { CountUp } from "@/components/CountUp";
import { PageTransition } from "@/components/PageTransition";
import { YearHeatmap } from "@/components/YearHeatmap";
import { EditHistoryModal } from "@/components/EditHistoryModal";

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
  const [editDay, setEditDay] = useState<{ date: string; steps: number } | null>(null);

  const headline = [
    { label: "ŁĄCZNIE", value: ctx.lifetimeSteps, suffix: "kroków" },
    { label: "SERIA", value: ctx.streak, suffix: "dni" },
    { label: "KM", value: (ctx.lifetimeSteps * (ctx.stepLength / 100)) / 1000, suffix: "łącznie", format: (n: number) => n.toFixed(1) },
  ];

  const weekComparison = useMemo(() => {
    const map = new Map<string, number>();
    ctx.history.forEach((h) => map.set(h.date, h.steps));
    map.set(todayKey, ctx.stepsToday);
    let thisWeek = 0, lastWeek = 0;
    const today = new Date();
    const dow = today.getDay() === 0 ? 7 : today.getDay();
    for (let i = 0; i < dow; i++) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      thisWeek += map.get(k) ?? 0;
    }
    for (let i = 0; i < 7; i++) {
      const d = new Date(today); d.setDate(d.getDate() - dow - i);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      lastWeek += map.get(k) ?? 0;
    }
    const diff = thisWeek - lastWeek;
    const diffPct = lastWeek > 0 ? Math.round((diff / lastWeek) * 100) : 0;
    return { thisWeek, lastWeek, diff, diffPct };
  }, [ctx.history, ctx.stepsToday, todayKey]);

  // Best day ever
  const bestDay = useMemo(() => {
    if (ctx.history.length === 0) return null;
    return ctx.history.reduce((best, h) => h.steps > best.steps ? h : best, ctx.history[0]);
  }, [ctx.history]);

  return (
    <PageTransition>
    <div className="min-h-dvh bg-bg text-ink">
      <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur-xl border-b border-ink/8">
        <div className="mx-auto max-w-md px-4 py-2.5">
          <h1 className="font-display text-xl">Statystyki</h1>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-4 space-y-4 pb-24">
        {/* Headline stats */}
        <div className="grid grid-cols-3 gap-2">
          {headline.map((h, i) => (
            <motion.div
              key={h.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="brut-card p-2.5 text-center"
            >
              <div className="text-[8px] font-display text-muted">{h.label}</div>
              <CountUp value={h.value} format={h.format} className="block font-display text-xl tabular-nums leading-tight mt-0.5" />
              <div className="text-[8px] font-mono text-ink/50 mt-0.5">{h.suffix}</div>
            </motion.div>
          ))}
        </div>

        {/* Week comparison (compact) */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="brut-card p-3">
          <div className="flex items-center justify-between">
            <div className="text-[9px] font-display text-muted">TEN TYDZIEŃ</div>
            <div className="font-display text-base tabular-nums">{weekComparison.thisWeek.toLocaleString("pl-PL")}</div>
          </div>
          {weekComparison.lastWeek > 0 && (
            <div className={`text-right text-[10px] font-mono mt-0.5 ${weekComparison.diff >= 0 ? "text-success" : "text-accent"}`}>
              {weekComparison.diff >= 0 ? "↑" : "↓"} {Math.abs(weekComparison.diff).toLocaleString("pl-PL")} vs prev ({weekComparison.diff >= 0 ? "+" : ""}{weekComparison.diffPct}%)
            </div>
          )}
        </motion.div>

        {/* Best day */}
        {bestDay && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-warning/10 border border-warning/20">
            <span className="text-base">👑</span>
            <span className="text-[10px] font-mono text-ink/70">
              Rekord: {bestDay.steps.toLocaleString("pl-PL")} kr. ({new Date(bestDay.date + "T00:00:00").toLocaleDateString("pl-PL", { day: "numeric", month: "short" })})
            </span>
          </div>
        )}

        {/* Chart */}
        <StatsChart history={ctx.history} todayKey={todayKey} todaySteps={ctx.stepsToday} goal={ctx.goal} />

        {/* Week vs goal — tap to edit! */}
        <div className="brut-card p-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display text-[11px]">Tydzień vs cel</h2>
            <span className="text-[8px] font-mono text-muted">tap = edytuj</span>
          </div>
          <div className="space-y-1.5">
            {ctx.last7.map((d) => {
              const pct = Math.min(100, (d.steps / Math.max(1, ctx.goal)) * 100);
              const hit = d.steps >= ctx.goal;
              const isToday = d.date === todayKey;
              const dt = new Date(d.date + "T00:00:00");
              const label = dt.toLocaleDateString("pl-PL", { weekday: "short", day: "numeric" });
              return (
                <motion.div
                  key={d.date}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => !isToday && setEditDay({ date: d.date, steps: d.steps })}
                  className={`flex items-center gap-2 ${!isToday ? "cursor-pointer" : ""}`}
                >
                  <div className="w-14 text-[9px] font-mono uppercase text-ink/60">{label}</div>
                  <div className="flex-1 h-4 rounded-sm bg-bg border border-ink/10 relative overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-sm"
                      style={{ background: hit ? "var(--accent)" : "var(--ink)", opacity: hit ? 1 : 0.15 }}
                    />
                  </div>
                  <div className="w-12 text-right font-mono text-[9px] tabular-nums text-ink/70">
                    {d.steps >= 1000 ? `${(d.steps / 1000).toFixed(1)}k` : d.steps}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Year heatmap */}
        <YearHeatmap history={ctx.history} todayKey={todayKey} todaySteps={ctx.stepsToday} goal={ctx.goal} />
      </main>

      {/* Edit history modal */}
      <EditHistoryModal
        open={editDay !== null}
        date={editDay?.date ?? ""}
        currentSteps={editDay?.steps ?? 0}
        onSave={ctx.editHistoryDay}
        onClose={() => setEditDay(null)}
      />
    </div>
    </PageTransition>
  );
}
