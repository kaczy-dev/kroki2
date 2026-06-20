import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useStepContext } from "@/context/StepProvider";
import { AnimatedRing } from "@/components/AnimatedRing";
import { MetricsGrid } from "@/components/MetricsGrid";
import { SensorButton } from "@/components/SensorButton";
import { SettingsSheet } from "@/components/SettingsSheet";
import { PageTransition } from "@/components/PageTransition";
import { GoalCelebration } from "@/components/GoalCelebration";
import { ActiveSession } from "@/components/ActiveSession";
import { DailyRecord } from "@/components/DailyRecord";
import { QuickStats } from "@/components/QuickStats";
import { SmartInsights } from "@/components/SmartInsights";
import { PWAPrompt, OfflineIndicator } from "@/components/PWAPrompt";
import { useState, useMemo, useEffect, useRef } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KROKI — Dzisiaj" },
      { name: "description", content: "Twoje kroki dzisiaj w czasie rzeczywistym." },
    ],
  }),
  component: Index,
});

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

function Index() {
  const ctx = useStepContext();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const prevStepsRef = useRef(ctx.stepsToday);

  useEffect(() => {
    if (prevStepsRef.current < ctx.goal && ctx.stepsToday >= ctx.goal && ctx.stepsToday > 0) {
      setShowCelebration(true);
    }
    prevStepsRef.current = ctx.stepsToday;
  }, [ctx.stepsToday, ctx.goal]);

  const motivation = useMemo(() => {
    const hour = new Date().getHours();
    // Context-aware messages based on time of day
    if (hour < 7) return "Wczesny spacer? Szacunek! 🌅";
    if (hour < 12) {
      const msgs = ["Ruszaj się od rana 💪", "Poranny spacer = dobry dzień ☀️", "Krok po kroku do celu 🎯"];
      return msgs[Math.floor(Math.random() * msgs.length)];
    }
    if (hour < 18) {
      const msgs = ["Świetnie Ci idzie! 🚶", "Połowa dnia — rusz się! ⚡", "Spacer czyni cuda ✨"];
      return msgs[Math.floor(Math.random() * msgs.length)];
    }
    const msgs = ["Wieczorny spacer relaksuje 🌙", "Jeszcze kilka kroków! 🔥", "Zakończ dzień aktywnie 🌿"];
    return msgs[Math.floor(Math.random() * msgs.length)];
  }, []);

  return (
    <PageTransition>
    <div className="min-h-dvh bg-bg text-ink">
      <Header onSettings={() => setSettingsOpen(true)} streak={ctx.streak} />

      <motion.main
        variants={stagger}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-md px-4 py-5 space-y-5 pb-28"
      >
        {/* Hero ring — tap to start sensor */}
        <motion.div variants={fadeUp} className="flex justify-center pt-1">
          <AnimatedRing
            steps={ctx.stepsToday}
            goal={ctx.goal}
            size={280}
            onTap={() => {
              if (ctx.status === "idle") ctx.start();
              else if (ctx.status === "manual") ctx.addManualStep(1);
            }}
          />
        </motion.div>

        {/* Onboarding prompt */}
        <AnimatePresence mode="wait">
          {ctx.stepsToday === 0 && ctx.status === "idle" && (
            <motion.div
              key="onboard"
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="brut-card p-4 text-center"
            >
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="text-3xl mb-2"
              >
                👟
              </motion.div>
              <div className="font-display text-sm">Gotowy na spacer?</div>
              <div className="text-[11px] font-mono text-muted mt-1">
                Aktywuj sensor poniżej aby liczyć kroki
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Metrics */}
        <motion.div variants={fadeUp}>
          <MetricsGrid steps={ctx.stepsToday} cadence={ctx.cadence} />
        </motion.div>

        {/* Active session timer */}
        <ActiveSession
          active={ctx.status === "active" || ctx.status === "demo" || ctx.status === "manual"}
          paused={ctx.paused}
        />

        {/* New daily record */}
        <DailyRecord stepsToday={ctx.stepsToday} history={ctx.history} />

        {/* Smart insights — forecast, comparisons, nudges */}
        <SmartInsights
          stepsToday={ctx.stepsToday}
          goal={ctx.goal}
          streak={ctx.streak}
          yesterdaySteps={ctx.yesterdaySteps}
          history={ctx.history}
          cadence={ctx.cadence}
          status={ctx.status}
        />

        {/* Quick stats link */}
        {ctx.lifetimeSteps > 0 && (
          <motion.div variants={fadeUp}>
            <QuickStats
              lifetimeSteps={ctx.lifetimeSteps}
              streak={ctx.streak}
              stepLength={ctx.stepLength}
            />
          </motion.div>
        )}

        {/* Yesterday + Motivation strip */}
        <AnimatePresence>
          {(ctx.yesterdaySteps > 0 || ctx.stepsToday === 0) && (
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: 8 }}
              className="flex gap-2.5"
            >
              {ctx.yesterdaySteps > 0 && (
                <motion.div
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 brut-card p-3"
                >
                  <div className="text-[8px] font-display text-muted tracking-wider">WCZORAJ</div>
                  <div className="font-display text-lg tabular-nums mt-0.5 leading-tight">
                    {ctx.yesterdaySteps.toLocaleString("pl-PL")}
                  </div>
                  <div className="text-[9px] font-mono text-ink/50 mt-0.5">
                    {ctx.yesterdaySteps >= ctx.goal
                      ? <span className="text-success">✓ cel</span>
                      : `${Math.round((ctx.yesterdaySteps / ctx.goal) * 100)}%`}
                  </div>
                </motion.div>
              )}
              <motion.div
                whileTap={{ scale: 0.97 }}
                className={`${ctx.yesterdaySteps > 0 ? "flex-1" : "w-full"} brut-card p-3 flex items-center justify-center`}
              >
                <div className="text-center font-mono text-[11px] text-ink/60 leading-snug">{motivation}</div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sensor controls */}
        <motion.div variants={fadeUp}>
          <SensorButton
            status={ctx.status}
            paused={ctx.paused}
            onStart={ctx.start}
            onManual={ctx.startManual}
            onDemo={ctx.startDemo}
            onStop={ctx.stop}
            onTogglePause={ctx.togglePause}
            onAddStep={ctx.addManualStep}
          />
        </motion.div>

        {/* Footer */}
        <motion.footer variants={fadeUp} className="pt-1 text-center">
          <p className="font-mono text-[9px] text-ink/40 tracking-wide">
            Dane lokalnie · Bez konta · Bez chmury
          </p>
        </motion.footer>
      </motion.main>

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        goal={ctx.goal}
        onGoalChange={ctx.setGoal}
        onReset={ctx.resetToday}
        onExport={ctx.exportJson}
        onImport={ctx.importJson}
        wakeLockActive={ctx.wakeLockActive}
        onToggleWakeLock={ctx.toggleWakeLock}
        stepLength={ctx.stepLength}
        onStepLengthChange={ctx.setStepLength}
        streakFreezeUsed={ctx.streakFreezeUsed}
      />

      <GoalCelebration
        show={showCelebration}
        steps={ctx.stepsToday}
        goal={ctx.goal}
        onDismiss={() => setShowCelebration(false)}
      />

      <PWAPrompt />
      <OfflineIndicator />
    </div>
    </PageTransition>
  );
}

function Header({ onSettings, streak }: { onSettings: () => void; streak: number }) {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="sticky top-0 z-30 bg-bg/80 backdrop-blur-xl border-b border-ink/8"
    >
      <div className="mx-auto max-w-md px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <motion.div
            whileTap={{ scale: 0.9, rotate: -5 }}
            className="w-9 h-9 bg-accent grid place-items-center font-display text-surface text-lg shrink-0 rounded-xl shadow-sm"
            aria-hidden="true"
          >
            K
          </motion.div>
          <div className="min-w-0">
            <div className="font-display text-[15px] leading-none truncate">KROKI</div>
            <div className="text-[10px] font-mono text-muted/80 leading-none mt-1">
              {new Date().toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" })}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {streak > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="bg-accent/10 border border-accent/30 px-2 py-1 rounded-full font-display text-[11px] text-accent flex items-center gap-1"
            >
              <span>🔥</span> {streak}
            </motion.div>
          )}
          <motion.button
            whileTap={{ scale: 0.88, rotate: 45 }}
            onClick={onSettings}
            aria-label="Ustawienia"
            className="w-9 h-9 grid place-items-center rounded-xl bg-surface border border-ink/10 shadow-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}
