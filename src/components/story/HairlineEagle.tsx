"use client";

import { useEffect, useRef, useState } from "react";

const READOUT: Record<string, string> = {
  rest: "Move over the lander",
  ascent: "Top half: flew back to orbit",
  descent: "Bottom half: still on the Moon",
};

// The figure's own number: how far the ascent stage climbs (its range is 16 to 50).
const REACH = 40;

/**
 * The Hairline line figure of Eagle. Pointing above the descent stage lifts the ascent stage
 * off it, the way it left on 21 July 1969. The kernel and figure are loaded on the client only,
 * since they draw straight into the DOM.
 */
export function HairlineEagle({ className = "" }: { className?: string }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [part, setPart] = useState("rest");

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let destroy: (() => void) | undefined;
    let isCancelled = false;

    Promise.all([import("@/lib/hairline/kernel"), import("@/lib/hairline/eagle")])
      .then(([{ default: HL }, { eagle }]) => {
        if (isCancelled) return;
        HL.inject(document);
        const svg = HL.mk("svg", { viewBox: "0 0 400 320", "aria-hidden": "true" }, stage);
        const read = {
          get textContent() {
            return part;
          },
          set textContent(value: string) {
            setPart(value || "rest");
          },
        };
        const handle = eagle.mount({ stage, svg, read }, REACH);
        destroy = () => {
          handle.destroy();
          svg.remove();
        };
      })
      .catch((error: unknown) => {
        console.error("Hairline figure failed to load", error);
      });

    return () => {
      isCancelled = true;
      destroy?.();
    };
    // Mounted once; `part` is only read back by the figure for its own bookkeeping.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <figure className={className}>
      <div
        ref={stageRef}
        data-hairline="eagle"
        role="img"
        aria-label="Line drawing of the lunar module Eagle. Its top half lifts off and its bottom half stays on the ground."
        style={
          {
            "--hairline-plate": "var(--surface)",
            "--hairline-hi": "var(--text)",
            "--hairline-edge": "var(--text-muted)",
            "--hairline-mid": "var(--text-muted)",
            "--hairline-lo": "var(--border)",
            "--hairline-stroke": "1.1",
          } as React.CSSProperties
        }
      />
      <figcaption aria-live="polite" className="mt-2 flex items-center gap-2 text-data-sm text-text">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-text" />
        {READOUT[part] ?? READOUT.rest}
      </figcaption>
    </figure>
  );
}
