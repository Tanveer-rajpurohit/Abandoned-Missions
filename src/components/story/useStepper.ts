"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Step-by-step story playback: arrow keys, next/previous, and an auto-play clock. Auto-play is
 * what a narrated version will hook into later: one beat per `seconds`, stopping at the end.
 * `onProgress` gets 0 to 1 through the current beat (and which beat) on every frame while playing, so a
 * progress bar can be moved without re-rendering.
 */
export function useStepper(count: number, { start = 0, seconds = 7, onProgress }: { start?: number; seconds?: number; onProgress?: (t: number, index: number) => void } = {}) {
  const [index, setIndex] = useState(start);
  const [isPlaying, setIsPlaying] = useState(false);
  const progress = useRef(onProgress);
  useEffect(() => {
    progress.current = onProgress;
  });

  const go = useCallback((to: number) => setIndex(Math.min(count - 1, Math.max(start, to))), [count, start]);
  const next = useCallback(() => setIndex((i) => Math.min(count - 1, i + 1)), [count]);
  const prev = useCallback(() => setIndex((i) => Math.max(start, i - 1)), [start]);
  const toggle = useCallback(() => setIsPlaying((playing) => !playing), []);

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

  // The clock restarts whenever the beat changes, by hand or by itself.
  useEffect(() => {
    progress.current?.(0, index);
    if (!isPlaying) return;
    const began = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const t = (now - began) / (seconds * 1000);
      progress.current?.(Math.min(1, t), index);
      if (t < 1) frame = requestAnimationFrame(tick);
      else if (index < count - 1) setIndex(index + 1);
      else setIsPlaying(false);
    });
    return () => cancelAnimationFrame(frame);
  }, [index, isPlaying, seconds, count]);

  return { index, go, next, prev, isPlaying, toggle };
}
