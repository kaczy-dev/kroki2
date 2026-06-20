export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  threshold?: number;
  check: (ctx: AchievementContext) => boolean;
}

export interface AchievementContext {
  stepsToday: number;
  goal: number;
  streak: number;
  lifetimeSteps: number;
  hourOfDay: number;
  daysAbove5k: number; // out of last 7
  history: { date: string; steps: number }[];
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_step",
    title: "Pierwszy krok",
    description: "Postaw pierwszy krok",
    icon: "👣",
    check: (c) => c.stepsToday >= 1,
  },
  {
    id: "explorer",
    title: "Odkrywca",
    description: "1 000 kroków w jeden dzień",
    icon: "🧭",
    threshold: 1000,
    check: (c) => c.stepsToday >= 1000,
  },
  {
    id: "half_way",
    title: "Półmetek",
    description: "5 000 kroków w jeden dzień",
    icon: "⚡",
    threshold: 5000,
    check: (c) => c.stepsToday >= 5000,
  },
  {
    id: "goal_hit",
    title: "Cel osiągnięty",
    description: "Zdobądź dzienny cel",
    icon: "🎯",
    check: (c) => c.stepsToday >= c.goal,
  },
  {
    id: "early_bird",
    title: "Ranny ptaszek",
    description: "Cel zdobyty przed 12:00",
    icon: "🌅",
    check: (c) => c.stepsToday >= c.goal && c.hourOfDay < 12,
  },
  {
    id: "marathon",
    title: "Maraton",
    description: "20 000 kroków w jeden dzień",
    icon: "🏃",
    threshold: 20000,
    check: (c) => c.stepsToday >= 20000,
  },
  {
    id: "streak_3",
    title: "Seria 3 dni",
    description: "3 dni z rzędu z celem",
    icon: "🔥",
    check: (c) => c.streak >= 3,
  },
  {
    id: "streak_7",
    title: "Seria 7 dni",
    description: "Tydzień z rzędu z celem",
    icon: "🔥🔥",
    check: (c) => c.streak >= 7,
  },
  {
    id: "streak_30",
    title: "Seria miesiąca",
    description: "30 dni z rzędu z celem",
    icon: "👑",
    check: (c) => c.streak >= 30,
  },
  {
    id: "consistency_week",
    title: "Konsekwencja",
    description: "7 dni z >5 000 kroków",
    icon: "🧱",
    check: (c) => c.daysAbove5k >= 7,
  },
  {
    id: "total_100k",
    title: "Setka tysięcy",
    description: "100 000 kroków łącznie",
    icon: "💯",
    threshold: 100000,
    check: (c) => c.lifetimeSteps >= 100000,
  },
];
