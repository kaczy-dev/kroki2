import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useStepContext } from "@/context/StepProvider";

const TABS = [
  { to: "/", label: "Dziś", icon: (a: boolean) => (
    <svg viewBox="0 0 24 24" width="21" height="21" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={a ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12l9-9 9 9" fill="none" stroke="currentColor" strokeWidth="1.8"/><path d="M5 10v10a1 1 0 001 1h12a1 1 0 001-1V10"/>
    </svg>
  )},
  { to: "/stats", label: "Staty", icon: (a: boolean) => (
    <svg viewBox="0 0 24 24" width="21" height="21" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={a ? 0 : 1.8}>
      <rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="5" width="4" height="16" rx="1"/><rect x="17" y="8" width="4" height="13" rx="1"/>
    </svg>
  )},
  { to: "/achievements", label: "Odznaki", icon: (a: boolean) => (
    <svg viewBox="0 0 24 24" width="21" height="21" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={a ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="9" r="6"/><path d="M9 14.5 7 22l5-3 5 3-2-7.5"/>
    </svg>
  )},
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { stepsToday, goal } = useStepContext();
  const pct = Math.min(1, stepsToday / Math.max(1, goal));

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom)]" aria-label="Nawigacja">
      {/* Frosted glass container */}
      <div className="mx-auto max-w-md">
        <div className="mx-3 mb-2 bg-surface/85 backdrop-blur-2xl rounded-2xl border border-ink/8 shadow-lg overflow-hidden">
          {/* Micro progress at top */}
          <div className="h-[2px] bg-ink/5">
            <motion.div
              className="h-full rounded-full"
              style={{ background: pct >= 1 ? "var(--success)" : "var(--beer)" }}
              initial={false}
              animate={{ width: `${pct * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>

          <div className="grid grid-cols-3 py-2">
            {TABS.map((t) => {
              const active = pathname === t.to;
              return (
                <Link key={t.to} to={t.to} className="flex flex-col items-center justify-center py-1 gap-0.5 relative">
                  <motion.div
                    animate={{ scale: active ? 1 : 0.85, y: active ? -1 : 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                    className={active ? "text-ink" : "text-muted/60"}
                  >
                    {t.icon(active)}
                  </motion.div>
                  <span className={`text-[8px] font-display tracking-wider ${active ? "text-ink" : "text-muted/60"}`}>
                    {t.label}
                  </span>
                  {active && (
                    <motion.div
                      layoutId="tab-active"
                      className="absolute -top-[1px] w-6 h-[2px] rounded-full bg-beer"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
