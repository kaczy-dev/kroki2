import { useCallback, useSyncExternalStore } from "react";

const KEY = "kroki.batterySaver";

let enabled = typeof window !== "undefined" ? localStorage.getItem(KEY) === "1" : false;
let listeners: Array<() => void> = [];

function subscribe(cb: () => void) {
  listeners.push(cb);
  return () => { listeners = listeners.filter((l) => l !== cb); };
}

function getSnapshot() { return enabled; }

function emit() { listeners.forEach((l) => l()); }

/**
 * Battery saver / background minimization mode.
 * When enabled:
 * - Reduces motion (disables most framer-motion animations)
 * - Longer cadence update interval
 * - Less frequent localStorage writes
 * - Simpler UI (no glow, no particles)
 */
export function useBatterySaver() {
  const active = useSyncExternalStore(subscribe, getSnapshot, () => false);

  const toggle = useCallback(() => {
    enabled = !enabled;
    localStorage.setItem(KEY, enabled ? "1" : "0");

    // Apply to DOM for CSS-level reduction
    if (enabled) {
      document.documentElement.setAttribute("data-battery-saver", "");
    } else {
      document.documentElement.removeAttribute("data-battery-saver");
    }
    emit();
  }, []);

  // Initialize on first render
  if (typeof window !== "undefined" && enabled) {
    document.documentElement.setAttribute("data-battery-saver", "");
  }

  return { active, toggle };
}
