import { useCallback, useEffect, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "kroki.theme";

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(STORAGE_KEY);
  return v === "light" || v === "dark" ? v : null;
}

function getResolvedTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme();
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  // Update meta theme-color for mobile browsers
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", theme === "dark" ? "#0e0c0a" : "#fffef8");
  }
}

// Simple external store for cross-component reactivity
let listeners: Array<() => void> = [];
let currentTheme: Theme = "light";

function subscribe(cb: () => void) {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}

function getSnapshot() {
  return currentTheme;
}

function emitChange(theme: Theme) {
  currentTheme = theme;
  applyTheme(theme);
  listeners.forEach((l) => l());
}

// Initialize on first import (client only)
if (typeof window !== "undefined") {
  currentTheme = getResolvedTheme();
  // Apply immediately to prevent flash
  applyTheme(currentTheme);

  // Listen for system preference changes
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (!getStoredTheme()) {
      emitChange(getSystemTheme());
    }
  });
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => "light" as Theme);

  useEffect(() => {
    // Ensure DOM is in sync on mount
    applyTheme(currentTheme);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    localStorage.setItem(STORAGE_KEY, t);
    emitChange(t);
  }, []);

  const toggle = useCallback(() => {
    const next = currentTheme === "dark" ? "light" : "dark";
    setTheme(next);
  }, [setTheme]);

  const isAuto = getStoredTheme() === null;

  const setAuto = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    emitChange(getSystemTheme());
  }, []);

  return { theme, setTheme, toggle, isAuto, setAuto };
}
