"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const STATEMENT =
  "Since 1966, NASA has parked machines on other worlds. Landers, rovers, a helicopter, and probes still flying out of the solar system. When their work was done, nobody came to collect them. They are still out there, exactly where they stopped.";

export function Intro() {
  const sectionRef = useRef<HTMLElement>(null);
  const words = STATEMENT.split(" ");

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Same reveal as portfolio-v3's VisionSection: each word resolves out of a blur, tipping
        // up from behind the line, in reading order. The section is taller than the screen and the
        // statement is sticky, so the reveal is scrubbed across a full screen of scroll while the
        // text holds still, instead of racing past in one flick of the wheel.
        const words = gsap.utils.toArray<HTMLElement>("[data-word]");
        gsap.set(words, { opacity: 0, filter: "blur(4px)", y: 8, rotateX: -16, transformOrigin: "50% 100% -6px" });
        const tl = gsap.timeline({
          scrollTrigger: { trigger: sectionRef.current, start: "top 45%", end: "bottom bottom", scrub: 0.8 },
        });
        words.forEach((word, i) => {
          tl.to(word, { opacity: 1, filter: "blur(0px)", y: 0, rotateX: 0, duration: 0.22, ease: "power2.out" }, i * 0.05);
        });
      });
      return () => mm.revert();
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} id="why" aria-labelledby="why-title" className="relative z-10 -mt-[60svh] h-[220svh] bg-surface">
      <div className="sticky top-0 flex min-h-svh flex-col justify-center px-4 py-24 sm:px-8 md:px-12">
        <div className="mx-auto w-full max-w-6xl">
          <h2 id="why-title" className="flex items-baseline gap-4 text-eyebrow text-text-muted">
            <span className="text-text">(01)</span>
            Why these machines
          </h2>

          <p
            aria-label={STATEMENT}
            style={{ perspective: "1200px" }}
            className="mt-10 max-w-5xl text-[2rem] font-normal leading-[1.2] tracking-[-0.03em] text-text sm:text-[2.5rem] md:text-[3.5rem]"
          >
            {words.map((word, i) => (
              <span key={i} data-word aria-hidden="true" className="mb-1 mr-[0.28em] inline-block will-change-[transform,opacity]">
                {word}
              </span>
            ))}
          </p>

        </div>
      </div>
    </section>
  );
}
