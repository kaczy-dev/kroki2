import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { useStepContext } from "@/context/StepProvider";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { CHALLENGES } from "@/lib/challenges";
import { PageTransition } from "@/components/PageTransition";

export const Route = createFileRoute("/achievements")({
  head: () => ({
    meta: [
      { title: "KROKI — Odznaki i wyzwania" },
      { name: "description", content: "Odblokowuj odznaki i realizuj wyzwania!" },
    ],
  }),
  component: AchievementsPage,
});

function AchievementsPage() {
  const ctx = useStepContext();
  const unlockedCount = ACHIEVEMENTS.filter((a) => ctx.unlocked.has(a.id)).length;
  const pct = Math.round((unlockedCount / ACHIEVEMENTS.length) * 100);

  const todayKey = new Date().toISOString().slice(0, 10);
  const challengeResults = useMemo(() => {
    return CHALLENGES.map((c) => ({
      ...c,
      result: c.check({
        history: ctx.history,
        todaySteps: ctx.stepsToday,
        todayKey,
        goal: ctx.goal,
      }),
    }));
  }, [ctx.history, ctx.stepsToday, ctx.goal, todayKey]);

  return (
    <PageTransition>
    <div className="min-h-dvh bg-bg text-ink">
      <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur-xl border-b border-ink/8">
        <div className="mx-auto max-w-md px-4 py-3 flex items-end justify-between">
          <h1 className="font-display text-2xl">Odznaki</h1>
          <div className="font-mono text-xs">
            {unlockedCount} / {ACHIEVEMENTS.length} · {pct}%
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-5 pb-28 space-y-6">
        {/* Active Challenges */}
        <section>
          <h2 className="font-display text-lg mb-3">Wyzwania</h2>
          <div className="space-y-3">
            {challengeResults.map((c, i) => {
              const progressPct = Math.min(100, (c.result.progress / Math.max(1, c.result.target)) * 100);
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`brut-card p-4 ${c.result.completed ? "border-success" : ""}`}
                  style={c.result.completed ? { borderColor: "var(--success)" } : undefined}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl shrink-0">{c.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm leading-tight">{c.title}</span>
                        <span className="text-[8px] font-mono brut-border px-1 py-0.5 shrink-0">
                          {c.duration === "week" ? "TYG." : "MIES."}
                        </span>
                        {c.result.completed && (
                          <span className="text-[9px] bg-success text-surface px-1.5 py-0.5 font-display shrink-0">✓</span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-muted mt-0.5">{c.description}</div>
                      {/* Progress bar */}
                      <div className="mt-2 brut-border bg-bg h-3 relative overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPct}%` }}
                          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                          className="h-full"
                          style={{ background: c.result.completed ? "var(--success)" : "var(--accent)" }}
                        />
                      </div>
                      <div className="mt-1 flex justify-between text-[9px] font-mono text-ink/60">
                        <span>{c.result.progress.toLocaleString("pl-PL")}</span>
                        <span>{c.result.target.toLocaleString("pl-PL")}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Achievements grid */}
        <section>
          <h2 className="font-display text-lg mb-3">Wszystkie odznaki</h2>
          <div className="grid grid-cols-2 gap-3">
            {ACHIEVEMENTS.map((a, i) => {
              const unlocked = ctx.unlocked.has(a.id);
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.04, duration: 0.3 }}
                  className={`brut-card p-4 relative overflow-hidden ${unlocked ? "" : "opacity-60"}`}
                  style={unlocked ? { background: "var(--surface)" } : { background: "var(--bg)" }}
                >
                  <div
                    className="text-4xl mb-2"
                    style={{ filter: unlocked ? "none" : "grayscale(1)" }}
                  >
                    {a.icon}
                  </div>
                  <div className="font-display text-sm leading-tight">{a.title}</div>
                  <div className="text-[10px] font-mono text-ink/70 mt-1 leading-snug">
                    {a.description}
                  </div>
                  {unlocked ? (
                    <div className="absolute top-2 right-2 bg-accent text-surface font-display text-[9px] px-1.5 py-0.5">
                      ✓
                    </div>
                  ) : (
                    <div className="absolute top-2 right-2 brut-border bg-bg font-display text-[9px] px-1.5 py-0.5">
                      🔒
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </section>

        <p className="text-center font-mono text-[10px] text-ink/60">
          Odznaki odblokowują się automatycznie. Wyzwania odnawiają się co tydzień/miesiąc.
        </p>
      </main>
    </div>
    </PageTransition>
  );
}
