"use client";

import { useEffect, useState } from "react";
import { EAGLE_LANDED_AT } from "@/data/missions";

const pad = (n: number) => String(n).padStart(2, "0");

/** Calendar years and days since landing, then the clock time left over, all in UTC. */
function elapsedSince(start: number, now: number) {
  const from = new Date(start);
  let years = new Date(now).getUTCFullYear() - from.getUTCFullYear();
  const anniversary = (y: number) =>
    Date.UTC(from.getUTCFullYear() + y, from.getUTCMonth(), from.getUTCDate(), from.getUTCHours(), from.getUTCMinutes(), from.getUTCSeconds());
  if (anniversary(years) > now) years -= 1;
  let rest = Math.floor((now - anniversary(years)) / 1000);
  const days = Math.floor(rest / 86400);
  rest -= days * 86400;
  const h = Math.floor(rest / 3600);
  const m = Math.floor((rest % 3600) / 60);
  const s = rest % 60;
  return `${years}y ${days}d ${pad(h)}:${pad(m)}:${pad(s)}`;
}

/** How long Eagle's descent stage has been on the Moon, ticking live. */
export function EagleClock() {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setText(elapsedSince(EAGLE_LANDED_AT, Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  // Rendered only on the client so the server and first paint never disagree on the time.
  return <span suppressHydrationWarning>{text ?? "00y 000d 00:00:00"}</span>;
}
