"use client";

import { useCallback, useEffect, useState } from "react";

/** Step-by-step story playback: the current index, next and previous, and the arrow keys. */
export function useStepper(count: number, start = 0) {
  const [index, setIndex] = useState(start);

  const go = useCallback((to: number) => setIndex(Math.min(count - 1, Math.max(start, to))), [count, start]);
  const next = useCallback(() => setIndex((i) => Math.min(count - 1, i + 1)), [count]);
  const prev = useCallback(() => setIndex((i) => Math.max(start, i - 1)), [start]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, select")) return;
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  return { index, go, next, prev };
}
