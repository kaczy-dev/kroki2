import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { useStepCounter, type SensorStatus } from "@/hooks/useStepCounter";
import { useLocalHistory, type HistoryEntry } from "@/hooks/useLocalHistory";
import { useWakeLock } from "@/hooks/useWakeLock";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { toast } from "sonner";

interface Ctx {
  // counter
  status: SensorStatus;
  paused: boolean;
  stepsToday: number;
  cadence: number;
  regularity: number;
  start: () => void;
  stop: () => void;
  startManual: () => void;
  startDemo: () => void;
  togglePause: () => void;
  addManualStep: (n?: number) => void;
  // history
  goal: number;
  history: HistoryEntry[];
  last7: HistoryEntry[];
  streak: number;
  lifetimeSteps: number;
  yesterdaySteps: number;
  ready: boolean;
  setGoal: (n: number) => void;
  resetToday: () => void;
  exportJson: () => void;
  importJson: (json: string) => boolean;
  // settings
  stepLength: number;
  setStepLength: (cm: number) => void;
  streakFreezeUsed: boolean;
  // achievements
  unlocked: Set<string>;
  // wake lock
  wakeLockActive: boolean;
  toggleWakeLock: () => void;
}

const StepCtx = createContext<Ctx | null>(null);

const ACH_KEY = "stepcount.achievements.v1";

function loadAch(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(ACH_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch { return new Set(); }
}

function saveAch(s: Set<string>) {
  try { localStorage.setItem(ACH_KEY, JSON.stringify([...s])); } catch { /* noop */ }
}

async function fireConfetti() {
  if (typeof window === "undefined") return;
  const { default: confetti } = await import("canvas-confetti");
  // 🇵🇱 Polish flag colors!
  const opts = { spread: 100, startVelocity: 30, ticks: 90, gravity: 0.8, scalar: 1.1 };
  confetti({ ...opts, particleCount: 70, origin: { x: 0.25, y: 0.6 }, colors: ["#ffffff", "#dc143c", "#ffffff"] });
  confetti({ ...opts, particleCount: 70, origin: { x: 0.75, y: 0.6 }, colors: ["#dc143c", "#ffffff", "#dc143c"] });
}

function vibrate(p: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try { (navigator as Navigator).vibrate(p); } catch { /* noop */ }
  }
}

