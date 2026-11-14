"use client";

import { useSyncExternalStore } from "react";

import { THEME_STORAGE_KEY } from "@/lib/theme";

type Theme = "light" | "grape" | "dark";

/** Paper is "light" (no attribute). The toggle steps through all three in this order. */
const ORDER: Theme[] = ["light", "grape", "dark"];
const NAMES: Record<Theme, string> = { light: "Paper", grape: "Grape", dark: "Dark" };
const SWATCH: Record<Theme, string> = { light: "#efece4", grape: "#a9a4f7", dark: "#0d0d0c" };
const TURN: Record<Theme, string> = { light: "rotate-0", grape: "rotate-90", dark: "rotate-180" };

const listeners = new Set<() => void>();
const readTheme = (): Theme => {
  const saved = document.documentElement.dataset.theme;
  return saved === "dark" || saved === "grape" ? saved : "light";
};

function setTheme(theme: Theme) {
  if (theme !== "light") document.documentElement.dataset.theme = theme;
  else delete document.documentElement.dataset.theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage is blocked (private window): the choice lasts until the page is closed.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "light" as Theme);
  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${NAMES[next]} theme`}
      className={`group grid size-11 place-items-center ${className}`}
    >
      {/* The filled half turns a step on each switch: paper, grape, night. */}
      <svg
        viewBox="0 0 24 24"
        width={20}
        height={20}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
        className={`transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] group-active:scale-90 ${TURN[theme]}`}
      >
        <circle cx="12" cy="12" r="8" />
        <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" stroke="none" />
      </svg>
    </button>
  );
}

/** Paper, Grape or Dark, as three labelled swatches. */
export function ThemePicker({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "light" as Theme);

  return (
    <div role="group" aria-label="Colour theme" className={`flex items-center gap-1 rounded-full border-2 border-[var(--ink)] bg-[var(--paper)] p-1 text-[var(--ink)] ${className}`}>
      {ORDER.map((name) => (
        <button
          key={name}
          type="button"
          onClick={() => setTheme(name)}
          aria-pressed={theme === name}
          className="inline-flex min-h-9 items-center gap-2 rounded-full px-3 text-[0.8125rem] font-medium transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--ink)_12%,transparent)] active:scale-[0.97] aria-pressed:bg-[var(--ink)] aria-pressed:text-[var(--paper)]"
        >
          <span aria-hidden="true" className="size-3 rounded-full border border-current" style={{ background: SWATCH[name] }} />
          <span className="max-md:sr-only">{NAMES[name]}</span>
        </button>
      ))}
    </div>
  );
}
