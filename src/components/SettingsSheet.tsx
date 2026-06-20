import { useEffect, useRef, useState } from "react";
import { Drawer } from "vaul";
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

export function SettingsSheet({
  open, onClose, goal, onGoalChange, onReset, onExport, onImport,
  wakeLockActive, onToggleWakeLock, stepLength, onStepLengthChange, streakFreezeUsed,
}: Props) {
  const [draft, setDraft] = useState(goal);
  const [heightCm, setHeightCm] = useState(Math.round(stepLength / 0.415)); // reverse: step ≈ 41.5% of height
  const { theme, setTheme, isAuto, setAuto } = useTheme();
  const { enabled: soundEnabled, toggle: toggleSound } = useSound();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(goal); }, [goal, open]);
  useEffect(() => { setHeightCm(Math.round(stepLength / 0.415)); }, [stepLength, open]);

  const save = () => {
    onGoalChange(draft);
    onClose();
  };

  const handleHeightChange = (cm: number) => {
    setHeightCm(cm);
    // Step length ≈ 41.5% of height (common approximation)
    onStepLengthChange(Math.round(cm * 0.415 * 10) / 10);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = onImport(reader.result as string);
      if (result) {
        toast("✅ Import udany!", { description: "Dane zostały wczytane." });
      } else {
        toast("❌ Błąd importu", { description: "Nieprawidłowy format pliku." });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleShare = async () => {
    if (typeof navigator === "undefined") return;
    if ("share" in navigator && navigator.share) {
      try {
        await navigator.share({
          title: "Moje kroki — KROKI",
          text: `Dziś: cel ${goal.toLocaleString("pl-PL")} kroków! 🚶 Liczę kroki z KROKI.`,
        });
      } catch { /* cancelled */ }
    } else if ("clipboard" in navigator) {
      await navigator.clipboard.writeText(
        `Dziś: cel ${goal.toLocaleString("pl-PL")} kroków! 🚶 Liczę kroki z KROKI.`
      );
      toast("📋 Skopiowano do schowka!");
    }
  };

  return (
    <Drawer.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-ink/40" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 flex flex-col">
          <div className="mx-auto w-full max-w-md brut-border bg-bg p-5 pb-[env(safe-area-inset-bottom)]">
            {/* Drag handle */}
            <div className="mx-auto mb-4 h-1.5 w-12 bg-ink/30" />

            <div className="flex items-center justify-between">
              <Drawer.Title className="font-display text-xl uppercase">Ustawienia</Drawer.Title>
              <button onClick={onClose} className="brut-border press bg-surface font-display text-xs px-3 py-1">
                ZAMKNIJ
              </button>
            </div>

            <div className="mt-5 space-y-4 max-h-[70dvh] overflow-y-auto">
              {/* Goal */}
              <div>
                <label className="font-display text-xs">DZIENNY CEL</label>
                <div className="mt-2 flex gap-2">
                  <input
                    type="number"
                    value={draft}
                    step={500}
                    min={1000}
                    max={50000}
                    onChange={(e) => setDraft(Number(e.target.value))}
                    className="flex-1 brut-border bg-surface px-3 py-2 font-mono text-lg focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2"
                  />
                  <button onClick={save} className="brut-border brut-shadow press bg-accent text-surface font-display px-4">
                    ZAPISZ
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[5000, 8000, 10000, 12000, 15000].map((g) => (
                    <button
                      key={g}
                      onClick={() => setDraft(g)}
                      className={`brut-border press font-mono text-xs px-2 py-1 ${draft === g ? "bg-ink text-bg" : "bg-surface"}`}
                    >
                      {g.toLocaleString("pl-PL")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step length / height */}
              <div className="brut-border bg-surface p-3">
                <div className="font-display text-xs">WZROST (DŁUGOŚĆ KROKU)</div>
                <div className="text-[11px] font-mono text-muted mt-1">
                  Wzrost: {heightCm} cm → krok: {stepLength.toFixed(1)} cm
                </div>
                <input
                  type="range"
                  min={140}
                  max={210}
                  value={heightCm}
                  onChange={(e) => handleHeightChange(Number(e.target.value))}
                  className="mt-2 w-full accent-accent"
                />
                <div className="flex justify-between text-[9px] font-mono text-muted mt-1">
                  <span>140 cm</span>
                  <span>210 cm</span>
                </div>
              </div>

              {/* Wake Lock */}
              <div className="brut-border bg-surface p-3 flex items-center justify-between">
                <div>
                  <div className="font-display text-xs">EKRAN AKTYWNY</div>
                  <div className="text-[11px] font-mono text-muted">Blokuj wygaszanie ekranu</div>
                </div>
                <button
                  onClick={onToggleWakeLock}
                  aria-label={wakeLockActive ? "Wyłącz blokadę ekranu" : "Włącz blokadę ekranu"}
                  className={`brut-border press font-display text-[10px] px-3 py-2 ${wakeLockActive ? "bg-accent text-surface" : "bg-bg"}`}
                >
                  {wakeLockActive ? "WŁ." : "WYŁ."}
                </button>
              </div>

              {/* Streak freeze info */}
              <div className="brut-border bg-surface p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-display text-xs">STREAK FREEZE 🧊</div>
                    <div className="text-[11px] font-mono text-muted">
                      1 dzień wolny / tydzień nie przerywa serii
                    </div>
                  </div>
                  <div className={`brut-border font-display text-[10px] px-2 py-1 ${streakFreezeUsed ? "bg-muted/30 text-muted" : "bg-success/20 text-ink"}`}>
                    {streakFreezeUsed ? "UŻYTY" : "DOSTĘPNY"}
                  </div>
                </div>
              </div>

              {/* Sound */}
              <div className="brut-border bg-surface p-3 flex items-center justify-between">
                <div>
                  <div className="font-display text-xs">DŹWIĘKI 🔊</div>
                  <div className="text-[11px] font-mono text-muted">Efekty przy milestones</div>
                </div>
                <button
                  onClick={toggleSound}
                  aria-label={soundEnabled ? "Wyłącz dźwięki" : "Włącz dźwięki"}
                  className={`brut-border press font-display text-[10px] px-3 py-2 ${soundEnabled ? "bg-accent text-surface" : "bg-bg"}`}
                >
                  {soundEnabled ? "WŁ." : "WYŁ."}
                </button>
              </div>

              {/* Theme */}
              <div className="brut-border bg-surface p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-display text-xs">MOTYW</div>
                    <div className="text-[11px] font-mono text-muted">
                      {isAuto ? "Automatyczny (system)" : theme === "dark" ? "Ciemny" : "Jasny"}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={setAuto}
                      aria-label="Motyw automatyczny"
                      className={`brut-border press font-display text-[10px] px-2 py-1 ${isAuto ? "bg-ink text-bg" : "bg-bg"}`}
                    >
                      AUTO
                    </button>
                    <button
                      onClick={() => setTheme("light")}
                      aria-label="Motyw jasny"
                      className={`brut-border press font-display text-[10px] px-2 py-1 ${!isAuto && theme === "light" ? "bg-ink text-bg" : "bg-bg"}`}
                    >
                      ☀️
                    </button>
                    <button
                      onClick={() => setTheme("dark")}
                      aria-label="Motyw ciemny"
                      className={`brut-border press font-display text-[10px] px-2 py-1 ${!isAuto && theme === "dark" ? "bg-ink text-bg" : "bg-bg"}`}
                    >
                      🌙
                    </button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={onExport} className="brut-border press bg-surface font-display text-xs py-3">
                  EKSPORT JSON
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="brut-border press bg-surface font-display text-xs py-3"
                >
                  IMPORT JSON
                </button>
                <button
                  onClick={handleShare}
                  className="brut-border press bg-surface font-display text-xs py-3"
                >
                  UDOSTĘPNIJ 📤
                </button>
                <button
                  onClick={() => {
                    if (confirm("Zresetować dzisiejsze kroki?")) onReset();
                  }}
                  className="brut-border press bg-accent text-surface font-display text-xs py-3"
                >
                  RESET DZISIAJ
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImport}
                className="hidden"
              />
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
