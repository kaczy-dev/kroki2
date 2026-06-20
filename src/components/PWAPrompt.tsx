import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { usePWA } from "@/hooks/usePWA";

export function PWAPrompt() {
  const { canInstall, install, isInstalled } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!canInstall || isInstalled || dismissed) return;
    // Show after 30s of usage
    const timer = setTimeout(() => setShow(true), 30000);
    return () => clearTimeout(timer);
  }, [canInstall, isInstalled, dismissed]);

  const handleInstall = async () => {
    await install();
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-20 inset-x-4 z-50 mx-auto max-w-sm"
        >
          <div className="bg-surface border border-ink/10 rounded-2xl p-4 shadow-lg flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-xl grid place-items-center text-surface font-display text-lg shrink-0">
              K
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display text-[12px]">Zainstaluj KROKI</div>
              <div className="text-[10px] font-mono text-muted mt-0.5">Szybszy dostęp z ekranu głównego</div>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button
                onClick={() => { setDismissed(true); setShow(false); }}
                className="text-[10px] font-display text-muted px-2 py-1.5"
              >
                Nie
              </button>
              <button
                onClick={handleInstall}
                className="text-[10px] font-display bg-accent text-surface px-3 py-1.5 rounded-lg"
              >
                Instaluj
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function OfflineIndicator() {
  const { isOffline } = usePWA();

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-0 inset-x-0 z-[60] bg-warning/90 text-ink text-center py-1.5 font-mono text-[10px]"
        >
          📡 Offline — dane zapisują się lokalnie
        </motion.div>
      )}
    </AnimatePresence>
  );
}
