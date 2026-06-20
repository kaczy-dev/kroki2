import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
import { useSound } from "@/hooks/useSound";
import { useBatterySaver } from "@/hooks/useBatterySaver";
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

// === BUILDING BLOCKS ===

function Toggle({ active, onToggle, label }: { active: boolean; onToggle: () => void; label?: string }) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onToggle}
      aria-label={label}
      className={`relative w-[52px] h-[30px] rounded-full transition-colors duration-300 ${active ? "bg-beer" : "bg-ink/12"}`}
    >
      <motion.div
        animate={{ x: active ? 24 : 3 }}
        transition={{ type: "spring", stiffness: 500, damping: 28 }}
        className="absolute top-[3px] w-6 h-6 rounded-full bg-white shadow-lg"
      />
    </motion.button>
  );
}

function SettingRow({ icon, title, sub, children, onTap }: {
  icon: string; title: string; sub?: string; children?: React.ReactNode; onTap?: () => void;
}) {
  return (
    <motion.div
      whileTap={onTap ? { scale: 0.98, backgroundColor: "var(--ink)", opacity: 0.05 } : undefined}
      onClick={onTap}
      className={`flex items-center gap-3 p-3.5 rounded-2xl bg-surface/80 border border-ink/8 ${onTap ? "cursor-pointer active:bg-ink/5" : ""}`}
    >
      <span className="text-[18px] w-7 text-center shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="font-display text-[12px] leading-tight">{title}</div>
        {sub && <div className="text-[9px] font-mono text-muted mt-0.5 truncate">{sub}</div>}
      </div>
      {children}
    </motion.div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[9px] font-display text-muted/70 tracking-[0.15em] uppercase pl-1 mb-1.5">
      {children}
    </div>
  );
}

// === MAIN COMPONENT ===

