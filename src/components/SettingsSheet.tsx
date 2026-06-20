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

function SettingRow({ icon, title, subtitle, children }: { icon: string; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-surface rounded-lg border border-ink/8">
      <span className="text-lg shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="font-display text-[11px] tracking-wide">{title}</div>
        {subtitle && <div className="text-[10px] font-mono text-muted mt-0.5">{subtitle}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ active, onToggle, label }: { active: boolean; onToggle: () => void; label?: string }) {
  return (
    <button
      onClick={onToggle}
      aria-label={label}
      className={`relative w-11 h-6 rounded-full transition-colors ${active ? "bg-accent" : "bg-ink/15"}`}
    >
      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-surface shadow-sm transition-transform ${active ? "left-[22px]" : "left-0.5"}`} />
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
    const text = `Mój cel: ${goal.toLocaleString("pl-PL")} kroków/dzień! 🚶 Liczę z KROKI.`;
    if ("share" in navigator && navigator.share) {
      try { await navigator.share({ title: "KROKI", text }); } catch { /* */ }
    } else if ("clipboard" in navigator) {
      await navigator.clipboard.writeText(text);
      toast("📋 Skopiowano!");
    }
  };

  return (
    <Drawer.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl">
          <div className="mx-auto w-full max-w-md bg-bg rounded-t-2xl p-5 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
            {/* Handle */}
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-ink/20" />

            <Drawer.Title className="font-display text-lg">Ustawienia</Drawer.Title>

            <div className="mt-4 space-y-3 max-h-[65dvh] overflow-y-auto overscroll-contain -mx-1 px-1">
              {/* Goal section */}
              <section>
                <div className="text-[9px] font-display text-muted tracking-wider mb-2 px-1">CEL DZIENNY</div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={draft}
                    step={500}
                    min={1000}
                    max={50000}
                    onChange={(e) => setDraft(Number(e.target.value))}
                    className="flex-1 bg-surface border border-ink/10 rounded-lg px-3 py-2.5 font-mono text-lg focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                  <button onClick={save} className="bg-accent text-surface font-display text-xs px-4 rounded-lg active:scale-95 transition-transform">
                    OK
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[5000, 8000, 10000, 12000, 15000].map((g) => (
                    <button
                      key={g}
                      onClick={() => setDraft(g)}
                      className={`font-mono text-[10px] px-2.5 py-1 rounded-full border transition-colors ${draft === g ? "bg-ink text-bg border-ink" : "bg-surface border-ink/10 text-ink/70"}`}
                    >
                      {g >= 10000 ? `${g / 1000}k` : g.toLocaleString("pl-PL")}
                    </button>
                  ))}
                </div>
              </section>

              {/* Body settings */}
              <section>
                <div className="text-[9px] font-display text-muted tracking-wider mb-2 px-1">POMIARY</div>
                <div className="bg-surface rounded-lg border border-ink/8 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-display text-[11px]">📏 Wzrost</div>
                      <div className="text-[10px] font-mono text-muted">{heightCm} cm → krok {stepLength.toFixed(1)} cm</div>
                    </div>
                    <div className="font-mono text-sm text-ink/80">{heightCm}</div>
                  </div>
                  <input
                    type="range"
                    min={140}
                    max={210}
                    value={heightCm}
                    onChange={(e) => handleHeightChange(Number(e.target.value))}
                    className="mt-2 w-full h-1.5 rounded-full appearance-none bg-ink/10 accent-accent"
                  />
                </div>
              </section>

              {/* Toggles */}
              <section>
                <div className="text-[9px] font-display text-muted tracking-wider mb-2 px-1">PREFERENCJE</div>
                <div className="space-y-1.5">
                  <SettingRow icon="📱" title="Ekran aktywny" subtitle="Nie wygaszaj podczas spaceru">
                    <Toggle active={wakeLockActive} onToggle={onToggleWakeLock} label="Wake lock" />
                  </SettingRow>
                  <SettingRow icon="🔊" title="Dźwięki" subtitle="Efekty przy milestones">
                    <Toggle active={soundEnabled} onToggle={toggleSound} label="Sound" />
                  </SettingRow>
                  <SettingRow icon="🧊" title="Streak freeze" subtitle="1 wolny dzień/tydzień">
                    <span className={`text-[10px] font-display px-2 py-1 rounded-full ${streakFreezeUsed ? "bg-ink/10 text-muted" : "bg-success/15 text-success"}`}>
                      {streakFreezeUsed ? "Użyty" : "Gotowy"}
                    </span>
                  </SettingRow>
                </div>
              </section>

              {/* Theme */}
              <section>
                <div className="text-[9px] font-display text-muted tracking-wider mb-2 px-1">WYGLĄD</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {([
                    { key: "auto", label: "Auto", icon: "🌗", check: isAuto, action: setAuto },
                    { key: "light", label: "Jasny", icon: "☀️", check: !isAuto && theme === "light", action: () => setTheme("light") },
                    { key: "dark", label: "Ciemny", icon: "🌙", check: !isAuto && theme === "dark", action: () => setTheme("dark") },
                  ] as const).map((t) => (
                    <button
                      key={t.key}
                      onClick={t.action}
                      className={`flex flex-col items-center gap-1 py-3 rounded-lg border transition-colors ${t.check ? "bg-accent/10 border-accent/30 text-accent" : "bg-surface border-ink/8 text-ink/70"}`}
                    >
                      <span className="text-lg">{t.icon}</span>
                      <span className="text-[9px] font-display">{t.label}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Actions */}
              <section>
                <div className="text-[9px] font-display text-muted tracking-wider mb-2 px-1">DANE</div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button onClick={onExport} className="flex items-center justify-center gap-1.5 bg-surface border border-ink/8 rounded-lg py-3 font-display text-[10px] active:scale-95 transition-transform">
                    <span>📥</span> Eksport
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-1.5 bg-surface border border-ink/8 rounded-lg py-3 font-display text-[10px] active:scale-95 transition-transform">
                    <span>📤</span> Import
                  </button>
                  <button onClick={handleShare} className="flex items-center justify-center gap-1.5 bg-surface border border-ink/8 rounded-lg py-3 font-display text-[10px] active:scale-95 transition-transform">
                    <span>🔗</span> Udostępnij
                  </button>
                  <button
                    onClick={() => { if (confirm("Zresetować dzisiejsze kroki?")) onReset(); }}
                    className="flex items-center justify-center gap-1.5 bg-accent/10 border border-accent/20 rounded-lg py-3 font-display text-[10px] text-accent active:scale-95 transition-transform"
                  >
                    <span>🗑</span> Reset
                  </button>
                </div>
              </section>
            </div>

            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
