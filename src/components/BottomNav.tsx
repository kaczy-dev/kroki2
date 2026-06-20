import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useStepContext } from "@/context/StepProvider";

const TABS = [
  { to: "/", label: "Dziś", ariaLabel: "Strona główna", icon: (active: boolean) => (
    <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 2} width="22" height="22" aria-hidden="true">
      <path d="M3 12 12 3l9 9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 10v10a1 1 0 001 1h12a1 1 0 001-1V10" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )},
  { to: "/stats", label: "Staty", ariaLabel: "Statystyki", icon: (active: boolean) => (
    <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 2} width="22" height="22" aria-hidden="true">
      <rect x="3" y="10" width="4" height="11" rx="1"/>
      <rect x="10" y="3" width="4" height="18" rx="1"/>
      <rect x="17" y="7" width="4" height="14" rx="1"/>
    </svg>
  )},
  { to: "/achievements", label: "Odznaki", ariaLabel: "Odznaki", icon: (active: boolean) => (
    <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 2} width="22" height="22" aria-hidden="true">
      <circle cx="12" cy="9" r="6"/>
      <path d="M9 14.5 7 22l5-3 5 3-2-7.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )},
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { stepsToday, goal } = useStepContext();
  const progressPct = Math.min(100, (stepsToday / Math.max(1, goal)) * 100);

  const haptic = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try { navigator.vibrate(3); } catch { /* noop */ }
    }
  };

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-surface/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]" aria-label="Nawigacja główna">
      {/* 🇵🇱 Polish flag progress bar */}
      <div className="h-[3px] relative overflow-hidden">
        <div className="absolute inset-0 flex">
          <div className="flex-1 bg-polska-white/30" />
          <div className="flex-1 bg-polska-red/30" />
        </div>
        <motion.div
          className="h-full bg-polska-red"
          initial={false}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      <div className="mx-auto max-w-md grid grid-cols-3 py-1.5">
        {TABS.map((t) => {
          const active = pathname === t.to;
          return (
            <Link
              key={t.to}
              to={t.to}
              onClick={haptic}
              aria-label={t.ariaLabel}
              aria-current={active ? "page" : undefined}
              className="relative flex flex-col items-center justify-center py-1.5 gap-0.5"
            >
              <motion.div
                animate={active ? { scale: 1, y: -1 } : { scale: 0.85, y: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={active ? "text-accent" : "text-muted"}
              >
                {t.icon(active)}
              </motion.div>
              <span className={`text-[9px] font-display tracking-wide transition-colors ${active ? "text-accent" : "text-muted"}`}>
                {t.label}
              </span>
              {active && (
                <motion.div
                  layoutId="nav-dot"
                  className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
