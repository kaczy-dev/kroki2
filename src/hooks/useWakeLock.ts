import { useCallback, useEffect, useRef, useState } from "react";

interface WakeLockSentinelLike {
  release: () => Promise<void>;
  addEventListener: (type: "release", cb: () => void) => void;
}

export function useWakeLock() {
  const sentinelRef = useRef<WakeLockSentinelLike | null>(null);
  const [active, setActive] = useState(false);

  const request = useCallback(async () => {
    try {
      const wl = (navigator as unknown as { wakeLock?: { request: (t: "screen") => Promise<WakeLockSentinelLike> } }).wakeLock;
      if (!wl) return;
      const s = await wl.request("screen");
      sentinelRef.current = s;
      s.addEventListener("release", () => setActive(false));
      setActive(true);
    } catch { /* noop */ }
  }, []);

  const release = useCallback(async () => {
    try {
      await sentinelRef.current?.release();
    } catch { /* noop */ }
    sentinelRef.current = null;
    setActive(false);
  }, []);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible" && active && !sentinelRef.current) {
        request();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [active, request]);

  return { active, request, release };
}
