/**
 * Native Step Counter bridge for Capacitor (Android).
 * Falls back gracefully to web DeviceMotion when native not available.
 */

import { Capacitor, registerPlugin } from "@capacitor/core";

interface StepCounterPlugin {
  start(): Promise<{ started: boolean }>;
  stop(): Promise<void>;
  getSteps(): Promise<{ steps: number; available: boolean; listening: boolean }>;
  isAvailable(): Promise<{ available: boolean; type: string }>;
  reset(): Promise<void>;
  addListener(event: "stepUpdate", cb: (data: { steps: number; totalSinceBoot: number }) => void): Promise<{ remove: () => void }>;
}

// Register the native plugin (only works in Capacitor runtime)
const NativeStepCounter = Capacitor.isNativePlatform()
  ? registerPlugin<StepCounterPlugin>("StepCounter")
  : null;

/**
 * Check if native step counter is available
 */
export async function isNativeAvailable(): Promise<boolean> {
  if (!NativeStepCounter) return false;
  try {
    const { available } = await NativeStepCounter.isAvailable();
    return available;
  } catch {
    return false;
  }
}

/**
 * Start native step counting
 */
export async function startNative(): Promise<boolean> {
  if (!NativeStepCounter) return false;
  try {
    const { started } = await NativeStepCounter.start();
    return started;
  } catch {
    return false;
  }
}

/**
 * Stop native step counting
 */
export async function stopNative(): Promise<void> {
  if (!NativeStepCounter) return;
  await NativeStepCounter.stop();
}

/**
 * Get current step count from native sensor
 */
export async function getNativeSteps(): Promise<number> {
  if (!NativeStepCounter) return 0;
  try {
    const { steps } = await NativeStepCounter.getSteps();
    return steps;
  } catch {
    return 0;
  }
}

/**
 * Listen for step updates in real-time
 */
export async function onNativeStep(cb: (steps: number) => void): Promise<(() => void) | null> {
  if (!NativeStepCounter) return null;
  try {
    const handle = await NativeStepCounter.addListener("stepUpdate", (data) => {
      cb(data.steps);
    });
    return () => handle.remove();
  } catch {
    return null;
  }
}

/**
 * Reset session counter
 */
export async function resetNative(): Promise<void> {
  if (!NativeStepCounter) return;
  await NativeStepCounter.reset();
}

/**
 * Check if running inside Capacitor (native app) vs browser
 */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}
