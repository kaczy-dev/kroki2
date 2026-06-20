import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
import { useSound } from "@/hooks/useSound";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  goal: number;
  onGoalChange: (n: number) => void;
  onReset: () => void;
  onExport: () => void;
  onImport: (json: string) => boolean;
  wakeLockActive: boolean;
  onToggleWakeLock: () => void;
  stepLength: number;
  onStepLengthChange: (cm: number) => void;
  streakFreezeUsed: boolean;
}

function Toggle({ active, onToggle, label }: { active: boolean; onToggle: () => void; label?: string }) {
  return (
    <button
      onClick={onToggle}
      aria-label={label}
      className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${active ? "bg-accent" : "bg-ink/15"}`}
    >
      <motion.div
        animate={{ x: active ? 22 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
      />
    </button>
  );
}

export function SettingsSheet({
  open, onClose, goal, onGoalChange, onReset, onExport, onImport,
  wakeLockActive, onToggleWakeLock, stepLength, onStepLengthChange, streakFreezeUsed,
}: Props) {
  const [draft, setDraft] = useState(goal);
  const [heightCm, setHeightCm] = useState(Math.round(stepLength / 0.415));
  const { theme, setTheme, isAuto, setAuto } = useTheme();
  const { enabled: soundEnabled, toggle: toggleSound } = useSound();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(goal); }, [goal, open]);
  useEffect(() => { setHeightCm(Math.round(stepLength / 0.415)); }, [stepLength, open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const save = () => { onGoalChange(draft); onClose(); };

  const handleHeightChange = (cm: number) => {
    setHeightCm(cm);
    onStepLengthChange(Math.round(cm * 0.415 * 10) / 10);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = onImport(reader.result as string);
      toast(result ? "✅ Import udany!" : "❌ Błąd importu", {
        description: result ? "Dane wczytane." : "Nieprawidłowy format.",
      });
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleShare = async () => {
    if (typeof navigator === "undefined") return;
    const text = `Mój cel: ${goal.toLocaleString("pl-PL")} kroków/dzień! 🚶🇵🇱`;
    if ("share" in navigator && navigator.share) {
      try { await navigator.share({ title: "KROKI", text }); } catch { /* */ }
    } else if ("clipboard" in navigator) {
      await navigator.clipboard.writeText(text);
      toast("📋 Skopiowano!");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] flex flex-col"
          >
            <div className="mx-auto w-full max-w-md bg-bg rounded-t-3xl border-t-2 border-x-2 border-ink flex flex-col max-h-[85dvh]">
              {/* Handle + Header (fixed) */}
              <div className="px-5 pt-3 pb-4 shrink-0">
                {/* Drag handle */}
                <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-ink/20" />

                {/* Header — title centered, close button */}
                <div className="flex items-center justify-between">
                  <div className="w-9" /> {/* spacer */}
                  <h2 className="font-display text-lg text-center">Ustawienia</h2>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={onClose}
                    className="w-9 h-9 grid place-items-center rounded-full bg-ink/10 text-ink"
                    aria-label="Zamknij ustawienia"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] space-y-5">

                {/* === CEL === */}
                <motion.section
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                >
                  <div className="text-[9px] font-display text-muted tracking-widest mb-2">🎯 CEL DZIENNY</div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={draft}
                      step={500}
                      min={1000}
                      max={50000}
                      onChange={(e) => setDraft(Number(e.target.value))}
                      className="flex-1 bg-surface border-2 border-ink rounded-xl px-3 py-2.5 font-mono text-lg focus:outline-none focus:ring-2 focus:ring-accent/50"
                    />
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={save}
                      className="bg-accent text-white font-display text-xs px-5 rounded-xl active:bg-accent/80"
                    >
                      OK
                    </motion.button>
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {[5000, 8000, 10000, 12000, 15000].map((g) => (
                      <motion.button
                        key={g}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setDraft(g)}
                        className={`font-mono text-[10px] px-3 py-1.5 rounded-full border-2 transition-colors ${draft === g ? "bg-ink text-bg border-ink" : "bg-surface border-ink/20 text-ink/70"}`}
                      >
                        {g >= 10000 ? `${g / 1000}k` : g.toLocaleString("pl-PL")}
                      </motion.button>
                    ))}
                  </div>
                </motion.section>

                {/* === POMIARY === */}
                <motion.section
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="text-[9px] font-display text-muted tracking-widest mb-2">📏 POMIARY</div>
                  <div className="bg-surface rounded-xl border-2 border-ink p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-display text-[11px]">Wzrost</div>
                        <div className="text-[10px] font-mono text-muted">{heightCm} cm → krok {stepLength.toFixed(1)} cm</div>
                      </div>
                      <div className="font-display text-lg tabular-nums">{heightCm}</div>
                    </div>
                    <input
                      type="range"
                      min={140}
                      max={210}
                      value={heightCm}
                      onChange={(e) => handleHeightChange(Number(e.target.value))}
                      className="mt-3 w-full h-2 rounded-full appearance-none bg-ink/10 accent-accent"
                    />
                    <div className="flex justify-between text-[8px] font-mono text-muted mt-1">
                      <span>140</span>
                      <span>175</span>
                      <span>210</span>
                    </div>
                  </div>
                </motion.section>

                {/* === PREFERENCJE === */}
                <motion.section
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <div className="text-[9px] font-display text-muted tracking-widest mb-2">⚙️ PREFERENCJE</div>
                  <div className="space-y-2">
                    <div className="bg-surface rounded-xl border-2 border-ink p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">📱</span>
                        <div>
                          <div className="font-display text-[11px]">Ekran aktywny</div>
                          <div className="text-[9px] font-mono text-muted">Nie wygaszaj ekranu</div>
                        </div>
                      </div>
                      <Toggle active={wakeLockActive} onToggle={onToggleWakeLock} label="Wake lock" />
                    </div>

                    <div className="bg-surface rounded-xl border-2 border-ink p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">🔊</span>
                        <div>
                          <div className="font-display text-[11px]">Dźwięki</div>
                          <div className="text-[9px] font-mono text-muted">Efekty milestones</div>
                        </div>
                      </div>
                      <Toggle active={soundEnabled} onToggle={toggleSound} label="Sound" />
                    </div>

                    <div className="bg-surface rounded-xl border-2 border-ink p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">🧊</span>
                        <div>
                          <div className="font-display text-[11px]">Streak freeze</div>
                          <div className="text-[9px] font-mono text-muted">1 dzień wolny/tydzień</div>
                        </div>
                      </div>
                      <span className={`text-[10px] font-display px-2.5 py-1 rounded-full ${streakFreezeUsed ? "bg-ink/10 text-muted" : "bg-success/15 text-success"}`}>
                        {streakFreezeUsed ? "Użyty" : "Gotowy"}
                      </span>
                    </div>
                  </div>
                </motion.section>

                {/* === WYGLĄD === */}
                <motion.section
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="text-[9px] font-display text-muted tracking-widest mb-2">🎨 WYGLĄD</div>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { key: "auto", label: "Auto", icon: "🌗", active: isAuto, action: setAuto },
                      { key: "light", label: "Jasny", icon: "☀️", active: !isAuto && theme === "light", action: () => setTheme("light") },
                      { key: "dark", label: "Ciemny", icon: "🌙", active: !isAuto && theme === "dark", action: () => setTheme("dark") },
                    ] as const).map((t) => (
                      <motion.button
                        key={t.key}
                        whileTap={{ scale: 0.92 }}
                        onClick={t.action}
                        className={`flex flex-col items-center gap-1.5 py-3.5 rounded-xl border-2 transition-all ${t.active ? "bg-accent/10 border-accent text-accent" : "bg-surface border-ink/15 text-ink/60"}`}
                      >
                        <span className="text-xl">{t.icon}</span>
                        <span className="text-[9px] font-display">{t.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.section>

                {/* === DANE === */}
                <motion.section
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <div className="text-[9px] font-display text-muted tracking-widest mb-2">💾 DANE</div>
                  <div className="grid grid-cols-2 gap-2">
                    <motion.button whileTap={{ scale: 0.93 }} onClick={onExport} className="flex items-center justify-center gap-1.5 bg-surface border-2 border-ink rounded-xl py-3.5 font-display text-[10px] active:bg-ink/5">
                      <span>📥</span> Eksport
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.93 }} onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-1.5 bg-surface border-2 border-ink rounded-xl py-3.5 font-display text-[10px] active:bg-ink/5">
                      <span>📤</span> Import
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.93 }} onClick={handleShare} className="flex items-center justify-center gap-1.5 bg-surface border-2 border-ink rounded-xl py-3.5 font-display text-[10px] active:bg-ink/5">
                      <span>🔗</span> Udostępnij
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.93 }}
                      onClick={() => { if (confirm("Zresetować dzisiejsze kroki?")) onReset(); }}
                      className="flex items-center justify-center gap-1.5 bg-accent/10 border-2 border-accent/30 rounded-xl py-3.5 font-display text-[10px] text-accent active:bg-accent/20"
                    >
                      <span>🗑</span> Reset
                    </motion.button>
                  </div>
                </motion.section>

                {/* App info */}
                <div className="text-center pt-2 pb-4">
                  <p className="font-mono text-[8px] text-muted/50">KROKI v1.0 🇵🇱 — Made in Poland</p>
                </div>
              </div>
            </div>

            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
