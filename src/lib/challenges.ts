import type { HistoryEntry } from "@/hooks/useLocalHistory";

export interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  duration: "week" | "month";
  check: (ctx: ChallengeContext) => { progress: number; target: number; completed: boolean };
}

export interface ChallengeContext {
  history: HistoryEntry[];
  todaySteps: number;
  todayKey: string;
  goal: number;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getWeekEntries(history: HistoryEntry[], todaySteps: number, todayKey: string): Map<string, number> {
  const map = new Map<string, number>();
  history.forEach((h) => map.set(h.date, h.steps));
  map.set(todayKey, todaySteps);
  return map;
}

export const CHALLENGES: Challenge[] = [
  {
    id: "week_100k",
    title: "100k tygodniowo",
    description: "Zrób 100 000 kroków w tym tygodniu",
    icon: "🏃",
    duration: "week",
    check: (ctx) => {
      const map = getWeekEntries(ctx.history, ctx.todaySteps, ctx.todayKey);
      const today = new Date();
      const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
      let total = 0;
      for (let i = 0; i < dayOfWeek; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        total += map.get(dayKey(d)) ?? 0;
      }
      return { progress: total, target: 100000, completed: total >= 100000 };
    },
  },
  {
    id: "week_streak_7",
    title: "Tydzień perfekcyjny",
    description: "Osiągnij dzienny cel 7 dni z rzędu",
    icon: "⭐",
    duration: "week",
    check: (ctx) => {
      const map = getWeekEntries(ctx.history, ctx.todaySteps, ctx.todayKey);
      let streak = 0;
      const d = new Date();
      for (let i = 0; i < 7; i++) {
        const k = dayKey(d);
        if ((map.get(k) ?? 0) >= ctx.goal) streak++;
        else break;
        d.setDate(d.getDate() - 1);
      }
      return { progress: streak, target: 7, completed: streak >= 7 };
    },
  },
  {
    id: "week_15k_daily",
    title: "Wyzwanie 15k",
    description: "Zrób 15 000+ kroków dzisiaj",
    icon: "💎",
    duration: "week",
    check: (ctx) => {
      return { progress: ctx.todaySteps, target: 15000, completed: ctx.todaySteps >= 15000 };
    },
  },
  {
    id: "month_marathon",
    title: "Maraton miesięczny",
    description: "Przejdź 42 km (ok. 55 000 kroków) w miesiącu",
    icon: "🏅",
    duration: "month",
    check: (ctx) => {
      const map = getWeekEntries(ctx.history, ctx.todaySteps, ctx.todayKey);
      const today = new Date();
      const firstOfMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
      let total = 0;
      const d = new Date(firstOfMonth + "T00:00:00");
      while (d <= today) {
        total += map.get(dayKey(d)) ?? 0;
        d.setDate(d.getDate() + 1);
      }
      const target = 55000;
      return { progress: total, target, completed: total >= target };
    },
  },
  {
    id: "month_300k",
    title: "300k miesięcznie",
    description: "Zrób 300 000 kroków w tym miesiącu",
    icon: "🔥",
    duration: "month",
    check: (ctx) => {
      const map = getWeekEntries(ctx.history, ctx.todaySteps, ctx.todayKey);
      const today = new Date();
      const firstOfMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
      let total = 0;
      const d = new Date(firstOfMonth + "T00:00:00");
      while (d <= today) {
        total += map.get(dayKey(d)) ?? 0;
        d.setDate(d.getDate() + 1);
      }
      return { progress: total, target: 300000, completed: total >= 300000 };
    },
  },
  {
    id: "week_no_zero",
    title: "Bez zera",
    description: "Zrób min. 1000 kroków każdego dnia w tygodniu",
    icon: "✊",
    duration: "week",
    check: (ctx) => {
      const map = getWeekEntries(ctx.history, ctx.todaySteps, ctx.todayKey);
      const today = new Date();
      const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
      let daysAbove1k = 0;
      for (let i = 0; i < dayOfWeek; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        if ((map.get(dayKey(d)) ?? 0) >= 1000) daysAbove1k++;
      }
      return { progress: daysAbove1k, target: 7, completed: daysAbove1k >= 7 };
    },
  },
];
