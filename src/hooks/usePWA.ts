import { useCallback, useEffect, useRef, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function usePWA() {
  const [canInstall, setCanInstall] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // SW registration failed — not critical
      });
    }

    // Track online/offline
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    setIsOffline(!navigator.onLine);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);

    // PWA install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const install = useCallback(async () => {
    const prompt = deferredPromptRef.current;
    if (!prompt) return false;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    deferredPromptRef.current = null;
    setCanInstall(false);
    return outcome === "accepted";
  }, []);

  // Check if already installed (standalone mode)
  const isInstalled = typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
     (window.navigator as unknown as { standalone?: boolean }).standalone === true);

  return { canInstall, isOffline, install, isInstalled };
}
