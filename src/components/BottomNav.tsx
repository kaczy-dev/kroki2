import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";

const TABS = [
  { to: "/", label: "Dziś", ariaLabel: "Strona główna - dzisiejsze kroki", icon: (active: boolean) => (
    <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 2} width="22" height="22" aria-hidden="true">
      <path d="M3 12 12 3l9 9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 10v10a1 1 0 001 1h12a1 1 0 001-1V10" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )},
  { to: "/stats", label: "Staty", ariaLabel: "Statystyki kroków", icon: (active: boolean) => (
    <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 2} width="22" height="22" aria-hidden="true">
      <rect x="3" y="10" width="4" height="11" rx="1" strokeLinecap="round"/>
      <rect x="10" y="3" width="4" height="18" rx="1" strokeLinecap="round"/>
      <rect x="17" y="7" width="4" height="14" rx="1" strokeLinecap="round"/>
    </svg>
  )},
  { to: "/achievements", label: "Odznaki", ariaLabel: "Odznaki i osiągnięcia", icon: (active: boolean) => (
    <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 2} width="22" height="22" aria-hidden="true">
      <circle cx="12" cy="9" r="6" strokeLinecap="round"/>
      <path d="M9 14.5 7 22l5-3 5 3-2-7.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )},
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const haptic = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try { navigator.vibrate(3); } catch { /* noop */ }
    }
  };

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-surface/80 backdrop-blur-xl border-t border-ink/10 pb-[env(safe-area-inset-bottom)]" aria-label="Nawigacja główna">
      <div className="mx-auto max-w-md grid grid-cols-3 py-1">
        {TABS.map((t) => {
          const active = pathname === t.to;
          return (
            <Link
              key={t.to}
              to={t.to}
              onClick={haptic}
              aria-label={t.ariaLabel}
              aria-current={active ? "page" : undefined}
              className="relative flex flex-col items-center justify-center py-2 gap-0.5"
            >
              <motion.div
                animate={active ? { scale: 1, y: 0 } : { scale: 0.9, y: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={active ? "text-accent" : "text-muted"}
              >
                {t.icon(active)}
              </motion.div>
              <span className={`text-[9px] font-display tracking-wide ${active ? "text-accent" : "text-muted"}`}>
                {t.label}
              </span>
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full bg-accent"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
