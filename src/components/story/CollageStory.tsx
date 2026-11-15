"use client";

import { useRef, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { Story } from "@/data/stories";
import { ThemePicker } from "@/components/ThemeToggle";
import { Sources } from "./Sources";
import { display } from "./fonts";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const BLOCKS = ["var(--pop-a)", "var(--pop-b)", "var(--pop-c)"];
/** Sticker buttons: a flat colour, an ink outline and a hard shadow that presses in. */
const JUMP = "inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-[var(--ink)] px-5 text-[0.9375rem] font-semibold text-[var(--on-pop)] shadow-[4px_4px_0_var(--ink)] transition-[translate,box-shadow] duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--ink)] active:translate-x-1 active:translate-y-1 active:shadow-none";
/** Photos alternate between a square, a portrait and a landscape frame. */
/** The grey line under a photo that is not from this mission. */
const NOTE = "text-[color-mix(in_srgb,var(--ink)_55%,transparent)]";
const FRAMES = ["aspect-square", "aspect-[4/5]", "aspect-[5/4]"];

const RAIL_HEIGHT = 140;
const RAIL_Y = 100;
const LOOP = 36;

/** The timeline: a straight rail along the bottom that does a loop-the-loop at every panel edge. */
function railPath(edges: number[], width: number) {
  let d = `M0 ${RAIL_Y}`;
  for (const x of edges) {
    d += ` L${x - 2 * LOOP} ${RAIL_Y} C${x + LOOP * 0.4} ${RAIL_Y}, ${x + LOOP} ${RAIL_Y - 2 * LOOP}, ${x} ${RAIL_Y - 2 * LOOP} S${x - LOOP * 0.4} ${RAIL_Y}, ${x + 2 * LOOP} ${RAIL_Y}`;
  }
  return `${d} L${width} ${RAIL_Y}`;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * Version 1: a cut-paper collage that travels sideways. Photos wipe open as their panel arrives,
 * each sits on a flat block of colour, and a timeline along the bottom is drawn by a dot that
 * loops between one moment and the next.
 */
export function CollageStory({ story }: { story: Story }) {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const q = gsap.utils.selector(root);
      const stage: HTMLElement = q("[data-stage]")[0];
      const track: HTMLElement = q("[data-track]")[0];
      const rail = root.querySelector<SVGSVGElement>("[data-rail]");
      const line = root.querySelector<SVGPathElement>("[data-line]");
      if (!rail || !line) return;
      const dot: HTMLElement = q("[data-dot]")[0];
      const bar: HTMLElement = q("[data-bar]")[0];
      const sections: HTMLElement[] = q("section");
      const drifters: HTMLElement[] = q("[data-drift]");
      const reveals = (q("[data-reveal]") as HTMLElement[]).map((el) => {
        const panel = el.closest("section");
        return { el, panel, pct: panel?.querySelector<HTMLElement>("[data-pct]") ?? null };
      });
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const state = { p: 0 };
        let total = 0;

        const layout = () => {
          const width = track.scrollWidth;
          rail.setAttribute("viewBox", `0 0 ${width} ${RAIL_HEIGHT}`);
          rail.style.width = `${width}px`;
          line.setAttribute("d", railPath(sections.slice(1).map((s) => s.offsetLeft), width));
          total = line.getTotalLength();
        };

        /** How far along the rail (in path length) the point above track position `x` is. */
        const lengthAt = (x: number) => {
          let lo = 0;
          let hi = total;
          for (let i = 0; i < 14; i++) {
            const mid = (lo + hi) / 2;
            if (line.getPointAtLength(mid).x < x) lo = mid;
            else hi = mid;
          }
          return lo;
        };

        const apply = () => {
          const view = stage.clientWidth;
          const scrolled = (track.scrollWidth - view) * state.p;
          track.style.transform = `translate3d(${-scrolled}px, 0, 0)`;
          bar.style.transform = `scaleX(${state.p})`;

          // The rail is drawn up to a point just past the middle of the screen, led by the dot.
          const head = lengthAt(scrolled + view * (0.2 + state.p * 0.7));
          const at = line.getPointAtLength(head);
          line.style.strokeDashoffset = String(1 - head / total);
          dot.style.transform = `translate3d(${at.x}px, ${at.y}px, 0)`;

          // Each photo wipes open from 0% to 100% while its panel crosses the screen edge.
          for (const { el, panel, pct } of reveals) {
            if (!panel) continue;
            const linear = clamp01((view * 0.98 - (panel.offsetLeft - scrolled)) / (view * 0.6));
            const t = linear * linear * (3 - 2 * linear);
            el.style.clipPath = `inset(0 ${((1 - t) * 100).toFixed(2)}% 0 0 round 1.25rem)`;
            el.style.setProperty("--t", t.toFixed(3));
            if (pct) pct.textContent = `${Math.round(t * 100)}%`;
          }

          for (const el of drifters) {
            const panel = el.closest("section");
            if (!panel) continue;
            const offset = panel.offsetLeft + panel.offsetWidth / 2 - scrolled - view / 2;
            el.style.translate = `${(-offset * Number(el.dataset.drift)).toFixed(1)}px 0`;
          }
        };

        layout();
        const tween = gsap.to(state, {
          p: 1,
          ease: "none",
          onUpdate: apply,
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.9,
            onRefresh: () => {
              layout();
              apply();
            },
          },
        });
        apply();

        // Loader: every photo flashes past full screen while a counter runs, then the sheet
        // lifts and the cover comes in.
        const flashes: HTMLElement[] = q("[data-flash]");
        const count = { n: 0 };
        const counter: HTMLElement = q("[data-count]")[0];
        const FLASH = 0.13;
        const intro = gsap.timeline();
        flashes.forEach((el, i) => intro.set(el, { autoAlpha: 1 }, i * FLASH));
        intro
          .to(count, { n: 100, duration: flashes.length * FLASH, ease: "none", onUpdate: () => (counter.textContent = String(Math.round(count.n)).padStart(3, "0")) }, 0)
          .to("[data-loader]", { yPercent: -100, duration: 0.9, ease: "power4.inOut" }, ">0.15")
          .set("[data-loader]", { display: "none" })
          .from("[data-in]", { yPercent: 60, autoAlpha: 0, duration: 0.8, ease: "power3.out", stagger: 0.08 }, "<-0.45");

        return () => {
          intro.kill();
          tween.scrollTrigger?.kill();
          tween.kill();
        };
      });
      return () => mm.revert();
    },
    { scope: rootRef },
  );

  const panels = story.beats.length + 2;

  return (
    <article ref={rootRef} style={{ height: `${panels * 85}svh` }} className="relative bg-[var(--paper)] text-[var(--ink)] transition-colors duration-300 motion-reduce:!h-auto">
      <h1 className="sr-only">{`${story.title}: ${story.subtitle}`}</h1>

      <div data-loader aria-hidden="true" className="fixed inset-0 z-[110] overflow-hidden bg-[#0d0d0c] text-white motion-reduce:hidden">
        {/* Each photo once, even when a story shows it in more than one panel. */}
        {[...new Set([story.cover, ...story.beats.map((b) => b.image)].map((image) => image.src))].reverse().map((src) => (
          <Image key={src} data-flash src={src} alt="" fill priority sizes="100vw" className="invisible object-cover" />
        ))}
        <p className={`${display.className} absolute bottom-6 left-6 flex items-baseline gap-2 text-[clamp(3rem,8vw,6.5rem)] font-light leading-none tracking-[-0.04em] tabular-nums md:bottom-10 md:left-12`}>
          <span data-count>000</span>
          <span className="text-[0.35em] tracking-normal">%</span>
        </p>
        <p className="absolute bottom-8 right-6 text-eyebrow md:bottom-12 md:right-12">Loading {story.title}</p>
      </div>

      <div
        data-stage
        className="sticky top-0 h-svh overflow-hidden bg-[linear-gradient(var(--grid)_1px,transparent_1px),linear-gradient(90deg,var(--grid)_1px,transparent_1px)] bg-[length:32px_32px] [--grid:color-mix(in_srgb,var(--ink)_7%,transparent)] motion-reduce:static motion-reduce:h-auto"
      >
        <Link href="/#stories" className="absolute left-4 top-4 z-20 md:left-8 inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-[var(--ink)] bg-[var(--paper)] px-4 text-[0.875rem] font-medium text-[var(--ink)] transition-colors duration-150 hover:bg-[var(--ink)] hover:text-[var(--paper)] active:scale-[0.97]">
          <span aria-hidden="true">←</span> Back
        </Link>
        <ThemePicker className="absolute right-4 top-4 z-20 md:right-8" />

        {/* The other two ways to take the story. */}
        <div className="absolute bottom-5 right-4 z-20 flex items-center gap-3 md:right-8">
          {story.scene3d && (
            <Link href={story.scene3d} className={`${JUMP} bg-[var(--pop-a)]`}>
              <svg aria-hidden="true" viewBox="0 0 16 16" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
                <path d="M8 1.5 14 5v6l-6 3.5L2 11V5zM2 5l6 3.5L14 5M8 8.5v6" />
              </svg>
              3D view
            </Link>
          )}
          <Link href={`/stories/${story.slug}/play`} className={`${JUMP} bg-[var(--pop-b)]`}>
            <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M4.5 2.5 13 8l-8.5 5.5z" />
            </svg>
            Play
          </Link>
        </div>

        <div data-track className="relative flex h-full w-max md:gap-[8vw] will-change-transform motion-reduce:h-auto motion-reduce:w-full motion-reduce:flex-col">
          {/* Cover */}
          <section className="relative grid h-full w-screen shrink-0 gap-8 px-6 pb-36 pt-24 [align-content:safe_center] md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-center md:gap-12 md:px-16 motion-reduce:h-auto">
            <div className="min-w-0">
              <p data-in className="text-eyebrow">
                {story.eyebrow}
              </p>
              {/* Sized from the title's length so long names stay on one line inside their column. */}
              <p
                data-in
                aria-hidden="true"
                style={{ "--fit": Math.max(story.title.length, 5) * 0.6 } as CSSProperties}
                className={`${display.className} mt-4 whitespace-nowrap pb-[0.1em] text-[min(7rem,calc((100vw-3rem)/var(--fit)))] font-extrabold leading-[0.9] tracking-[-0.05em] md:text-[min(18rem,26svh,calc((100vw-11rem)*0.54/var(--fit)))]`}
              >
                {story.title}
              </p>
              <p data-in className={`${display.className} mt-6 max-w-[18ch] text-[clamp(1.5rem,2.8vw,2.5rem)] font-medium leading-[1.05] tracking-[-0.02em]`}>
                {story.subtitle}
              </p>
              <p data-in className="mt-8 inline-flex w-max items-center gap-3 rounded-full bg-[var(--ink)] px-5 py-3 text-[0.9375rem] font-medium text-[var(--paper)] motion-reduce:hidden">
                Scroll to travel
                <span aria-hidden="true">→</span>
              </p>
            </div>
            <div data-in className="relative mx-auto aspect-[5/4] w-[min(30svh,70vw)] md:aspect-[4/5] md:w-[min(56svh,30vw)]">
              <div data-drift="0.05" className="absolute -bottom-4 -right-4 left-4 top-4 rounded-[1.25rem] border-2 border-[var(--ink)] bg-[var(--pop-a)]" />
              <Image src={story.cover.src} alt={story.cover.alt} fill priority sizes="(min-width: 768px) 30vw, 70vw" className="rounded-[1.25rem] border-2 border-[var(--ink)] object-cover" />
            </div>
          </section>

          {story.beats.map((beat, i) => (
            <section
              key={beat.id}
              aria-labelledby={`collage-${beat.id}`}
              className="relative grid h-full w-screen shrink-0 gap-6 px-6 pb-36 pt-20 [align-content:safe_center] md:w-[92vw] md:grid-cols-2 md:items-center md:gap-16 md:px-16 md:pb-40 lg:w-[80vw] motion-reduce:h-auto motion-reduce:w-full"
            >
              <div className={`relative mx-auto w-[min(19svh,52vw)] md:w-[min(46svh,32vw)] ${FRAMES[i % FRAMES.length]} ${i % 2 ? "md:order-2" : ""}`}>
                <div data-drift="0.05" className={`absolute -bottom-4 top-4 rounded-[1.25rem] border-2 border-[var(--ink)] ${i % 2 ? "-left-4 right-4" : "-right-4 left-4"}`} style={{ background: BLOCKS[i % 3] }} />
                <div data-reveal className="absolute inset-0 overflow-hidden rounded-[1.25rem] border-2 border-[var(--ink)] bg-[var(--ink)]">
                  <Image src={beat.image.src} alt={beat.image.alt} fill sizes="(min-width: 768px) 32vw, 60vw" className="scale-[calc(1.3-0.3*var(--t,1))] object-cover" />
                </div>
                <p className={`absolute z-10 max-w-[13rem] rounded-xl border-2 border-[var(--ink)] bg-[var(--paper)] px-3 py-2 ${i % 2 ? "-left-3 -rotate-3" : "-right-3 rotate-3"} max-md:-bottom-5 md:-top-4`}>
                  <span className={`${display.className} block whitespace-nowrap text-[1.25rem] font-extrabold leading-none tabular-nums md:text-[1.75rem]`}>{beat.fact.value}</span>
                  <span className="mt-1 block text-[0.6875rem] leading-tight md:text-[0.75rem]">{beat.fact.label}</span>
                </p>
                {beat.image.note ? (
                  <p className={`absolute inset-x-0 top-[calc(100%+1.75rem)] text-[0.75rem] leading-snug max-md:hidden ${NOTE}`}>{beat.image.note}</p>
                ) : (
                  <p aria-hidden="true" data-pct className="absolute -bottom-9 left-0 text-data-sm tabular-nums opacity-60 max-md:hidden motion-reduce:hidden">
                    100%
                  </p>
                )}
              </div>
              {beat.image.note && <p className={`-mb-2 mt-3 text-center text-[0.6875rem] leading-snug md:hidden ${NOTE}`}>{beat.image.note}</p>}
              <div>
                <p className="flex items-center gap-3 text-eyebrow">
                  <span className="tabular-nums">0{i + 1}</span>
                                    {beat.when}
                </p>
                <h2 id={`collage-${beat.id}`} className={`${display.className} mt-3 max-w-[11ch] text-balance text-[clamp(2rem,min(5.2vw,8svh),5rem)] font-extrabold leading-[0.92] tracking-[-0.035em]`}>
                  {beat.title}
                </h2>
                <div className="mt-4 flex max-w-[38ch] flex-col gap-3 text-[1rem] leading-[1.5] md:mt-5 md:text-[1.125rem] md:leading-[1.55]">
                  {beat.lines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
                <p className="mt-4 text-data-sm opacity-60 max-md:[@media(max-height:760px)]:hidden">Photo: NASA {beat.image.credit}</p>
              </div>

              {/* This moment's stop on the timeline. */}
              <div aria-hidden="true" className="absolute bottom-6 left-[12%] motion-reduce:hidden">
                <span className="absolute bottom-10 left-0 size-4 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-[var(--ink)] bg-[var(--paper)]" />
                <span className="block -translate-x-1/2 whitespace-nowrap text-eyebrow">{beat.tick}</span>
              </div>
            </section>
          ))}

          {/* End */}
          <section className="relative flex h-full w-screen shrink-0 items-center px-6 pb-36 pt-20 md:px-16 motion-reduce:h-auto">
            <div className="grid w-full gap-8 rounded-[1.25rem] border-2 border-[var(--ink)] bg-[var(--pop-a)] p-8 text-[var(--on-pop)] md:grid-cols-2 md:p-14">
              <div>
                <p className="text-eyebrow">The end, for now</p>
                <p className={`${display.className} mt-4 max-w-[16ch] text-balance text-[clamp(2rem,4.2vw,3.75rem)] font-extrabold leading-[0.95] tracking-[-0.035em]`}>{story.ending}</p>
                <Link
                  href="/#stories"
                  className="mt-8 inline-flex min-h-12 items-center gap-3 rounded-full bg-[var(--on-pop)] px-6 font-medium text-white transition-colors duration-150 hover:bg-[var(--pop-b)] hover:text-[var(--on-pop)] active:scale-[0.98]"
                >
                  Meet the other machines
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
              <Sources sources={story.sources} />
            </div>
          </section>

          <svg data-rail aria-hidden="true" height={RAIL_HEIGHT} className="pointer-events-none absolute bottom-6 left-0 overflow-visible motion-reduce:hidden">
            <path data-line pathLength={1} fill="none" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="1" strokeDashoffset="1" />
          </svg>
          <div data-dot aria-hidden="true" className="pointer-events-none absolute bottom-6 left-0 motion-reduce:hidden" style={{ height: RAIL_HEIGHT }}>
            <span className="absolute -left-2.5 -top-2.5 size-5 rounded-full border-2 border-[var(--ink)] bg-[var(--pop-b)]" />
          </div>
        </div>

        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1.5 bg-[color-mix(in_srgb,var(--ink)_14%,transparent)] motion-reduce:hidden">
          <div data-bar className="h-full origin-left scale-x-0 bg-[var(--pop-b)]" />
        </div>
      </div>
    </article>
  );
}