export function SettingsSheet({
  open, onClose, goal, onGoalChange, onReset, onExport, onImport,
  wakeLockActive, onToggleWakeLock, stepLength, onStepLengthChange, streakFreezeUsed,
}: Props) {
  const [draft, setDraft] = useState(goal);
  const [heightCm, setHeightCm] = useState(Math.round(stepLength / 0.415));
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const { theme, setTheme, isAuto, setAuto } = useTheme();
  const { enabled: soundEnabled, toggle: toggleSound } = useSound();
  const { active: batterySaver, toggle: toggleBatterySaver } = useBatterySaver();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag to dismiss
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 300], [1, 0.3]);

  useEffect(() => { setDraft(goal); }, [goal, open]);
  useEffect(() => { setHeightCm(Math.round(stepLength / 0.415)); }, [stepLength, open]);
  useEffect(() => { if (!open) setActiveSection(null); }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleDragEnd = useCallback((_: unknown, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  }, [onClose]);

  const saveGoal = () => {
    onGoalChange(draft);
    toast("✅ Cel zapisany!", { duration: 1500 });
    setActiveSection(null);
  };

  const handleHeightChange = (cm: number) => {
    setHeightCm(cm);
    onStepLengthChange(Math.round(cm * 0.415 * 10) / 10);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = onImport(reader.result as string);
      toast(ok ? "✅ Dane zaimportowane!" : "❌ Nieprawidłowy plik");
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleShare = async () => {
    const text = `Mój cel: ${goal.toLocaleString("pl-PL")} kroków/dzień! 🍺🇵🇱 #KROKI`;
    if (typeof navigator !== "undefined" && "share" in navigator && navigator.share) {
      try { await navigator.share({ title: "KROKI", text }); } catch { /* */ }
    } else if (typeof navigator !== "undefined" && "clipboard" in navigator) {
      await navigator.clipboard.writeText(text);
      toast("📋 Skopiowano!");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[6px]"
            onClick={onClose}
          />

          {/* Bottom sheet with drag */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "110%" }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            style={{ y, opacity }}
            className="fixed inset-x-0 bottom-0 z-50"
          >
            <div className="mx-auto w-full max-w-[420px] bg-bg rounded-t-[28px] shadow-2xl flex flex-col max-h-[88dvh] overflow-hidden">

              {/* === HEADER === */}
              <div className="pt-2 pb-3 px-5 shrink-0">
                {/* Pill drag indicator */}
                <div className="mx-auto w-9 h-[5px] rounded-full bg-ink/15 mb-3" />
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-[17px]">Ustawienia</h2>
                  <motion.button
                    whileTap={{ scale: 0.8, rotate: 90 }}
                    onClick={onClose}
                    className="w-8 h-8 grid place-items-center rounded-full bg-ink/8 active:bg-ink/15"
                    aria-label="Zamknij"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>
              </div>

              {/* === SCROLLABLE BODY === */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(env(safe-area-inset-bottom),16px)] space-y-4">

                {/* --- QUICK GOAL --- */}
                <section>
                  <SectionHeader>Cel dzienny</SectionHeader>
                  <div className="bg-surface/80 rounded-2xl border border-ink/8 p-4">
                    <div className="flex items-center gap-3">
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => setDraft((d) => Math.max(1000, d - 1000))}
                        className="w-10 h-10 grid place-items-center rounded-full border-2 border-ink/20 font-display text-lg active:bg-ink/5"
                      >−</motion.button>
                      <div className="flex-1 text-center">
                        <div className="font-display text-3xl tabular-nums">{draft.toLocaleString("pl-PL")}</div>
                        <div className="text-[9px] font-mono text-muted mt-0.5">kroków / dzień</div>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => setDraft((d) => Math.min(50000, d + 1000))}
                        className="w-10 h-10 grid place-items-center rounded-full border-2 border-ink/20 font-display text-lg active:bg-ink/5"
                      >+</motion.button>
                    </div>
                    {/* Presets */}
                    <div className="mt-3 flex justify-center gap-1.5">
                      {[5000, 8000, 10000, 12000, 15000].map((g) => (
                        <motion.button
                          key={g}
                          whileTap={{ scale: 0.88 }}
                          onClick={() => setDraft(g)}
                          className={`text-[9px] font-mono px-2.5 py-1 rounded-full transition-all ${draft === g ? "bg-ink text-bg" : "bg-ink/5 text-ink/60"}`}
                        >
                          {g >= 10000 ? `${g / 1000}k` : (g / 1000).toFixed(0) + "k"}
                        </motion.button>
                      ))}
                    </div>
                    {/* Save button (only if changed) */}
                    <AnimatePresence>
                      {draft !== goal && (
                        <motion.button
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: 40, marginTop: 12 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={saveGoal}
                          className="w-full rounded-xl bg-beer text-white font-display text-[12px] active:bg-beer/80"
                        >
                          Zapisz {draft.toLocaleString("pl-PL")} ✓
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </section>

                {/* --- BODY --- */}
                <section>
                  <SectionHeader>Ciało</SectionHeader>
                  <div className="bg-surface/80 rounded-2xl border border-ink/8 p-4">
                    <div className="flex items-baseline justify-between">
                      <span className="font-display text-[11px]">📏 Wzrost</span>
                      <span className="font-mono text-[13px] tabular-nums font-bold">{heightCm} cm</span>
                    </div>
                    <input
                      type="range" min={140} max={210} value={heightCm}
                      onChange={(e) => handleHeightChange(Number(e.target.value))}
                      className="mt-2.5 w-full h-[6px] rounded-full appearance-none bg-ink/8 accent-beer"
                    />
                    <div className="mt-1.5 flex justify-between items-center">
                      <span className="text-[8px] font-mono text-muted">140</span>
                      <span className="text-[9px] font-mono text-beer">krok: {stepLength.toFixed(1)} cm</span>
                      <span className="text-[8px] font-mono text-muted">210</span>
                    </div>
                  </div>
                </section>

                {/* --- TOGGLES --- */}
                <section>
                  <SectionHeader>Preferencje</SectionHeader>
                  <div className="space-y-1.5">
                    <SettingRow icon="📱" title="Ekran aktywny" sub="Ekran nie gaśnie podczas chodzenia">
                      <Toggle active={wakeLockActive} onToggle={onToggleWakeLock} label="Wake lock" />
                    </SettingRow>
                    <SettingRow icon="🔊" title="Dźwięki" sub="Efekty przy milestone'ach">
                      <Toggle active={soundEnabled} onToggle={toggleSound} label="Dźwięki" />
                    </SettingRow>
                    <SettingRow icon="🔋" title="Tryb oszczędny" sub="Wyłącza animacje, oszczędza baterię">
                      <Toggle active={batterySaver} onToggle={toggleBatterySaver} label="Battery" />
                    </SettingRow>
                    <SettingRow icon="🧊" title="Streak freeze" sub="1 dzień wolny / tydzień bez utraty serii">
                      <span className={`text-[10px] font-display px-2.5 py-1 rounded-full ${streakFreezeUsed ? "bg-ink/8 text-muted" : "bg-success/12 text-success"}`}>
                        {streakFreezeUsed ? "Użyty" : "✓ Gotowy"}
                      </span>
                    </SettingRow>
                  </div>
                </section>

                {/* --- THEME --- */}
                <section>
                  <SectionHeader>Wygląd</SectionHeader>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: "auto", label: "Auto", icon: "🌗", isActive: isAuto, action: setAuto },
                      { key: "light", label: "Jasny", icon: "☀️", isActive: !isAuto && theme === "light", action: () => setTheme("light") },
                      { key: "dark", label: "Ciemny", icon: "🌙", isActive: !isAuto && theme === "dark", action: () => setTheme("dark") },
                    ].map((t) => (
                      <motion.button
                        key={t.key}
                        whileTap={{ scale: 0.9 }}
                        onClick={t.action}
                        className={`flex flex-col items-center gap-1 py-3 rounded-2xl border transition-all duration-200 ${t.isActive ? "bg-beer/12 border-beer/40 shadow-sm" : "bg-surface/60 border-ink/8"}`}
                      >
                        <span className="text-xl">{t.icon}</span>
                        <span className={`text-[9px] font-display ${t.isActive ? "text-beer" : "text-muted"}`}>{t.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </section>

                {/* --- DATA --- */}
                <section>
                  <SectionHeader>Dane</SectionHeader>
                  <div className="grid grid-cols-2 gap-1.5">
                    <SettingRow icon="📥" title="Eksport" onTap={onExport} />
                    <SettingRow icon="📤" title="Import" onTap={() => fileInputRef.current?.click()} />
                    <SettingRow icon="🔗" title="Udostępnij" onTap={handleShare} />
                    <SettingRow icon="📊" title="Eksport CSV" onTap={() => {
                      // Will use exportCsv from context when available
                      toast("📊 CSV — dostępne wkrótce");
                    }} />
                  </div>
                </section>

                {/* --- DANGER ZONE --- */}
                <section>
                  <SectionHeader>Strefa niebezpieczna</SectionHeader>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { if (confirm("Na pewno zresetować dzisiejsze kroki? (Możesz cofnąć przez 7s)")) onReset(); }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-accent/8 border border-accent/20 text-accent font-display text-[11px] active:bg-accent/15"
                  >
                    🗑 Resetuj dzisiejsze kroki
                  </motion.button>
                </section>

                {/* --- ABOUT --- */}
                <section className="text-center pb-6 pt-2 space-y-1">
                  <p className="font-display text-[10px] text-ink/30">KROKI v1.0</p>
                  <p className="font-mono text-[8px] text-ink/20">🇵🇱 Zrobione w Polsce · 🍺 Na zdrowie!</p>
                </section>
              </div>
            </div>
          </motion.div>

          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
        </>
      )}
    </AnimatePresence>
  );
}
