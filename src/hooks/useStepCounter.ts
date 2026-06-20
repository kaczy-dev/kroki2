import { useCallback, useEffect, useRef, useState } from "react";
import { StepDetector } from "@/lib/step-detector";

export type SensorStatus = "idle" | "requesting" | "active" | "denied" | "unsupported" | "manual" | "demo";

interface Options {
  onStep?: () => void;
}

const SESSION_KEY = "kroki.session";

interface PersistedSession {
  status: SensorStatus;
  stepsAtStart: number;
  startedAt: number;
}

function saveSession(session: PersistedSession | null) {
  try {
    if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch { /* noop */ }
}

function loadSession(): PersistedSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as PersistedSession;
    // Session expires after 12 hours
    if (Date.now() - s.startedAt > 12 * 60 * 60 * 1000) return null;
    return s;
  } catch { return null; }
}

export function useStepCounter({ onStep }: Options = {}) {
  const [status, setStatus] = useState<SensorStatus>("idle");
  const [stepsToday, setStepsToday] = useState(0);
  const [cadence, setCadence] = useState(0);
  const [regularity, setRegularity] = useState(0);
  const [backgroundSteps, setBackgroundSteps] = useState(0);
  const detectorRef = useRef(new StepDetector());
  const handlerRef = useRef<((e: DeviceMotionEvent) => void) | null>(null);
  const demoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pausedRef = useRef(false);
  const [paused, setPaused] = useState(false);

  // Background tracking
  const lastVisibleTimeRef = useRef(Date.now());
  const stepsWhenHiddenRef = useRef(0);
  const wasActiveBeforeHideRef = useRef(false);

  // Cadence update interval
  const cadenceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const registerStep = useCallback(() => {
    if (pausedRef.current) return;
    setStepsToday((s) => s + 1);
    onStep?.();
  }, [onStep]);

  const startCadenceUpdates = useCallback(() => {
    if (cadenceIntervalRef.current) return;
    cadenceIntervalRef.current = setInterval(() => {
      const det = detectorRef.current;
      setCadence(det.getCadence());
      setRegularity(det.getRegularity());
      if (!det.isWalking()) {
        setCadence(0);
        setRegularity(0);
      }
    }, 1500);
  }, []);

  const stopCadenceUpdates = useCallback(() => {
    if (cadenceIntervalRef.current) {
      clearInterval(cadenceIntervalRef.current);
      cadenceIntervalRef.current = null;
    }
  }, []);

  const start = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (!("DeviceMotionEvent" in window)) {
      setStatus("unsupported");
      return;
    }
    setStatus("requesting");
    try {
      const anyDM = DeviceMotionEvent as unknown as {
        requestPermission?: () => Promise<"granted" | "denied">;
      };
      if (typeof anyDM.requestPermission === "function") {
        const res = await anyDM.requestPermission();
        if (res !== "granted") {
          setStatus("denied");
          return;
        }
      }

      const handler = (e: DeviceMotionEvent) => {
        const a = e.accelerationIncludingGravity;
        if (!a || a.x == null || a.y == null || a.z == null) return;
        if (detectorRef.current.push(a.x, a.y, a.z)) {
          registerStep();
        }
      };

      handlerRef.current = handler;
      window.addEventListener("devicemotion", handler);
      setStatus("active");
      startCadenceUpdates();

      // Persist session so we can recover
      saveSession({ status: "active", stepsAtStart: stepsToday, startedAt: Date.now() });
    } catch {
      setStatus("denied");
    }
  }, [registerStep, startCadenceUpdates, stepsToday]);

  const stop = useCallback(() => {
    if (handlerRef.current) {
      window.removeEventListener("devicemotion", handlerRef.current);
      handlerRef.current = null;
    }
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
    stopCadenceUpdates();
    setStatus("idle");
    setCadence(0);
    setRegularity(0);
    saveSession(null);
  }, [stopCadenceUpdates]);

  const startManual = useCallback(() => {
    stop();
    setStatus("manual");
    saveSession({ status: "manual", stepsAtStart: stepsToday, startedAt: Date.now() });
  }, [stop, stepsToday]);

  const startDemo = useCallback(() => {
    stop();
    setStatus("demo");
    const baseInterval = 550;
    const scheduleNext = () => {
      const jitter = (Math.random() - 0.5) * 100;
      const interval = baseInterval + jitter;
      demoIntervalRef.current = setTimeout(() => {
        registerStep();
        setCadence(Math.round(60000 / (baseInterval + jitter * 0.3)));
        setRegularity(0.85 + Math.random() * 0.1);
        scheduleNext();
      }, interval) as unknown as ReturnType<typeof setInterval>;
    };
    scheduleNext();
    saveSession({ status: "demo", stepsAtStart: stepsToday, startedAt: Date.now() });
  }, [registerStep, stop, stepsToday]);

  const addManualStep = useCallback((n = 1) => {
    for (let i = 0; i < n; i++) registerStep();
  }, [registerStep]);

  const togglePause = useCallback(() => {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
  }, []);

  const reset = useCallback(() => {
    detectorRef.current.reset();
    setStepsToday(0);
    setCadence(0);
    setRegularity(0);
    setBackgroundSteps(0);
    saveSession(null);
  }, []);

  const setSteps = useCallback((n: number) => setStepsToday(n), []);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  // ========== BACKGROUND HANDLING ==========

  // Track when app goes to background and comes back
  useEffect(() => {
    if (typeof document === "undefined") return;

    const handleVisibility = () => {
      const isActive = status === "active" || status === "demo";

      if (document.visibilityState === "hidden") {
        // App going to background
        lastVisibleTimeRef.current = Date.now();
        stepsWhenHiddenRef.current = stepsToday;
        wasActiveBeforeHideRef.current = isActive;
      }

      if (document.visibilityState === "visible") {
        // App coming back to foreground
        const timeInBackground = Date.now() - lastVisibleTimeRef.current;

        if (wasActiveBeforeHideRef.current && status === "active") {
          // Reset detector to avoid stale accelerometer data
          detectorRef.current.reset();

          // If was active sensor and came back, estimate missed steps
          // On most mobile browsers, DeviceMotion still fires in background for a while
          // but eventually stops. Calculate estimated missed steps based on last cadence.
          if (timeInBackground > 10000 && cadence > 0) {
            // Estimate: last cadence × background minutes (capped at 80% to be conservative)
            const bgMinutes = timeInBackground / 60000;
            const estimatedMissed = Math.round(cadence * bgMinutes * 0.6);
            if (estimatedMissed > 10) {
              setBackgroundSteps(estimatedMissed);
            }
          }
        }

        // Re-request wake lock if needed (it's lost on visibility change)
        if (wasActiveBeforeHideRef.current && handlerRef.current) {
          // Sensor handler is still attached — good, it may have collected steps
          startCadenceUpdates();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [status, stepsToday, cadence, startCadenceUpdates]);

  // Recover session on mount (e.g., page refresh while walking)
  useEffect(() => {
    const session = loadSession();
    if (session && session.status === "active") {
      // Was walking before page closed — prompt to resume
      setStatus("idle"); // Will show "resume" state via persisted session
    }
  }, []);

  // Accept or dismiss estimated background steps
  const acceptBackgroundSteps = useCallback(() => {
    if (backgroundSteps > 0) {
      setStepsToday((s) => s + backgroundSteps);
      setBackgroundSteps(0);
    }
  }, [backgroundSteps]);

  const dismissBackgroundSteps = useCallback(() => {
    setBackgroundSteps(0);
  }, []);

  return {
    status, stepsToday, cadence, regularity, paused, backgroundSteps,
    start, stop, startManual, startDemo, addManualStep,
    togglePause, reset, setSteps,
    acceptBackgroundSteps, dismissBackgroundSteps,
  };
}
