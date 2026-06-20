import { useMemo } from "react";
import type { HistoryEntry } from "@/hooks/useLocalHistory";

interface Props {
  history: HistoryEntry[];
  todayKey: string;
  todaySteps: number;
  goal: number;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function YearHeatmap({ history, todayKey: today, todaySteps, goal }: Props) {
  const { weeks, months } = useMemo(() => {
    const map = new Map<string, number>();
    history.forEach((h) => map.set(h.date, h.steps));
    map.set(today, todaySteps);

    // Build 52 weeks (364 days) ending today
    const totalDays = 364;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - totalDays + 1);
    // Align to Monday
    const startDay = startDate.getDay();
    const offset = startDay === 0 ? 6 : startDay - 1;
    startDate.setDate(startDate.getDate() - offset);

    const weeks: Array<Array<{ date: string; steps: number; level: number } | null>> = [];
    const d = new Date(startDate);
    const now = new Date();

    let currentWeek: Array<{ date: string; steps: number; level: number } | null> = [];
    const monthLabels: Array<{ label: string; weekIdx: number }> = [];
    let lastMonth = -1;

    while (d <= now || currentWeek.length > 0) {
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      if (d > now) {
        currentWeek.push(null);
        d.setDate(d.getDate() + 1);
        if (currentWeek.length === 7) {
          weeks.push(currentWeek);
          break;
        }
        continue;
      }

      const k = dayKey(d);
      const steps = map.get(k) ?? 0;
      const pct = steps / Math.max(1, goal);
      const level = steps === 0 ? 0 : pct >= 1 ? 4 : pct >= 0.75 ? 3 : pct >= 0.5 ? 2 : 1;

      // Track month labels
      if (d.getMonth() !== lastMonth) {
        lastMonth = d.getMonth();
        monthLabels.push({
          label: d.toLocaleDateString("pl-PL", { month: "short" }),
          weekIdx: weeks.length,
        });
      }

      currentWeek.push({ date: k, steps, level });
      d.setDate(d.getDate() + 1);
    }

    if (currentWeek.length > 0 && currentWeek.length <= 7) {
      while (currentWeek.length < 7) currentWeek.push(null);
      weeks.push(currentWeek);
    }

    return { weeks, months: monthLabels };
  }, [history, today, todaySteps, goal]);

  const levelColors = [
    "var(--bg)",      // 0: no steps
    "var(--muted)",   // 1: <50%
    "var(--ink)",     // 2: 50-75% (opacity will be lowered)
    "var(--accent)",  // 3: 75-100%
    "var(--accent)",  // 4: ≥100% goal
  ];

  const levelOpacity = [0.15, 0.3, 0.25, 0.6, 1];

  return (
    <div className="brut-card p-4">
      <h2 className="text-base mb-3">Rok aktywności</h2>

      {/* Month labels */}
      <div className="flex mb-1 ml-7 gap-0 overflow-hidden">
        {months.map((m, i) => (
          <div
            key={i}
            className="text-[8px] font-mono text-muted uppercase"
            style={{ position: "relative", left: `${m.weekIdx * 11}px` }}
          >
            {i % 2 === 0 ? m.label : ""}
          </div>
        ))}
      </div>

      {/* Heatmap grid */}
      <div className="flex gap-[2px] overflow-x-auto">
        {/* Day labels */}
        <div className="flex flex-col gap-[2px] shrink-0 mr-1">
          {["P", "", "Ś", "", "P", "", "N"].map((label, i) => (
            <div key={i} className="w-4 h-[10px] text-[7px] font-mono text-muted leading-[10px]">
              {label}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[2px]">
            {week.map((day, di) => (
              <div
                key={di}
                className="w-[10px] h-[10px] border border-ink/10"
                style={{
                  background: day ? levelColors[day.level] : "transparent",
                  opacity: day ? levelOpacity[day.level] : 0.05,
                }}
                title={day ? `${day.date}: ${day.steps.toLocaleString("pl-PL")} kroków` : ""}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-2 text-[9px] font-mono text-muted">
        <span>Mniej</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className="w-[10px] h-[10px] border border-ink/10"
            style={{
              background: levelColors[level],
              opacity: levelOpacity[level],
            }}
          />
        ))}
        <span>Więcej</span>
      </div>
    </div>
  );
}