export function StepProvider({ children }: { children: ReactNode }) {
  const hist = useLocalHistory();
  const wake = useWakeLock();
  const unlockedRef = useRef<Set<string>>(new Set());
  const seededRef = useRef(false);

  const counter = useStepCounter({
    onStep: () => vibrate(6),
  });

  // Seed counter from storage once history is ready
  useEffect(() => {
    if (!hist.ready || seededRef.current) return;
    counter.setSteps(hist.state.steps);
    unlockedRef.current = loadAch();
    seededRef.current = true;
  }, [hist.ready, hist.state.steps, counter]);

  // Sync counter -> storage
  useEffect(() => {
    if (!seededRef.current) return;
    if (counter.stepsToday !== hist.state.steps) {
      hist.updateSteps(counter.stepsToday);
    }
  }, [counter.stepsToday, hist]);

  // Auto wake-lock during active sensor / demo
  useEffect(() => {
    const isActive = counter.status === "active" || counter.status === "demo";
    if (isActive && !wake.active) wake.request();
    if (!isActive && wake.active) wake.release();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counter.status]);

  // Milestones — vibration every 1000 steps
  const lastMilestoneRef = useRef(0);
  useEffect(() => {
    const m = Math.floor(counter.stepsToday / 1000);
    if (m > lastMilestoneRef.current && counter.stepsToday > 0) {
      lastMilestoneRef.current = m;
      vibrate([30, 30, 30]);
    }
  }, [counter.stepsToday]);

  // Goal progress milestones (25%, 50%, 75%)
  const lastGoalMilestoneRef = useRef(0);
  useEffect(() => {
    if (!seededRef.current || hist.state.goal === 0) return;
    const pct = counter.stepsToday / hist.state.goal;
    const milestone = pct >= 0.75 ? 75 : pct >= 0.5 ? 50 : pct >= 0.25 ? 25 : 0;
    if (milestone > lastGoalMilestoneRef.current && counter.stepsToday > 0) {
      lastGoalMilestoneRef.current = milestone;
      const messages: Record<number, string> = {
        25: "💪 25% celu — dobry start!",
        50: "🔥 Połowa drogi! Tak trzymaj!",
        75: "⚡ 75% — prawie cel!",
      };
      if (messages[milestone]) {
        toast(messages[milestone], { duration: 3000 });
        vibrate([20, 20, 40]);
      }
    }
  }, [counter.stepsToday, hist.state.goal]);

  // Evening summary (daily recap at 21:00)
  const eveningSummaryShownRef = useRef(false);
  useEffect(() => {
    if (!seededRef.current || eveningSummaryShownRef.current) return;
    const now = new Date();
    if (now.getHours() >= 21 && counter.stepsToday > 0) {
      const key = `kroki.evening.${now.toISOString().slice(0, 10)}`;
      if (typeof sessionStorage !== "undefined" && !sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        eveningSummaryShownRef.current = true;
        const pctVal = Math.round((counter.stepsToday / hist.state.goal) * 100);
        const km = ((counter.stepsToday * hist.settings.stepLengthCm) / 100 / 1000).toFixed(1);
        toast("🌙 Podsumowanie dnia", {
          description: `${counter.stepsToday.toLocaleString("pl-PL")} kroków (${pctVal}% celu) · ${km} km`,
          duration: 6000,
        });
      }
    }
  }, [counter.stepsToday, hist.state.goal, hist.settings.stepLengthCm]);

  // Auto-pause if no steps for 5 minutes while sensor active
  const lastStepTimeRef = useRef(Date.now());
  const autoPauseShownRef = useRef(false);
  useEffect(() => {
    if (counter.stepsToday > 0) {
      lastStepTimeRef.current = Date.now();
      autoPauseShownRef.current = false;
    }
  }, [counter.stepsToday]);

  useEffect(() => {
    const isActive = counter.status === "active" || counter.status === "demo";
    if (!isActive || counter.paused) return;
    const check = setInterval(() => {
      const elapsed = Date.now() - lastStepTimeRef.current;
      if (elapsed > 5 * 60 * 1000 && !autoPauseShownRef.current) {
        autoPauseShownRef.current = true;
        counter.togglePause();
        toast("⏸ Auto-pauza", {
          description: "Brak kroków od 5 min. Wznów gdy ruszysz.",
          duration: 5000,
        });
        vibrate([30, 50, 30]);
      }
    }, 30000);
    return () => clearInterval(check);
  }, [counter.status, counter.paused, counter]);

  // Lifetime distance milestones (every 10km)
  const lastDistanceMilestoneRef = useRef(0);

  // Lifetime
  const lifetimeSteps =
    hist.state.history.reduce((sum, h) => sum + h.steps, 0) + hist.state.steps;

  useEffect(() => {
    if (!seededRef.current) return;
    const totalKm = (lifetimeSteps * hist.settings.stepLengthCm) / 100 / 1000;
    const milestone = Math.floor(totalKm / 10) * 10;
    if (milestone > lastDistanceMilestoneRef.current && milestone > 0) {
      lastDistanceMilestoneRef.current = milestone;
      const cities: Record<number, string> = {
        10: "10 km — jak z Centrum na Mokotów! 🏙️",
        20: "20 km — przeszedłeś Trasę Łazienkowską! 🌳",
        42: "MARATON! Polska GÓRA! 🏅🇵🇱",
        50: "50 km — pół setki! Husaria by się nie wstydziła! ⚔️",
        100: "100 km — SETKA! Jak z Warszawy do Radomia! 🦅",
        150: "150 km — jak Warszawa → Łódź pieszo! 🗺️",
        200: "200 km — jak z Krakowa do Zakopanego i z powrotem! 🏔️",
        300: "300 km — właśnie przeszedłeś długość polskiego wybrzeża... prawie! 🌊",
        500: "500 km — pół tysiąca! Legenda spacerów! 🌟",
        1000: "1000 km — TYSIĄC! Jak z Gdańska do Zakopanego! 🇵🇱🦅",
      };
      const msg = cities[milestone] || `${milestone} km łącznie! 🎉`;
      toast(`🌍 ${msg}`, { duration: 6000 });
      vibrate([50, 30, 50, 30, 100]);
    }
  }, [lifetimeSteps, hist.settings.stepLengthCm]);

  // Days above 5k in last 7
  const daysAbove5k = hist.last7.filter((d) => d.steps >= 5000).length;

  // Achievement evaluation on relevant changes
  useEffect(() => {
    if (!seededRef.current) return;
    const ctx = {
      stepsToday: counter.stepsToday,
      goal: hist.state.goal,
      streak: hist.streak,
      lifetimeSteps,
      hourOfDay: new Date().getHours(),
      daysAbove5k,
      history: hist.state.history,
    };
    let changed = false;
    let goalNewlyHit = false;
    for (const a of ACHIEVEMENTS) {
      if (unlockedRef.current.has(a.id)) continue;
      if (a.check(ctx)) {
        unlockedRef.current.add(a.id);
        changed = true;
        if (a.id === "goal_hit") goalNewlyHit = true;
        toast(`${a.icon}  ${a.title}`, {
          description: a.description,
          duration: 4500,
        });
        vibrate([60, 40, 120]);
      }
    }
    if (changed) saveAch(new Set(unlockedRef.current));
    if (goalNewlyHit) fireConfetti();
  }, [counter.stepsToday, hist.state.goal, hist.streak, lifetimeSteps, daysAbove5k, hist.state.history]);

  const resetTodayAll = () => {
    counter.reset();
    hist.resetToday();
    lastMilestoneRef.current = 0;
    lastGoalMilestoneRef.current = 0;
  };

  const value: Ctx = {
    status: counter.status,
    paused: counter.paused,
    stepsToday: counter.stepsToday,
    cadence: counter.cadence,
    regularity: counter.regularity,
    start: counter.start,
    stop: counter.stop,
    startManual: counter.startManual,
    startDemo: counter.startDemo,
    togglePause: counter.togglePause,
    addManualStep: counter.addManualStep,
    goal: hist.state.goal,
    history: hist.state.history,
    last7: hist.last7,
    streak: hist.streak,
    lifetimeSteps,
    yesterdaySteps: hist.yesterdaySteps,
    ready: hist.ready,
    setGoal: hist.setGoal,
    resetToday: resetTodayAll,
    exportJson: hist.exportJson,
    importJson: hist.importJson,
    stepLength: hist.settings.stepLengthCm,
    setStepLength: hist.setStepLength,
    streakFreezeUsed: hist.streakFreezeUsed,
    unlocked: unlockedRef.current,
    wakeLockActive: wake.active,
    toggleWakeLock: () => (wake.active ? wake.release() : wake.request()),
  };

  return <StepCtx.Provider value={value}>{children}</StepCtx.Provider>;
}

export function useStepContext() {
  const v = useContext(StepCtx);
  if (!v) throw new Error("useStepContext must be used inside <StepProvider>");
  return v;
}
