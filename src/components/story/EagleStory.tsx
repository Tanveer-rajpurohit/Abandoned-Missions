"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useLenis } from "lenis/react";
import { ArrowRightIcon } from "@/components/icons";
import { PillLink } from "@/components/PillLink";
import { EagleClock } from "@/components/home/EagleClock";
import { HairlineEagle } from "./HairlineEagle";
import type { Card, Rgb, StageState } from "./MoonScene";

// three.js and the 6 MB terrain stay out of the first load and never run on the server.
const MoonScene = dynamic(() => import("./MoonScene").then((m) => m.MoonScene), { ssr: false });

gsap.registerPlugin(ScrollTrigger, useGSAP);

const PHOTOS = "/assets/moon/apollo-11/real";
const DRAWINGS = "/assets/moon/apollo-11/svg";

interface Palette {
  sky: Rgb;
  haze: Rgb;
  ground: Rgb;
  near: Rgb;
}

const hex = (value: string): Rgb => {
  const n = parseInt(value.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const palette = (sky: string, haze: string, ground: string, near: string): Palette => ({
  sky: hex(sky),
  haze: hex(haze),
  ground: hex(ground),
  near: hex(near),
});

/**
 * Each chapter starts at scroll progress `at` and has its own light on the scene: the sky, the
 * bright haze at the horizon, the lit ground and the ground nearest the viewer. The first pair
 * matches the Moon tokens in globals.css, so nothing jumps when the script takes over.
 */
const CHAPTERS = [
  {
    title: "Landing",
    at: 0,
    when: "20 July 1969 · 20:17 UTC",
    light: palette("#d6d5d0", "#f6f5f2", "#e4e3df", "#c4c3bd"),
    dark: palette("#0a0a0b", "#2e2e30", "#232324", "#131314"),
    lines: [
      "I am Eagle.",
      "I carried two astronauts",
      "down to the Moon.",
      "The ground was full of boulders,",
      "so Neil Armstrong",
      "steered me by hand.",
      "We touched down with less than",
      "30 seconds of landing fuel left.",
    ],
  },
  {
    title: "First steps",
    at: 0.2,
    when: "21 July 1969 · 02:56 UTC",
    light: palette("#ccd3d8", "#eef1f2", "#dfe4e6", "#bcc5ca"),
    dark: palette("#080b0e", "#263038", "#1c252b", "#0f1519"),
    lines: [
      "Six and a half hours later,",
      "Neil climbed down my ladder.",
      "Buzz Aldrin followed him out.",
      "Their boots pressed into dust",
      "that had not moved",
      "for billions of years.",
      "There is no wind here, and no rain.",
      "Those prints are still here.",
    ],
  },
  {
    title: "Experiments",
    at: 0.4,
    when: "2 hours 31 minutes outside",
    light: palette("#dcd4c2", "#f6f0e3", "#eae3d3", "#cbc0a9"),
    dark: palette("#0e0b07", "#3a301f", "#2a2317", "#16120b"),
    lines: [
      "They did not have long.",
      "They planted a flag.",
      "They set up a seismometer",
      "to listen for moonquakes,",
      "and a mirror that bounces",
      "laser light back to Earth.",
      "Then they packed 21.5 kg",
      "of Moon rock to take home.",
    ],
  },
  {
    title: "Liftoff",
    at: 0.62,
    when: "21 July 1969 · 17:54 UTC",
    light: palette("#dccbc3", "#f7ece6", "#ecddd5", "#cbb5ab"),
    dark: palette("#100a08", "#3c2923", "#2c1e1a", "#170f0c"),
    lines: [
      "After 21 hours and 36 minutes,",
      "it was time to leave.",
      "But only my top half could fly.",
      "It fired its engine and used me,",
      "the bottom half,",
      "as its launch pad.",
      "The blast knocked the flag over.",
      "Then it was quiet.",
    ],
  },
  {
    title: "Today",
    at: 0.82,
    when: "Today",
    light: palette("#bac5d2", "#e4eaef", "#d5dde5", "#a8b5c3"),
    dark: palette("#060a11", "#1f2f44", "#182433", "#0b111b"),
    lines: [
      "The seismometer went silent",
      "that August.",
      "The mirror needs no power,",
      "so it never stopped working.",
      "Scientists still fire lasers at it.",
      "That is how we know the Moon drifts",
      "3.8 cm farther away every year.",
      "And I am still standing here.",
    ],
  },
];

/**
 * Pictures standing in the 3D scene. `at` is the story progress (0 to 1) at which the camera
 * reaches the picture, `depth` how many metres back from the camera lane it stands and `height`
 * its real size in metres, so near things pass faster and larger than far ones.
 */
interface StoryCard extends Card {
  alt: string;
  width: number;
  height: number;
}
const card = (key: string, src: string, alt: string, width: number, pixelHeight: number, at: number, depth: number, metres: number, extra: Partial<Card> = {}): StoryCard & { pixelHeight: number } => ({
  key, src, alt, width, pixelHeight, at, depth, height: metres, aspect: width / pixelHeight, ...extra,
});

const CARDS = [
  card("eagle", `${PHOTOS}/eagle.png`, "The lunar module Eagle standing on the Moon, with Buzz Aldrin unloading experiments beside it", 1815, 1574, 0.03, 19, 7.2),
  card("aldrin", `${PHOTOS}/aldrin.png`, "Buzz Aldrin standing on the Moon in his spacesuit", 336, 719, 0.24, 10, 2.1),
  card("bootprint", `${PHOTOS}/bootprint.png`, "A single bootprint pressed into the grey lunar soil", 1081, 1197, 0.3, 5.5, 1.5, { lean: 58 }),
  card("flag", `${PHOTOS}/flag.png`, "The United States flag planted in the lunar soil", 537, 729, 0.44, 12, 2.7),
  card("seismometer", `${PHOTOS}/easep-seismometer.png`, "The passive seismometer experiment sitting on the lunar surface", 1081, 617, 0.5, 8, 1.8),
  card("mirror", `${DRAWINGS}/lrrr-retroreflector.svg`, "Drawing of the laser mirror: a tilted tray of small glass reflectors", 400, 300, 0.575, 9, 1.1),
  card("earth", `${PHOTOS}/earth.png`, "Planet Earth seen whole from space", 1300, 1300, 0.86, 75, 8, { lift: 15, isInSky: true }),
];

/** The line drawing of the liftoff is live DOM, so it rides along with the scene instead. */
const LIFTOFF = { at: 0.66, depth: 15, height: 7.5 };

const FACTS = [
  { value: "21 h 36 min", label: "on the Moon with a crew on board" },
  { value: "21.5 kg", label: "of Moon rock and soil carried home" },
  { value: "3.8 cm", label: "the Moon moves away each year, measured with my mirror" },
];

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const RING_LENGTH = 2 * Math.PI * 21;

const lerp = (a: Rgb, b: Rgb, t: number): Rgb => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];
const css = (c: Rgb) => `rgb(${c[0]} ${c[1]} ${c[2]})`;

export function EagleStory() {
  const rootRef = useRef<HTMLElement>(null);
  const liftoffRef = useRef<HTMLDivElement>(null);
  const lenis = useLenis();
  // What the 3D scene reads every frame. Written by the scroll handler below.
  const stage = useRef<StageState>({ p: 0, haze: CHAPTERS[0].light.haze, ground: CHAPTERS[0].light.ground, paper: CHAPTERS[0].light.haze });
  const [isMoving, setIsMoving] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: no-preference)");
    const sync = () => setIsMoving(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const scrollToProgress = (p: number) => {
    const journey = rootRef.current?.querySelector<HTMLElement>("[data-journey]");
    if (!journey) return;
    const top = journey.getBoundingClientRect().top + window.scrollY + p * (journey.offsetHeight - window.innerHeight);
    if (lenis) lenis.scrollTo(top, { duration: 1.6 });
    else window.scrollTo({ top, behavior: "smooth" });
  };

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const q = gsap.utils.selector(root);
      const scene = q("[data-scene]")[0];
      const reader = q("[data-reader]")[0];
      const poem = q("[data-poem]")[0];
      const lines = q("[data-line]");
      const steps = q("[data-step]");
      const up = q("[data-up]")[0];
      const ring = q("[data-ring]")[0];
      const hint = q("[data-hint]")[0];
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const state = { p: 0 };
        let activeStep = -1;

        // One function lays out the whole scene for a scroll progress. Everything is a transform,
        // opacity or filter on an element that already has its own layer, plus the light for the scene.
        const apply = () => {
          // The light: blend from the current chapter's colours to the next one's.
          let index = 0;
          while (index < CHAPTERS.length - 1 && state.p >= CHAPTERS[index + 1].at) index++;
          const next = Math.min(index + 1, CHAPTERS.length - 1);
          const span = CHAPTERS[next].at - CHAPTERS[index].at;
          const mix = span > 0 ? clamp01((state.p - CHAPTERS[index].at) / span) : 0;
          const mode = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
          const from = CHAPTERS[index][mode];
          const to = CHAPTERS[next][mode];
          const haze = lerp(from.haze, to.haze, mix);
          const ground = lerp(from.ground, to.ground, mix);
          scene.style.setProperty("--sky", css(lerp(from.sky, to.sky, mix)));
          scene.style.setProperty("--haze", css(haze));
          stage.current.p = state.p;
          stage.current.haze = haze;
          stage.current.ground = ground;
          // Unpainted paper: near white by day. At night it is a grey well clear of the dark sky,
          // so the land and the cut-outs can still be made out before they are painted.
          stage.current.paper = mode === "dark" ? [Math.min(255, haze[0] * 2.1), Math.min(255, haze[1] * 2.1), Math.min(255, haze[2] * 2.1)] : haze;

          // The chapter list switches a little before the colours finish arriving.
          const step = mix > 0.85 ? next : index;
          if (step !== activeStep) {
            activeStep = step;
            steps.forEach((el, i) => el.setAttribute("aria-current", i === step ? "step" : "false"));
          }
          up.dataset.on = String(state.p > 0.03);
          ring.style.strokeDashoffset = String(RING_LENGTH * (1 - state.p));
          hint.style.opacity = String(clamp01(1 - state.p * 30));

          // The poem slides up inside its window; each line is sharp at the middle of the window
          // and blurs toward its top and bottom edges.
          const windowH = reader.clientHeight;
          const shift = windowH * 0.3 - state.p * (poem.scrollHeight - windowH * 0.45);
          poem.style.transform = `translate3d(0, ${shift}px, 0)`;
          lines.forEach((line) => {
            const centre = line.offsetTop + line.offsetHeight / 2 + shift;
            const far = clamp01(Math.abs(centre - windowH * 0.42) / (windowH * 0.5));
            const soft = far * far;
            line.style.opacity = String(1 - soft * 0.9);
            line.style.filter = soft > 0.02 ? `blur(${(soft * 7).toFixed(1)}px)` : "none";
          });
        };

        const tween = gsap.to(state, {
          p: 1,
          ease: "none",
          onUpdate: apply,
          scrollTrigger: { trigger: "[data-journey]", start: "top top", end: "bottom bottom", scrub: 1.1, onRefresh: apply },
        });
        apply();
        gsap.from(reader, { opacity: 0, filter: "blur(12px)", duration: 1.4, ease: "power3.out", delay: 0.2 });

        // The colours come from the script, so a theme switch has to repaint them.
        const themeWatch = new MutationObserver(apply);
        themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

        return () => {
          themeWatch.disconnect();
          tween.scrollTrigger?.kill();
          tween.kill();
          for (const name of ["--sky", "--haze"]) scene.style.removeProperty(name);
        };
      });
      return () => mm.revert();
    },
    { scope: rootRef },
  );

  return (
    <article ref={rootRef}>
      <h1 className="sr-only">Eagle: the half of the Apollo 11 lunar module that stayed on the Moon</h1>

      {/* Tall section, sticky scene: the vertical scroll is spent on a sideways journey. */}
      <section data-journey aria-label="Eagle's story" className="relative h-[700svh] motion-reduce:h-auto">
        <div
          data-scene
          className="sticky top-0 h-svh overflow-hidden bg-[radial-gradient(ellipse_60%_46%_at_76%_34%,var(--haze),transparent_72%),linear-gradient(to_bottom,var(--sky)_0%,var(--haze)_62%)] motion-reduce:static motion-reduce:h-auto motion-reduce:overflow-visible"
        >
          {/* The land and everything standing on it: one WebGL scene. */}
          {isMoving && (
            <div className="absolute inset-0">
              <MoonScene stage={stage} cards={CARDS} follower={{ ref: liftoffRef, ...LIFTOFF }} />
              <div ref={liftoffRef} className="absolute left-0 top-0 aspect-[5/4] h-[40svh] origin-top-left opacity-0 will-change-transform">
                <HairlineEagle className="h-full" />
              </div>
            </div>
          )}

          {/* With reduced motion the story is a plain page: the same pictures, standing still. */}
          <div className="hidden flex-wrap items-end gap-8 px-4 pt-32 motion-reduce:flex">
            {CARDS.map((item) => (
              <Image key={item.key} src={item.src} alt={item.alt} width={item.width} height={item.pixelHeight} sizes="50vw" className="h-[30svh] w-auto" />
            ))}
            <HairlineEagle className="h-[30svh]" />
          </div>

          {/* A wash of bare paper behind the poem, so the words never sit on painted ground. */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-[48%] bg-[linear-gradient(to_right,var(--haze)_0%,var(--haze)_30%,transparent_100%)] opacity-70 motion-reduce:hidden max-md:inset-x-0 max-md:bottom-auto max-md:h-[56svh] max-md:w-auto max-md:bg-[linear-gradient(to_bottom,var(--haze)_0%,var(--haze)_60%,transparent_100%)]" />

          <div
            data-reader
            className="pointer-events-none absolute left-4 top-[12svh] z-[80] h-[36svh] w-[min(30rem,88vw)] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_22%,black_70%,transparent)] motion-reduce:static motion-reduce:h-auto motion-reduce:px-4 motion-reduce:py-16 motion-reduce:[mask-image:none] sm:left-8 md:left-[10vw] md:top-1/2 md:h-[52svh] md:-translate-y-1/2"
          >
            <div data-poem className="will-change-transform">
              {CHAPTERS.map((chapter) => (
                <div key={chapter.title} className="pb-16">
                  <p data-line className="pb-4 text-eyebrow text-text-muted">
                    {chapter.when}
                  </p>
                  <p className="text-[1.375rem] leading-[1.45] tracking-[-0.02em] text-text md:text-[1.875rem]">
                    {chapter.lines.map((line) => (
                      <span key={line} data-line className="block">
                        {line}
                      </span>
                    ))}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <nav aria-label="Chapters" className="absolute bottom-4 left-2 z-[90] motion-reduce:hidden sm:left-6 md:bottom-8 md:left-[calc(10vw-0.75rem)]">
            <ol className="flex items-center rounded-full bg-surface-raised px-1">
              {CHAPTERS.map((chapter, i) => (
                <li key={chapter.title}>
                  <button
                    type="button"
                    data-step
                    aria-current={i === 0 ? "step" : "false"}
                    onClick={() => scrollToProgress(chapter.at === 0 ? 0 : chapter.at + 0.02)}
                    className="group flex min-h-11 min-w-11 items-center justify-center gap-2 px-3 text-data-sm text-text-muted transition-colors duration-150 hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text active:scale-[0.98] aria-[current=step]:text-text"
                  >
                    <span className="tabular-nums">0{i + 1}</span>
                    <span className="hidden border-b border-transparent pb-0.5 group-aria-[current=step]:border-text lg:inline">{chapter.title}</span>
                    <span aria-hidden="true" className="h-px w-3 bg-current opacity-0 group-aria-[current=step]:opacity-100 lg:hidden" />
                    <span className="sr-only lg:hidden">{chapter.title}</span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>

          <p
            data-hint
            className="pointer-events-none absolute bottom-20 left-4 z-[90] border-b border-text pb-1 text-caption text-text motion-reduce:hidden sm:left-8 md:bottom-24 md:left-[10vw]"
          >
            Scroll to explore
          </p>

          <button
            type="button"
            data-up
            data-on="false"
            aria-label="Back to the start of the story"
            onClick={() => scrollToProgress(0)}
            className="pointer-events-none absolute bottom-4 right-4 z-[90] grid size-12 translate-y-2 place-items-center rounded-full bg-surface-raised text-text opacity-0 transition-[opacity,translate,background-color,color,scale] duration-200 ease-out hover:bg-text hover:text-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text active:scale-[0.96] data-[on=true]:pointer-events-auto data-[on=true]:translate-y-0 data-[on=true]:opacity-100 motion-reduce:hidden sm:right-8 md:bottom-8 md:right-12"
          >
            {/* The ring fills as the story is read. */}
            <svg aria-hidden="true" viewBox="0 0 48 48" className="absolute inset-0 size-full -rotate-90">
              <circle cx="24" cy="24" r="21" fill="none" stroke="var(--border)" strokeWidth="1" />
              <circle data-ring cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray={RING_LENGTH} strokeDashoffset={RING_LENGTH} />
            </svg>
            <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" />
            </svg>
          </button>
        </div>
      </section>

      <section aria-labelledby="facts-title" className="border-t border-border px-4 py-24 sm:px-8 md:px-12 md:py-32">
        <h2 id="facts-title" className="flex items-baseline gap-4 text-eyebrow text-text-muted">
          <span className="text-text">(01)</span>
          Eagle in numbers
        </h2>
        <p className="mt-8 max-w-3xl text-h2 text-text">
          I have been standing on the Moon for{" "}
          <span className="tabular-nums">
            <EagleClock />
          </span>
          .
        </p>
        <dl className="mt-16 grid gap-10 md:grid-cols-3">
          {FACTS.map((fact) => (
            <div key={fact.value} className="flex flex-col gap-3 border-t border-border pt-6">
              <dt className="order-2 max-w-[28ch] text-body text-text-muted">{fact.label}</dt>
              <dd className="order-1 text-h1 tabular-nums text-text">{fact.value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-20 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <p className="max-w-xl text-data-sm text-text-muted">
            Photos: NASA, public domain (AS11-40-5927, 5875, 5877, 5948; AS17-148-22727). Facts: NASA Space Science Data Coordinated Archive, Apollo 11 Lunar Module / EASEP.
          </p>
          <PillLink href="/#stories" icon={<ArrowRightIcon width={16} height={16} />}>
            Meet the other machines
          </PillLink>
        </div>
      </section>
    </article>
  );
}
