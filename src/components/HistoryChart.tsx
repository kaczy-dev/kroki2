import type { HistoryEntry } from "@/hooks/useLocalHistory";

const DAY_LABELS = ["N", "P", "W", "Ś", "C", "P", "S"]; // Sun..Sat (pl short)

export function HistoryChart({ data, goal }: { data: HistoryEntry[]; goal: number }) {
  const max = Math.max(goal, ...data.map((d) => d.steps), 1);
  return (
    <div className="brut-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm">Ostatnie 7 dni</h3>
        <span className="text-[10px] font-mono text-muted">CEL {goal.toLocaleString("pl-PL")}</span>
      </div>
      <div className="mt-4 flex items-end gap-2 h-40">
        {data.map((d, i) => {
          const h = (d.steps / max) * 100;
          const hit = d.steps >= goal;
          const dayIdx = new Date(d.date + "T00:00:00").getDay();
          const isToday = i === data.length - 1;
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex-1 flex items-end">
                <div
                  className="w-full brut-border"
                  style={{
                    height: `${Math.max(h, 3)}%`,
                    background: hit ? "var(--accent)" : "var(--surface)",
                  }}
                  title={`${d.date}: ${d.steps}`}
                />
              </div>
              <div className={`text-[10px] font-display ${isToday ? "bg-ink text-bg px-1" : ""}`}>
                {DAY_LABELS[dayIdx]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
