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
import { ActivityIndicator } from "@/components/ActivityIndicator";
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

        {/* Activity type indicator (walk/brisk/run) */}
        <ActivityIndicator cadence={ctx.cadence} />

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
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-30 bg-bg/70 backdrop-blur-2xl"
    >
      <div className="mx-auto max-w-md px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="font-display text-[15px] leading-none">KROKI</div>
          <span className="text-[9px] font-mono text-muted/60 mt-px">
            {new Date().toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {streak > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-beer/12 px-2 py-0.5 rounded-full font-display text-[10px] text-beer flex items-center gap-0.5"
              data-compact
            >
              🔥{streak}
            </motion.div>
          )}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={onSettings}
            aria-label="Ustawienia"
            className="w-8 h-8 grid place-items-center rounded-full bg-ink/5 active:bg-ink/10"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
            </svg>
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}
