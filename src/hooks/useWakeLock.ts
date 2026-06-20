import { useCallback, useEffect, useRef, useState } from "react";

interface WakeLockSentinelLike {
  release: () => Promise<void>;
  addEventListener: (type: "release", cb: () => void) => void;
  removeEventListener: (type: "release", cb: () => void) => void;
}

export function useWakeLock() {
  const sentinelRef = useRef<WakeLockSentinelLike | null>(null);
  const [active, setActive] = useState(false);
  const wantedRef = useRef(false); // Track if user wants wake lock regardless of visibility

  const request = useCallback(async () => {
    wantedRef.current = true;
    try {
      const wl = (navigator as unknown as {
        wakeLock?: { request: (t: "screen") => Promise<WakeLockSentinelLike> }
      }).wakeLock;
      if (!wl) return;

      // Release existing before requesting new
      if (sentinelRef.current) {
        try { await sentinelRef.current.release(); } catch { /* */ }
      }

      const s = await wl.request("screen");
      sentinelRef.current = s;
      setActive(true);

      // Handle unexpected release (e.g., tab goes to background on some browsers)
      const onRelease = () => {
        setActive(false);
        sentinelRef.current = null;
      };
      s.addEventListener("release", onRelease);
    } catch {
      // Wake Lock API not supported or failed
      setActive(false);
    }
  }, []);

  const release = useCallback(async () => {
    wantedRef.current = false;
    try {
      await sentinelRef.current?.release();
    } catch { /* noop */ }
    sentinelRef.current = null;
    setActive(false);
  }, []);

  // Re-acquire wake lock when page becomes visible again
  // This is critical — wake lock is ALWAYS released when tab is hidden
  useEffect(() => {
    if (typeof document === "undefined") return;

    const onVisibility = () => {
      if (document.visibilityState === "visible" && wantedRef.current && !sentinelRef.current) {
        // Re-acquire wake lock — it was lost when tab went to background
        request();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [request]);

  // Also try to re-acquire on focus (some browsers use this instead)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onFocus = () => {
      if (wantedRef.current && !sentinelRef.current) {
        request();
      }
    };

    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [request]);

  return { active, request, release };
}
