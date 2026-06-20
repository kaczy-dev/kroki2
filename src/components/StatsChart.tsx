import { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Tooltip, Cell,
} from "recharts";
import type { HistoryEntry } from "@/hooks/useLocalHistory";

interface Props {
  history: HistoryEntry[];
  todayKey: string;
  todaySteps: number;
  goal: number;
}

const DAY_LABELS = ["N", "P", "W", "Ś", "C", "P", "S"];

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function StatsChart({ history, todayKey, todaySteps, goal }: Props) {
  const [range, setRange] = useState<7 | 14 | 30>(7);

  const data = useMemo(() => {
    const map = new Map<string, number>();
    history.forEach((h) => map.set(h.date, h.steps));
    map.set(todayKey, todaySteps);
    const out: { date: string; label: string; steps: number; isToday: boolean }[] = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = dayKey(d);
      out.push({
        date: k,
        label: range <= 7 ? DAY_LABELS[d.getDay()] : `${d.getDate()}`,
        steps: map.get(k) ?? 0,
        isToday: k === todayKey,
      });
    }
    return out;
  }, [history, todayKey, todaySteps, range]);

  const total = data.reduce((s, d) => s + d.steps, 0);
  const avg = Math.round(total / data.length);
  const best = Math.max(...data.map((d) => d.steps));
  const hitRate = Math.round((data.filter((d) => d.steps >= goal).length / data.length) * 100);

  return (
    <div className="brut-card p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-base">Historia</h2>
        <div className="flex gap-1">
          {([7, 14, 30] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`brut-border press font-display text-[10px] px-2 py-1 ${range === r ? "bg-ink text-bg" : "bg-surface"}`}
            >
              {r}D
            </button>
          ))}
        </div>
      </div>

      <div className="h-56 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fontFamily: "Space Mono, monospace", fill: "var(--ink)" }}
              axisLine={{ stroke: "var(--ink)", strokeWidth: 2 }}
              tickLine={false}
              interval={range > 14 ? 2 : 0}
            />
            <YAxis hide domain={[0, (max: number) => Math.max(max, goal) * 1.1]} />
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
              contentStyle={{
                background: "var(--surface)",
                border: "2.5px solid var(--ink)",
                borderRadius: "4px",
                boxShadow: "4px 4px 0 0 var(--ink)",
                fontFamily: "Space Mono, monospace",
                fontSize: 12,
                padding: "8px 12px",
              }}
              labelStyle={{ fontFamily: "Archivo Black, sans-serif", textTransform: "uppercase", fontSize: 10 }}
              formatter={(v) => [`${Number(v).toLocaleString("pl-PL")} kr.`, "Kroki"]}
            />
            <ReferenceLine y={goal} stroke="var(--ink)" strokeDasharray="4 4" strokeWidth={2} />
            <Bar dataKey="steps" stroke="var(--ink)" strokeWidth={2} radius={[3, 3, 0, 0]}>
              {data.map((d) => (
                <Cell
                  key={d.date}
                  fill={d.steps >= goal ? "var(--accent)" : d.isToday ? "var(--warning)" : "var(--surface)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 text-center">
        <Stat label="ŚREDNIA" value={avg.toLocaleString("pl-PL")} />
        <Stat label="REKORD" value={best.toLocaleString("pl-PL")} />
        <Stat label="SUMA" value={total >= 10000 ? `${(total/1000).toFixed(1)}k` : total.toString()} />
        <Stat label="CEL %" value={`${hitRate}%`} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="brut-border bg-bg p-2">
      <div className="text-[9px] font-display text-muted">{label}</div>
      <div className="font-display text-sm tabular-nums">{value}</div>
    </div>
  );
}
