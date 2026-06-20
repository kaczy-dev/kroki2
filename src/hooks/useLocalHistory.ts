import { useCallback, useEffect, useState } from "react";

const KEY = "stepcount.v1";
const SETTINGS_KEY = "stepcount.settings.v1";

export interface HistoryEntry {
  date: string; // YYYY-MM-DD
  steps: number;
}

export interface StoredState {
  today: string;
  steps: number;
  goal: number;
  history: HistoryEntry[];
}

export interface UserSettings {
  stepLengthCm: number; // default 76.2 (average step)
  streakFreezeUsedDate: string | null; // date when freeze was last used
}

const defaultState = (): StoredState => ({
  today: todayKey(),
  steps: 0,
  goal: 10000,
  history: [],
});

const defaultSettings = (): UserSettings => ({
  stepLengthCm: 76.2,
  streakFreezeUsedDate: null,
});

function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function load(): StoredState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as StoredState;
    if (!parsed.today) return defaultState();
    return parsed;
  } catch {
    return defaultState();
  }
}

function loadSettings(): UserSettings {
  if (typeof window === "undefined") return defaultSettings();
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings();
    return { ...defaultSettings(), ...JSON.parse(raw) };
  } catch {
    return defaultSettings();
  }
}

function save(state: StoredState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch { /* noop */ }
}

function saveSettings(settings: UserSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch { /* noop */ }
}

export function useLocalHistory() {
  const [state, setState] = useState<StoredState>(() => defaultState());
  const [settings, setSettingsState] = useState<UserSettings>(() => defaultSettings());
  const [ready, setReady] = useState(false);

  // Hydrate after mount (SSR-safe)
  useEffect(() => {
    const loaded = load();
    const loadedSettings = loadSettings();
    // rollover if date changed since last save
    const t = todayKey();
    if (loaded.today !== t) {
      const rolled: StoredState = {
        ...loaded,
        history: [
          ...loaded.history.filter((h) => h.date !== loaded.today),
          { date: loaded.today, steps: loaded.steps },
        ].slice(-90), // keep 90 days of history
        today: t,
        steps: 0,
      };
      save(rolled);
      setState(rolled);
    } else {
      setState(loaded);
    }
    setSettingsState(loadedSettings);
    setReady(true);
  }, []);

  const updateSteps = useCallback((steps: number) => {
    setState((s) => {
      const t = todayKey();
      if (t !== s.today) {
        const next: StoredState = {
          ...s,
          history: [
            ...s.history.filter((h) => h.date !== s.today),
            { date: s.today, steps: s.steps },
          ].slice(-90),
          today: t,
          steps,
        };
        save(next);
        return next;
      }
      const next = { ...s, steps };
      save(next);
      return next;
    });
  }, []);

  const setGoal = useCallback((goal: number) => {
    setState((s) => {
      const next = { ...s, goal: Math.max(500, Math.min(100000, Math.round(goal))) };
      save(next);
      return next;
    });
  }, []);

  const resetToday = useCallback(() => {
    setState((s) => {
      const next = { ...s, steps: 0 };
      save(next);
      return next;
    });
  }, []);

  const setStepLength = useCallback((cm: number) => {
    setSettingsState((s) => {
      const next = { ...s, stepLengthCm: Math.max(40, Math.min(120, cm)) };
      saveSettings(next);
      return next;
    });
  }, []);

  const exportJson = useCallback(() => {
    const data = JSON.stringify({ ...state, settings }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kroki-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state, settings]);

  const importJson = useCallback((json: string): boolean => {
    try {
      const parsed = JSON.parse(json);
      if (!parsed.today || !Array.isArray(parsed.history)) return false;
      const imported: StoredState = {
        today: parsed.today,
        steps: typeof parsed.steps === "number" ? parsed.steps : 0,
        goal: typeof parsed.goal === "number" ? parsed.goal : 10000,
        history: parsed.history.filter(
          (h: unknown) =>
            typeof h === "object" && h !== null &&
            "date" in h && "steps" in h &&
            typeof (h as HistoryEntry).date === "string" &&
            typeof (h as HistoryEntry).steps === "number"
        ).slice(-90),
      };
      // Merge with existing - imported history takes precedence
      setState((s) => {
        const existingMap = new Map(s.history.map((h) => [h.date, h.steps]));
        imported.history.forEach((h) => existingMap.set(h.date, h.steps));
        const mergedHistory = Array.from(existingMap.entries())
          .map(([date, steps]) => ({ date, steps }))
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(-90);
        const next: StoredState = {
          today: todayKey(),
          steps: imported.today === todayKey() ? imported.steps : s.steps,
          goal: imported.goal,
          history: mergedHistory,
        };
        save(next);
        return next;
      });
      // Import settings if present
      if (parsed.settings && typeof parsed.settings.stepLengthCm === "number") {
        setStepLength(parsed.settings.stepLengthCm);
      }
      return true;
    } catch {
      return false;
    }
  }, [setStepLength]);

  // Yesterday's steps
  const yesterdaySteps = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const k = todayKey(d);
    const entry = state.history.find((h) => h.date === k);
    return entry?.steps ?? 0;
  })();

  // Streak freeze logic: allows 1 missed day per week without breaking streak
  const streakFreezeUsed = (() => {
    if (!settings.streakFreezeUsedDate) return false;
    const freezeDate = new Date(settings.streakFreezeUsedDate + "T00:00:00");
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - freezeDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays < 7; // freeze is active for 7 days
  })();

  // Streak: consecutive days ending today (or yesterday) meeting goal, with freeze support
  const streak = (() => {
    const map = new Map<string, number>();
    state.history.forEach((h) => map.set(h.date, h.steps));
    map.set(state.today, state.steps);
    let count = 0;
    let freezeAvailable = !streakFreezeUsed;
    const d = new Date();
    if ((map.get(todayKey(d)) ?? 0) < state.goal) d.setDate(d.getDate() - 1);
    for (;;) {
      const k = todayKey(d);
      const v = map.get(k) ?? 0;
      if (v >= state.goal) {
        count++;
        d.setDate(d.getDate() - 1);
      } else if (freezeAvailable && count > 0) {
        // Use streak freeze — skip this day
        freezeAvailable = false;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
      if (count > 365) break;
    }
    return count;
  })();

  // Last 7 days (oldest -> newest) including today
  const last7 = (() => {
    const map = new Map<string, number>();
    state.history.forEach((h) => map.set(h.date, h.steps));
    map.set(state.today, state.steps);
    const out: HistoryEntry[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = todayKey(d);
      out.push({ date: k, steps: map.get(k) ?? 0 });
    }
    return out;
  })();

  // #7 Edit historical day
  const editHistoryDay = useCallback((date: string, steps: number) => {
    setState((s) => {
      const filtered = s.history.filter((h) => h.date !== date);
      const next: StoredState = {
        ...s,
        history: [...filtered, { date, steps }].sort((a, b) => a.date.localeCompare(b.date)).slice(-90),
      };
      save(next);
      return next;
    });
  }, []);

  // #18 Export CSV
  const exportCsv = useCallback(() => {
    const rows = ["Data,Kroki,Cel"];
    state.history.forEach((h) => rows.push(`${h.date},${h.steps},${state.goal}`));
    rows.push(`${state.today},${state.steps},${state.goal}`);
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kroki-${todayKey()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state]);

  return {
    state, settings, ready, updateSteps, setGoal, resetToday,
    exportJson, exportCsv, importJson, streak, last7, yesterdaySteps,
    setStepLength, streakFreezeUsed, editHistoryDay,
  };
}
