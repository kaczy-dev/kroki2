import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useStepContext } from "@/context/StepProvider";
import { AnimatedRing } from "@/components/AnimatedRing";
import { MetricsGrid } from "@/components/MetricsGrid";
import { SensorButton } from "@/components/SensorButton";
import { SettingsSheet } from "@/components/SettingsSheet";
import { PageTransition } from "@/components/PageTransition";
import { GoalCelebration } from "@/components/GoalCelebration";
import { MoodAvatar } from "@/components/MoodAvatar";
import { SmartInsights } from "@/components/SmartInsights";
import { BackgroundStepsBanner } from "@/components/BackgroundStepsBanner";
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
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
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
    const all = hour < 7
      ? ["Kto rano wstaje, temu kroki rosną! 🌅", "Nawet orzeł jeszcze śpi... ale nie Ty! 💪"]
      : hour < 12
      ? ["Bez pracy nie ma kroków! 🇵🇱", "Husaria nie siedziała na kanapie! ⚔️", "Poranny spacer = złoto! ☀️"]
      : hour < 18
      ? ["Polak potrafi i 10k da radę! 🇵🇱", "Spacer > scrollowanie 📱", "Twoje nogi > samochód 🚗💨"]
      : ["Wieczorny spacer jak polski zachód słońca 🌅", "Kto nie chodzi, ten nie żyje — ludowe 🌿", "Jutro podziękujesz sobie za dziś 💪"];
    return all[Math.floor(Math.random() * all.length)];
  }, []);

  const isActive = ctx.status === "active" || ctx.status === "demo" || ctx.status === "manual";

  return (
    <PageTransition>
    <div className="min-h-dvh bg-bg text-ink">
      <Header onSettings={() => setSettingsOpen(true)} streak={ctx.streak} />

      <motion.main
        variants={stagger}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-md px-4 py-4 space-y-4 pb-24"
      >
        {/* Hero ring */}
        <motion.div variants={fadeUp} className="flex justify-center">
          <AnimatedRing
            steps={ctx.stepsToday}
            goal={ctx.goal}
            size={260}
            onTap={() => {
              if (ctx.status === "idle") ctx.start();
              else if (ctx.status === "manual") ctx.addManualStep(1);
            }}
          />
        </motion.div>

        {/* Mood + motivation (compact single row) */}
        <motion.div variants={fadeUp}>
          <MoodAvatar steps={ctx.stepsToday} goal={ctx.goal} />
        </motion.div>

        {/* Metrics — only show non-zero or when active */}
        {(ctx.stepsToday > 0 || isActive) && (
          <motion.div variants={fadeUp}>
            <MetricsGrid steps={ctx.stepsToday} cadence={ctx.cadence} />
          </motion.div>
        )}

        {/* Smart insights (max 2, contextual) */}
        <SmartInsights
          stepsToday={ctx.stepsToday}
          goal={ctx.goal}
          streak={ctx.streak}
          yesterdaySteps={ctx.yesterdaySteps}
          history={ctx.history}
          cadence={ctx.cadence}
          status={ctx.status}
        />

        {/* Background steps recovery */}
        <BackgroundStepsBanner
          backgroundSteps={ctx.backgroundSteps}
          onAccept={ctx.acceptBackgroundSteps}
          onDismiss={ctx.dismissBackgroundSteps}
        />

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

        {/* Motivation text */}
        <motion.div variants={fadeUp} className="text-center">
          <p className="font-mono text-[10px] text-ink/50 leading-snug">{motivation}</p>
        </motion.div>
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
      className="sticky top-0 z-30 bg-bg/80 backdrop-blur-xl"
    >
      <div className="h-[3px] flex">
        <div className="flex-1 bg-polska-white" />
        <div className="flex-1 bg-polska-red" />
      </div>
      <div className="mx-auto max-w-md px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <motion.div
            whileTap={{ scale: 0.9, rotate: -5 }}
            className="w-8 h-8 grid place-items-center font-display text-sm shrink-0 rounded-lg relative overflow-hidden"
            style={{ background: "linear-gradient(180deg, #ffffff 50%, var(--polska-red) 50%)" }}
            aria-hidden="true"
          >
            <span className="relative z-10 text-ink font-display" style={{ textShadow: "0 0 3px rgba(255,255,255,0.8)" }}>K</span>
          </motion.div>
          <div className="min-w-0">
            <div className="font-display text-sm leading-none truncate">KROKI</div>
            <div className="text-[9px] font-mono text-muted/70 leading-none mt-0.5">
              {new Date().toLocaleDateString("pl-PL", { weekday: "short", day: "numeric", month: "short" })}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {streak > 0 && (
            <div className="bg-polska-red/10 border border-polska-red/25 px-1.5 py-0.5 rounded-full font-display text-[10px] text-polska-red flex items-center gap-0.5" data-compact>
              🔥 {streak}
            </div>
          )}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={onSettings}
            aria-label="Ustawienia"
            className="w-8 h-8 grid place-items-center rounded-lg bg-surface border border-ink/10"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}
