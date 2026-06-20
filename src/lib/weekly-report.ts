import type { HistoryEntry } from "@/hooks/useLocalHistory";

/**
 * #6 Generate weekly report as shareable image (Canvas API)
 */

export interface WeeklyReportData {
  week: HistoryEntry[];
  goal: number;
  totalSteps: number;
  avgSteps: number;
  bestDay: HistoryEntry;
  daysMetGoal: number;
  totalKm: number;
}

export function getWeeklyReportData(history: HistoryEntry[], todaySteps: number, goal: number, stepLengthCm: number): WeeklyReportData {
  const todayKey = new Date().toISOString().slice(0, 10);
  const map = new Map(history.map((h) => [h.date, h.steps]));
  map.set(todayKey, todaySteps);

  const week: HistoryEntry[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    week.push({ date: k, steps: map.get(k) ?? 0 });
  }

  const totalSteps = week.reduce((s, d) => s + d.steps, 0);
  const avgSteps = Math.round(totalSteps / 7);
  const bestDay = week.reduce((best, d) => d.steps > best.steps ? d : best, week[0]);
  const daysMetGoal = week.filter((d) => d.steps >= goal).length;
  const totalKm = (totalSteps * stepLengthCm) / 100 / 1000;

  return { week, goal, totalSteps, avgSteps, bestDay, daysMetGoal, totalKm };
}

export async function generateReportImage(data: WeeklyReportData): Promise<Blob | null> {
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Background
  ctx.fillStyle = "#fffef8";
  ctx.fillRect(0, 0, 1080, 1080);

  // Polish flag stripe at top
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 1080, 6);
  ctx.fillStyle = "#dc143c";
  ctx.fillRect(540, 0, 540, 6);

  // Title
  ctx.font = "bold 48px 'Arial Black', sans-serif";
  ctx.fillStyle = "#1a1714";
  ctx.textAlign = "center";
  ctx.fillText("KROKI 🇵🇱 — Tydzień", 540, 80);

  // Date range
  ctx.font = "20px 'Courier New', monospace";
  ctx.fillStyle = "#8a7e6e";
  const startDate = new Date(data.week[0].date + "T00:00:00").toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
  const endDate = new Date(data.week[6].date + "T00:00:00").toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
  ctx.fillText(`${startDate} — ${endDate}`, 540, 115);

  // Big stats
  ctx.font = "bold 72px 'Arial Black', sans-serif";
  ctx.fillStyle = "#1a1714";
  ctx.fillText(data.totalSteps.toLocaleString("pl-PL"), 540, 220);
  ctx.font = "24px 'Courier New', monospace";
  ctx.fillStyle = "#8a7e6e";
  ctx.fillText("kroków łącznie", 540, 255);

  // Stats row
  const stats = [
    { label: "Średnia", value: `${(data.avgSteps / 1000).toFixed(1)}k` },
    { label: "Cel", value: `${data.daysMetGoal}/7 dni` },
    { label: "Dystans", value: `${data.totalKm.toFixed(1)} km` },
  ];
  stats.forEach((s, i) => {
    const x = 200 + i * 340;
    ctx.font = "18px 'Courier New', monospace";
    ctx.fillStyle = "#8a7e6e";
    ctx.fillText(s.label, x, 320);
    ctx.font = "bold 36px 'Arial Black', sans-serif";
    ctx.fillStyle = "#1a1714";
    ctx.fillText(s.value, x, 360);
  });

  // Bar chart
  const barY = 420;
  const barH = 400;
  const barW = 100;
  const gap = 20;
  const maxSteps = Math.max(...data.week.map((d) => d.steps), data.goal);
  const chartStart = (1080 - (7 * barW + 6 * gap)) / 2;

  data.week.forEach((d, i) => {
    const x = chartStart + i * (barW + gap);
    const h = (d.steps / maxSteps) * barH * 0.85;
    const y = barY + barH - h;

    // Bar
    ctx.fillStyle = d.steps >= data.goal ? "#dc143c" : "#f59e0b";
    ctx.fillRect(x, y, barW, h);
    ctx.strokeStyle = "#1a1714";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barW, h);

    // Day label
    const dt = new Date(d.date + "T00:00:00");
    ctx.font = "14px 'Courier New', monospace";
    ctx.fillStyle = "#8a7e6e";
    ctx.fillText(dt.toLocaleDateString("pl-PL", { weekday: "short" }).toUpperCase(), x + barW / 2, barY + barH + 25);

    // Step count
    ctx.font = "bold 16px 'Arial', sans-serif";
    ctx.fillStyle = "#1a1714";
    ctx.fillText(d.steps >= 1000 ? `${(d.steps / 1000).toFixed(1)}k` : `${d.steps}`, x + barW / 2, y - 10);
  });

  // Goal line
  const goalY = barY + barH - (data.goal / maxSteps) * barH * 0.85;
  ctx.setLineDash([8, 6]);
  ctx.strokeStyle = "#1a1714";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(chartStart - 10, goalY);
  ctx.lineTo(chartStart + 7 * (barW + gap), goalY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = "14px 'Courier New', monospace";
  ctx.fillStyle = "#1a1714";
  ctx.textAlign = "left";
  ctx.fillText(`CEL ${(data.goal / 1000).toFixed(0)}k`, chartStart + 7 * (barW + gap) + 5, goalY + 5);
  ctx.textAlign = "center";

  // Footer
  ctx.font = "18px 'Courier New', monospace";
  ctx.fillStyle = "#8a7e6e";
  ctx.fillText("🍺 kroki.app — Polak potrafi!", 540, 1020);

  // Beer accent line at bottom
  ctx.fillStyle = "#f59e0b";
  ctx.fillRect(0, 1074, 1080, 6);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

export async function shareWeeklyReport(data: WeeklyReportData): Promise<boolean> {
  const blob = await generateReportImage(data);
  if (!blob) return false;

  const file = new File([blob], "kroki-tydzien.png", { type: "image/png" });

  if ("share" in navigator && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        title: "KROKI — Mój tydzień",
        text: `Mój tydzień: ${data.totalSteps.toLocaleString("pl-PL")} kroków! 🇵🇱`,
        files: [file],
      });
      return true;
    } catch { /* cancelled */ }
  }

  // Fallback: download
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "kroki-tydzien.png";
  a.click();
  URL.revokeObjectURL(url);
  return true;
}
