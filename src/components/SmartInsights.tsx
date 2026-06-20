import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";
import type { HistoryEntry } from "@/hooks/useLocalHistory";

interface Props {
  stepsToday: number;
  goal: number;
  streak: number;
  yesterdaySteps: number;
  history: HistoryEntry[];
  cadence: number;
  status: string;
}

interface Insight {
  id: string;
  icon: string;
  text: string;
  type: "info" | "warning" | "success";
}

export function SmartInsights({ stepsToday, goal, streak, yesterdaySteps, history, cadence, status }: Props) {
  const insights = useMemo(() => {
    const result: Insight[] = [];
    const now = new Date();
    const hour = now.getHours();
    const minuteOfDay = hour * 60 + now.getMinutes();
    const pct = stepsToday / Math.max(1, goal);

    // 1. Goal forecast — when will you reach goal at current pace?
    if (stepsToday > 0 && stepsToday < goal && cadence > 0 && (status === "active" || status === "demo")) {
      const stepsRemaining = goal - stepsToday;
      const minutesNeeded = Math.round(stepsRemaining / cadence);
      const finishTime = new Date(now.getTime() + minutesNeeded * 60000);
      const timeStr = finishTime.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
      result.push({
        id: "forecast",
        icon: "🎯",
        text: `W tym tempie cel o ~${timeStr} (${minutesNeeded} min)`,
        type: "info",
      });
    }

    // 2. Comparison with yesterday at same time
    if (yesterdaySteps > 0 && stepsToday > 0) {
      // Estimate yesterday's steps at this time of day (proportional)
      const yesterdayAtThisTime = Math.round(yesterdaySteps * (minuteOfDay / (24 * 60)));
      const diff = stepsToday - yesterdayAtThisTime;
      if (Math.abs(diff) > 200) {
        result.push({
          id: "vs-yesterday",
          icon: diff > 0 ? "📈" : "📉",
          text: diff > 0
            ? `+${diff.toLocaleString("pl-PL")} vs wczoraj o tej porze`
            : `${diff.toLocaleString("pl-PL")} vs wczoraj o tej porze`,
          type: diff > 0 ? "success" : "info",
        });
      }
    }

    // 3. Streak danger warning
    if (streak > 0 && pct < 1 && hour >= 18) {
      const remaining = goal - stepsToday;
      result.push({
        id: "streak-danger",
        icon: "⚠️",
        text: `Jeszcze ${remaining.toLocaleString("pl-PL")} kr. do utrzymania serii ${streak}d!`,
        type: "warning",
      });
    }

    // 4. Afternoon nudge
    if (hour >= 13 && hour <= 16 && pct < 0.3 && stepsToday > 0) {
      result.push({
        id: "nudge",
        icon: "💡",
        text: "Masz < 30% celu — czas na spacer!",
        type: "warning",
      });
    }

    // 5. Weekly average context
    if (history.length >= 7) {
      const last7 = history.slice(-7);
      const weekAvg = Math.round(last7.reduce((s, h) => s + h.steps, 0) / 7);
      if (stepsToday > weekAvg && stepsToday > 0) {
        result.push({
          id: "above-avg",
          icon: "⭐",
          text: `Powyżej średniej tygodnia (${(weekAvg / 1000).toFixed(1)}k/d)`,
          type: "success",
        });
      }
    }

    return result.slice(0, 2); // Max 2 insights at once
  }, [stepsToday, goal, streak, yesterdaySteps, history, cadence, status]);

  if (insights.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <AnimatePresence mode="popLayout">
        {insights.map((insight) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, x: -12, height: 0 }}
            animate={{ opacity: 1, x: 0, height: "auto" }}
            exit={{ opacity: 0, x: 12, height: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border ${
              insight.type === "warning" ? "bg-warning/8 border-warning/20" :
              insight.type === "success" ? "bg-success/8 border-success/20" :
              "bg-surface border-ink/8"
            }`}
          >
            <span className="text-base shrink-0">{insight.icon}</span>
            <span className="text-[11px] font-mono text-ink/80 leading-snug">{insight.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
