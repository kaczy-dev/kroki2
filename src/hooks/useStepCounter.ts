import { useCallback, useEffect, useRef, useState } from "react";
import { StepDetector } from "@/lib/step-detector";

export type SensorStatus = "idle" | "requesting" | "active" | "denied" | "unsupported" | "manual" | "demo";

interface Options {
  onStep?: () => void;
}

export function useStepCounter({ onStep }: Options = {}) {
  const [status, setStatus] = useState<SensorStatus>("idle");
  const [stepsToday, setStepsToday] = useState(0);
  const [cadence, setCadence] = useState(0);
  const [regularity, setRegularity] = useState(0);
  const detectorRef = useRef(new StepDetector());
  const handlerRef = useRef<((e: DeviceMotionEvent) => void) | null>(null);
  const demoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pausedRef = useRef(false);
  const [paused, setPaused] = useState(false);

  // Cadence & regularity update interval
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
      // If not walking for a while, reset cadence display
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
        // Prefer accelerationIncludingGravity (more widely available)
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
    } catch {
      setStatus("denied");
    }
  }, [registerStep, startCadenceUpdates]);

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
  }, [stopCadenceUpdates]);

  const startManual = useCallback(() => {
    stop();
    setStatus("manual");
  }, [stop]);

  const startDemo = useCallback(() => {
    stop();
    setStatus("demo");
    // Simulate realistic walking cadence (100-120 steps/min = 500-600ms interval)
    let stepCount = 0;
    const baseInterval = 550;
    const scheduleNext = () => {
      // Add slight randomness to simulate real walking
      const jitter = (Math.random() - 0.5) * 100;
      const interval = baseInterval + jitter;
      demoIntervalRef.current = setTimeout(() => {
        registerStep();
        stepCount++;
        setCadence(Math.round(60000 / (baseInterval + jitter * 0.3)));
        setRegularity(0.85 + Math.random() * 0.1);
        scheduleNext();
      }, interval) as unknown as ReturnType<typeof setInterval>;
    };
    scheduleNext();
  }, [registerStep, stop]);

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
  }, []);

  const setSteps = useCallback((n: number) => setStepsToday(n), []);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  // Auto-resume sensor when app regains focus (e.g. phone unlocked)
  useEffect(() => {
    if (typeof document === "undefined") return;
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && status === "active" && handlerRef.current) {
        // Sensor is already active, just reset detector to avoid stale data
        detectorRef.current.reset();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [status]);

  return {
    status, stepsToday, cadence, regularity, paused,
    start, stop, startManual, startDemo, addManualStep,
    togglePause, reset, setSteps,
  };
}
