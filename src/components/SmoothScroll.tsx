"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ReactLenis, useLenis, type LenisRef } from "lenis/react";
import "lenis/dist/lenis.css";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Tells ScrollTrigger about every Lenis scroll, so scrubs and pins read the smoothed position. */
function ScrollTriggerSync() {
  useLenis(ScrollTrigger.update);
  return null;
}

/**
 * Lenis drives the page scroll from GSAP's ticker, so ScrollTrigger scrubs and Lenis
 * smoothing share one clock and pins do not jitter.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);

  useEffect(() => {
    // ReactLenis creates its instance in its own effect, after this one has run, so the ref is
    // read on every tick rather than once here. Reading it once left Lenis without frames: it still
    // swallowed wheel events but never moved the page.
    const update = (time: number) => lenisRef.current?.lenis?.raf(time * 1000);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    // Webfonts and images change section heights after the triggers have been measured; without
    // a re-measure, the hero pin's spacer shifts later triggers and they start already finished.
    const refresh = () => ScrollTrigger.refresh();
    document.fonts.ready.then(refresh);
    window.addEventListener("load", refresh);
    return () => {
      gsap.ticker.remove(update);
      window.removeEventListener("load", refresh);
    };
  }, []);

  return (
    <ReactLenis root ref={lenisRef} options={{ autoRaf: false, lerp: 0.1, anchors: true }}>
      <ScrollTriggerSync />
      {children}
    </ReactLenis>
  );
}
