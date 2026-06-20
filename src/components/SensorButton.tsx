import { motion, AnimatePresence } from "framer-motion";
import type { SensorStatus } from "@/hooks/useStepCounter";
import { useRef } from "react";

interface Props {
  status: SensorStatus;
  paused: boolean;
  onStart: () => void;
  onManual: () => void;
  onDemo: () => void;
  onStop: () => void;
  onTogglePause: () => void;
  onAddStep: (n?: number) => void;
}

const STATUS_LABEL: Record<SensorStatus, string> = {
  idle: "Gotowy",
  requesting: "Łączenie…",
  active: "Sensor aktywny",
  denied: "Brak zgody",
  unsupported: "Brak sensora",
  manual: "Tryb ręczny",
  demo: "Demo aktywne",
};

export function SensorButton({
  status, paused, onStart, onManual, onDemo, onStop, onTogglePause, onAddStep,
}: Props) {
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heldRef = useRef(false);

  const startHold = () => {
    heldRef.current = false;
    holdTimer.current = setTimeout(() => {
      heldRef.current = true;
      onAddStep(10);
    }, 400);
  };
  const endHold = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (!heldRef.current) onAddStep(1);
  };

  const isActive = status === "active" || status === "demo" || status === "manual";

  return (
    <div className="brut-card p-4 overflow-hidden">
      {/* Status indicator */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <motion.div
            animate={isActive && !paused
              ? { scale: [1, 1.4, 1], opacity: [1, 0.7, 1] }
              : { scale: 1 }
            }
            transition={isActive ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" } : {}}
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{
              background: isActive ? "var(--success)" :
                (status === "denied" || status === "unsupported") ? "var(--accent)" : "var(--muted)",
            }}
          />
          <span className="font-display text-[11px] tracking-wide truncate">
            {STATUS_LABEL[status]}{paused && " · Pauza"}
          </span>
        </div>
        {isActive && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onTogglePause}
            className="brut-border bg-bg press font-display text-[10px] px-2.5 py-1 rounded-sm"
          >
            {paused ? "Wznów" : "Pauza"}
          </motion.button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* Idle state */}
        {!isActive && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onStart}
              className="w-full brut-border press bg-accent text-surface font-display text-base py-3.5 uppercase rounded-sm relative overflow-hidden"
            >
              {status === "requesting" ? (
                <>
                  <span className="relative z-10">Łączenie…</span>
                  <motion.div
                    className="absolute inset-0 bg-white/10"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                  />
                </>
              ) : (
                "Aktywuj sensor"
              )}
            </motion.button>
            <div className="grid grid-cols-2 gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onManual}
                className="brut-border press bg-surface font-display text-[11px] py-2.5 rounded-sm"
              >
                ✋ Ręcznie
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onDemo}
                className="brut-border press bg-surface font-display text-[11px] py-2.5 rounded-sm"
              >
                🎮 Demo
              </motion.button>
            </div>
            {(status === "denied" || status === "unsupported") && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] font-mono text-muted leading-snug"
              >
                {status === "denied"
                  ? "Odmowa dostępu. Użyj trybu ręcznego lub demo."
                  : "Brak akcelerometru w przeglądarce."}
              </motion.p>
            )}
          </motion.div>
        )}

        {/* Manual mode — tap button */}
        {status === "manual" && (
          <motion.div
            key="manual"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <motion.button
              whileTap={{ scale: 0.93 }}
              onPointerDown={startHold}
              onPointerUp={endHold}
              onPointerLeave={() => holdTimer.current && clearTimeout(holdTimer.current)}
              className="w-full brut-border brut-shadow press bg-accent text-surface font-display text-xl py-7 uppercase select-none rounded-sm"
            >
              <motion.span
                key="tap"
                initial={{ scale: 1 }}
                className="block"
              >
                +1 Krok
              </motion.span>
              <div className="text-[9px] mt-1 opacity-70 font-mono normal-case">przytrzymaj = +10</div>
            </motion.button>
          </motion.div>
        )}

        {/* Active — stop button */}
        {isActive && status !== "manual" && (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          />
        )}
      </AnimatePresence>

      {/* Stop session — always visible when active */}
      {isActive && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onStop}
          className="mt-3 w-full brut-border press bg-surface font-display text-[11px] py-2.5 rounded-sm"
        >
          Zatrzymaj sesję
        </motion.button>
      )}
    </div>
  );
}
