import type { HistoryEntry } from "@/hooks/useLocalHistory";

/**
 * #1 Auto-cele: sugeruje cel na dzisiaj bazując na historii
 * #2 Detekcja typu aktywności: chód/marsz/bieg
 * #4 Best time of day analysis
 */

export type ActivityType = "idle" | "walk" | "brisk" | "run";

/** Get activity type from cadence (steps/min) */
export function getActivityType(cadence: number): ActivityType {
  if (cadence === 0) return "idle";
  if (cadence < 100) return "walk";
  if (cadence <= 135) return "brisk";
  return "run";
}

export function getActivityLabel(type: ActivityType): string {
  switch (type) {
    case "idle": return "Odpoczynek";
    case "walk": return "Spacer";
    case "brisk": return "Szybki marsz";
    case "run": return "Bieg";
  }
}

export function getActivityEmoji(type: ActivityType): string {
  switch (type) {
    case "idle": return "🧘";
    case "walk": return "🚶";
    case "brisk": return "🏃";
    case "run": return "🏃‍♂️💨";
  }
}

/** Intensity zone based on cadence (proxy for heart rate zones) */
export function getIntensityZone(cadence: number): { zone: number; label: string; color: string } {
  if (cadence === 0) return { zone: 0, label: "Odpoczynek", color: "var(--muted)" };
  if (cadence < 90) return { zone: 1, label: "Lekki spacer", color: "var(--success)" };
  if (cadence < 115) return { zone: 2, label: "Aktywny chód", color: "var(--beer)" };
  if (cadence < 140) return { zone: 3, label: "Intensywny", color: "var(--warning)" };
  return { zone: 4, label: "Wysoka intensywność", color: "var(--accent)" };
}

/** Suggest a goal based on recent history (gradual progression) */
export function suggestGoal(history: HistoryEntry[], currentGoal: number): { suggested: number; reason: string } {
  if (history.length < 3) {
    return { suggested: currentGoal, reason: "Za mało danych — trzymaj obecny cel" };
  }

  const last7 = history.slice(-7);
  const last14 = history.slice(-14);
  const avg7 = Math.round(last7.reduce((s, h) => s + h.steps, 0) / last7.length);
  const avg14 = last14.length >= 7 ? Math.round(last14.reduce((s, h) => s + h.steps, 0) / last14.length) : avg7;

  // How many days of last 7 met the current goal?
  const daysMetGoal = last7.filter((h) => h.steps >= currentGoal).length;

  // If consistently exceeding goal (5+/7 days), suggest increase
  if (daysMetGoal >= 5 && avg7 > currentGoal * 1.1) {
    const newGoal = Math.round((avg7 * 1.05) / 500) * 500; // Round to 500
    return { suggested: Math.min(newGoal, 30000), reason: `Regularnie przekraczasz cel! Czas na ${newGoal.toLocaleString("pl-PL")}?` };
  }

  // If struggling (< 3/7 days), suggest decrease
  if (daysMetGoal <= 2 && avg7 < currentGoal * 0.7) {
    const newGoal = Math.round((avg7 * 1.1) / 500) * 500;
    return { suggested: Math.max(newGoal, 3000), reason: `Może ${newGoal.toLocaleString("pl-PL")} będzie lepszym startem?` };
  }

  // Trending up
  if (avg7 > avg14 * 1.1) {
    return { suggested: currentGoal, reason: `Świetny trend wzrostowy! +${Math.round(((avg7 / avg14) - 1) * 100)}% vs 2 tyg. temu` };
  }

  return { suggested: currentGoal, reason: "Cel dobrze dopasowany do Twojego tempa 👍" };
}

/** Find best time window for walking from history (simplified — based on step density) */
export function getBestTimeHint(stepsToday: number, goal: number): string | null {
  const hour = new Date().getHours();
  const pct = stepsToday / Math.max(1, goal);

  // Afternoon with low progress — suggest walking now
  if (hour >= 14 && hour <= 18 && pct < 0.5) {
    return "Popołudnie to Twój najlepszy czas na spacer!";
  }
  // Evening with good progress
  if (hour >= 19 && pct >= 0.8 && pct < 1) {
    return "Prawie cel! Krótki wieczorny spacer wystarczy";
  }
  return null;
}
