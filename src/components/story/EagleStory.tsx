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
import type { Card, StageState } from "./MoonScene";

// three.js and the 6 MB terrain stay out of the first load and never run on the server.
const MoonScene = dynamic(() => import("./MoonScene").then((m) => m.MoonScene), { ssr: false });

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** NASA photos and drawings repainted as watercolours by art/moon/apollo-11/scripts/paint.py. */
const PAINTINGS = "/assets/moon/apollo-11/painted";
const PHOTOS = "/assets/moon/apollo-11/real";

type Side = "left" | "right";
const SIDE_VALUE: Record<Side, number> = { left: -1, right: 1 };

/**
 * The story in chapters of short paragraphs. A chapter's words take one side of the screen and
 * the camera frames the subject on the other, so the story moves across the screen instead of
 * running down one column. Its paragraphs follow each other in the same place.
 */
const STORY: { title: string; when: string; side: Side; paragraphs: string[][] }[] = [
  {
    title: "Landing",
    when: "20 July 1969 · 20:17 UTC",
    side: "left",
    paragraphs: [
      ["I am Eagle.", "I carried two astronauts", "down to the Moon.", "The ground was full of boulders,", "so Neil Armstrong", "steered me by hand.", "We touched down with less than", "30 seconds of landing fuel left."],
      ["Back on Earth,", "Mission Control held its breath.", "Then Neil spoke:", "\u201cHouston, Tranquility Base here.", "The Eagle has landed.\u201d", "We had come down", "on the Sea of Tranquility,", "a wide, flat plain", "of old, dark lava."],
    ],
  },
  {
    title: "First steps",
    when: "21 July 1969 · 02:56 UTC",
    side: "right",
    paragraphs: [
      ["Six and a half hours later,", "Neil climbed down my ladder.", "Buzz Aldrin followed him out.", "Their boots pressed into dust", "that had not moved", "for billions of years."],
      ["As his boot touched the ground,", "Neil said:", "\u201cThat\u2019s one small step for man,", "one giant leap for mankind.\u201d", "Around 600 million people", "watched it on television.", "There is no wind here, and no rain.", "Those prints are still here."],
    ],
  },
  {
    title: "Experiments",
    when: "2 hours 31 minutes outside",
    side: "left",
    paragraphs: [
      ["They did not have long.", "They planted a flag.", "They set up a seismometer", "to listen for moonquakes,", "and a mirror that bounces", "laser light back to Earth."],
      ["Walking was strange.", "The Moon pulls six times", "more gently than Earth,", "so they bounced and hopped.", "Then they packed 21.5 kg", "of Moon rock to take home."],
    ],
  },
  {
    title: "Liftoff",
    when: "21 July 1969 · 17:54 UTC",
    side: "right",
    paragraphs: [
      ["After 21 hours and 36 minutes,", "it was time to leave.", "But only my top half could fly.", "It fired its engine and used me,", "the bottom half,", "as its launch pad.", "The blast knocked the flag over."],
      ["High above, Michael Collins", "had circled the Moon alone", "in Columbia, their ship home.", "My top half met him there,", "and the three flew back to Earth.", "They splashed down in the Pacific", "on 24 July 1969."],
    ],
  },
  {
    title: "Today",
    when: "Today",
    side: "left",
    paragraphs: [
      ["The seismometer went silent", "that August.", "The mirror needs no power,", "so it never stopped working.", "Lasers from Earth still find it."],
      ["Nobody has been back since.", "Cameras circling the Moon", "have photographed me", "from far above,", "with the astronauts\u2019 trails", "still printed beside me.", "And I am still standing here."],
    ],
  },
];

/** Every paragraph in reading order, each with an equal share of the scroll. */
const BEATS = STORY.flatMap((chapter, chapterIndex) => chapter.paragraphs.map((lines, paragraph) => ({ chapter, chapterIndex, paragraph, lines })));
/** Each chapter starts at the scroll progress of its first paragraph. */
const CHAPTERS = STORY.map((chapter) => ({ ...chapter, at: BEATS.findIndex((beat) => beat.chapter === chapter) / BEATS.length }));
/** Scroll distance per paragraph, in screen heights. Long enough to read without hurrying. */
const BEAT_SCREENS = 1.6;

/**
 * Pictures standing in the 3D scene. `at` is the story progress (0 to 1) at which the camera
 * reaches the picture, `depth` how many metres back from the camera lane it stands and `height`
 * its real size in metres, so near things pass faster and larger than far ones. Only things that
 * stand up are here: pictures of the ground itself never matched the modelled soil around them.
 */
interface StoryCard extends Card {
  alt: string;
  width: number;
  pixelHeight: number;
}
const card = (key: string, src: string, alt: string, width: number, pixelHeight: number, at: number, depth: number, metres: number, extra: Partial<Card> = {}): StoryCard => ({
  key, src, alt, width, pixelHeight, at, depth, height: metres, aspect: width / pixelHeight, ...extra,
});

const CARDS = [
  card("eagle", `${PAINTINGS}/eagle-lander.webp`, "Watercolour of the lunar module Eagle standing on the Moon, with Buzz Aldrin unloading experiments beside it", 1593, 1431, 0.03, 19, 6.7, { dab: [0.62, 0.7] }),
  card("aldrin", `${PAINTINGS}/aldrin.webp`, "Watercolour of Buzz Aldrin standing on the Moon in his spacesuit, facing us, the lander reflected in his gold visor", 714, 1360, 0.2, 10, 2.2, { dab: [0.45, 0.8] }),
  card("flag", `${PAINTINGS}/flag-planted.webp`, "Painting of the United States flag on its gold pole, held out by a rod along its top edge", 716, 1287, 0.38, 12, 2.5, { dab: [0.5, 0.85] }),
  card("seismometer", `${PAINTINGS}/seismometer.webp`, "Painting of the seismometer: a gold drum on a tray, with a blue solar panel on each side and an aerial", 1353, 747, 0.46, 9, 1.55, { dab: [0.5, 0.5] }),
  card("mirror", `${PAINTINGS}/laser-mirror.webp`, "Painting of the laser mirror: a tilted tray holding a hundred round glass reflectors", 923, 720, 0.53, 8, 1.3),
  card("rocks", `${PAINTINGS}/rock-box.webp`, "Painting of an open metal box full of grey Moon rocks", 979, 692, 0.595, 7, 1),
  card("descent", `${PAINTINGS}/eagle-descent.webp`, "Painting of Eagle's bottom half standing alone on its four legs", 1207, 508, 0.7, 22, 3.95),
  card("liftoff", `${PAINTINGS}/liftoff.webp`, "Painting of Eagle's top half rising on the flame of its engine", 850, 1033, 0.702, 22.4, 5.8, { lift: 3.7, dab: [0.5, 0.6] }),
  card("mirror-beam", `${PAINTINGS}/laser-mirror-beam.webp`, "Painting of a green laser beam from Earth striking the mirror and bouncing back", 831, 1821, 0.9, 9, 3.6, { dab: [0.35, 0.2] }),
  // The story ends where it began: Eagle's bottom half, still there today.
  card("still-here", `${PAINTINGS}/eagle-descent.webp`, "Painting of Eagle's bottom half, still standing on the Moon today", 1207, 508, 0.975, 21, 3.95),
  card("earth", `${PHOTOS}/earth.webp`, "Planet Earth seen whole from space", 1300, 1300, 0.86, 75, 8, { lift: 15, isInSky: true }),
];

const FACTS = [
  { value: "21 h 36 min", label: "on the Moon with a crew on board" },
  { value: "21.5 kg", label: "of Moon rock and soil carried home" },
  { value: "3.8 cm", label: "the Moon moves away each year, measured with my mirror" },
];

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
/** Longest the loading screen waits before letting the reader in anyway. */
const LOAD_TIMEOUT_MS = 15000;
/** The loading ring creeps toward this on time alone, about two thirds of the way per LOAD_CREEP_MS. */
const LOAD_CREEP_MAX = 0.9;
const LOAD_CREEP_MS = 2500;
const smoothstep = (from: number, to: number, n: number) => {
  const t = clamp01((n - from) / (to - from));
  return t * t * (3 - 2 * t);
};
const RING_LENGTH = 2 * Math.PI * 21;

/** When each line arrives and leaves, as a fraction of its own paragraph's share of the scroll. */
const LINE_IN = 0.05;
const LINE_STAGGER = 0.05;
const LINE_FADE = 0.14;
const BEAT_OUT = 0.82;
/** How far either side of a chapter boundary the camera takes to swing to the other side. */
const SWING_BEFORE = 0.05;
const SWING_AFTER = 0.03;

/** -1 when the words are on the left, 1 on the right; eased across each chapter boundary. */
const sideAt = (p: number) =>
  CHAPTERS.reduce((side, chapter, i) => (i === 0 ? side : side + (SIDE_VALUE[chapter.side] - SIDE_VALUE[CHAPTERS[i - 1].side]) * smoothstep(chapter.at - SWING_BEFORE, chapter.at + SWING_AFTER, p)), SIDE_VALUE[CHAPTERS[0].side]);

const PLACE: Record<Side, string> = {
  left: "md:left-[8vw] md:top-1/2 md:-translate-y-1/2",
  right: "md:left-auto md:right-[7vw] md:top-1/2 md:-translate-y-1/2",
};

export function EagleStory() {
  const rootRef = useRef<HTMLElement>(null);
  const lenis = useLenis();
  // What the 3D scene reads every frame. Written by the scroll handler below.
  const stage = useRef<StageState>({ p: 0, side: SIDE_VALUE[CHAPTERS[0].side] });
  const [isMoving, setIsMoving] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const loaderRingRef = useRef<SVGCircleElement>(null);
  // What has really loaded. The bar eases toward it every frame instead of jumping between reports.
  const loadTarget = useRef(0);
  const showProgress = (fraction: number) => {
    loadTarget.current = Math.max(loadTarget.current, fraction);
  };

  // A reload always starts the journey from the beginning, never halfway along it.
  useEffect(() => {
    const previous = history.scrollRestoration;
    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    return () => {
      history.scrollRestoration = previous;
    };
  }, []);
  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true, force: true });
  }, [lenis]);

  // Counts up smoothly through every number; holds at 100 for a moment before the Moon appears.
  useEffect(() => {
    if (!isMoving || isReady) return;
    let shown = 0;
    const start = performance.now();
    let last = start;
    let frame = requestAnimationFrame(function tick(now) {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      // Files report progress in bursts, with long quiet gaps while they parse. A slow creep
      // toward 90% keeps the ring moving through those gaps; only the real finish takes it to 100.
      const creep = LOAD_CREEP_MAX * (1 - Math.exp(-(now - start) / LOAD_CREEP_MS));
      const target = loadTarget.current >= 1 ? 1 : Math.max(loadTarget.current, creep);
      // Eases toward what has loaded, never slower than a steady 25% a second, so it always lands.
      shown = Math.min(target, shown + Math.max((target - shown) * (1 - Math.exp(-dt * 5)), dt * 0.25));
      // pathLength is 1, so the dash offset is simply what is left to load.
      loaderRingRef.current?.setAttribute("stroke-dashoffset", String(1 - shown));
      if (shown >= 1) {
        frame = window.setTimeout(() => setIsReady(true), 280);
        return;
      }
      frame = requestAnimationFrame(tick);
    });
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(frame);
    };
  }, [isMoving, isReady]);

  // No scrolling until the Moon is there to scroll over. A slow network still gets in after a while.
  useEffect(() => {
    if (!isMoving || isReady) {
      lenis?.start();
      return;
    }
    lenis?.stop();
    const fallback = window.setTimeout(() => setIsReady(true), LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(fallback);
  }, [isMoving, isReady, lenis]);

  // Once loaded, the opening words write themselves in, line by line.
  useEffect(() => {
    if (!isReady) return;
    const lines = rootRef.current?.querySelector("[data-chapter]")?.querySelectorAll("[data-line]");
    if (!lines?.length) return;
    const intro = gsap.from(lines, { opacity: 0, y: 22, filter: "blur(8px)", clipPath: "inset(-20% 100% -20% 0)", duration: 1.1, ease: "power3.out", stagger: 0.09, delay: 0.35 });
    return () => {
      intro.kill();
    };
  }, [isReady]);
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
      const blocks = q("[data-chapter]");
      const steps = q("[data-step]");
      const up = q("[data-up]")[0];
      const ring = q("[data-ring]")[0];
      const hint = q("[data-hint]")[0];
      const [scrimLeft, scrimRight] = ["left", "right"].map((name) => q(`[data-scrim=${name}]`)[0]);
      const chapterLines = blocks.map((block) => Array.from(block.querySelectorAll<HTMLElement>("[data-line]")));
      // Last value written per line, so an unchanged line costs nothing on the next frame.
      const written = new Map<HTMLElement, number>();
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const state = { p: 0 };
        let activeStep = -1;

        // Lays out the words and tells the scene where to look, for one scroll progress. Only
        // transforms, opacity and filter change, so the browser never has to lay the page out again.
        const apply = () => {
          const p = state.p;
          const side = sideAt(p);
          stage.current.p = p;
          stage.current.side = side;

          scrimLeft.style.opacity = String(clamp01(-side));
          scrimRight.style.opacity = String(clamp01(side));

          BEATS.forEach((_, i) => {
            const local = p * BEATS.length - i;
            const isLast = i === BEATS.length - 1;
            chapterLines[i].forEach((line, k) => {
              // The opening words are there once the page has loaded; the last paragraph stays until the page ends.
              const enter = i === 0 ? 1 : clamp01((local - LINE_IN - k * LINE_STAGGER) / LINE_FADE);
              const leave = isLast ? 0 : clamp01((local - BEAT_OUT - k * 0.008) / LINE_FADE);
              const shown = enter * (1 - leave);
              const key = Math.round((enter - leave) * 1000);
              if (written.get(line) === key) return;
              written.set(line, key);
              // A line writes itself in from the left as it rises out of a blur, then lifts away blurring.
              const eased = 1 - (1 - enter) ** 3;
              const blur = (1 - eased + leave) * 7;
              line.style.opacity = String(shown);
              line.style.transform = `translate3d(0, ${((1 - eased) * 22 - leave * 26).toFixed(1)}px, 0)`;
              line.style.filter = blur > 0.15 ? `blur(${blur.toFixed(1)}px)` : "none";
              line.style.clipPath = eased < 0.999 ? `inset(-20% ${((1 - eased) * 100).toFixed(1)}% -20% 0)` : "none";
            });
          });

          let step = 0;
          while (step < CHAPTERS.length - 1 && p >= CHAPTERS[step + 1].at) step++;
          if (step !== activeStep) {
            activeStep = step;
            steps.forEach((el, i) => el.setAttribute("aria-current", i === step ? "step" : "false"));
          }
          up.dataset.on = String(p > 0.03);
          ring.style.strokeDashoffset = String(RING_LENGTH * (1 - p));
          hint.style.opacity = String(clamp01(1 - p * 30));
        };

        const tween = gsap.to(state, {
          p: 1,
          ease: "none",
          onUpdate: apply,
          scrollTrigger: { trigger: "[data-journey]", start: "top top", end: "bottom bottom", scrub: 1.6, onRefresh: apply },
        });
        apply();

        // As the closing section rises over the scene, the story's words and controls step aside.
        const handOff = gsap.to("[data-overlay]", {
          autoAlpha: 0,
          ease: "none",
          scrollTrigger: { trigger: "[data-closing]", start: "top 90%", end: "top 55%", scrub: true },
        });
        const rises = q("[data-rise]").map((el) =>
          gsap.from(el, { opacity: 0, y: 36, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } }),
        );

        return () => {
          tween.scrollTrigger?.kill();
          tween.kill();
          handOff.scrollTrigger?.kill();
          handOff.kill();
          rises.forEach((rise) => {
            rise.scrollTrigger?.kill();
            rise.kill();
          });
          written.clear();
        };
      });
      return () => mm.revert();
    },
    { scope: rootRef },
  );

  return (
    <article ref={rootRef} className="relative">
      <h1 className="sr-only">Eagle: the half of the Apollo 11 lunar module that stayed on the Moon</h1>

      {/* The scene stays behind the whole page: first the journey plays over it, then the closing section scrolls across it. */}
      <div
        data-scene
        className="sticky top-0 h-svh overflow-hidden bg-[linear-gradient(to_bottom,#000_0%,#08080a_38%,#333335_60%)] motion-reduce:static motion-reduce:h-auto motion-reduce:overflow-visible"
      >
        {isMoving && (
          <div className="absolute inset-0">
            <MoonScene stage={stage} cards={CARDS} onProgress={showProgress} />
          </div>
        )}

        {/* Covers the page until the land, the sky and every picture have arrived. */}
        <div
          role="status"
          aria-live="polite"
          data-ready={isReady}
          className="absolute inset-0 z-[95] grid place-items-center bg-[#050506] transition-[opacity,visibility] duration-700 ease-out data-[ready=true]:invisible data-[ready=true]:opacity-0 motion-reduce:hidden"
        >
          {/* A hairline circle that draws itself closed as the scene arrives. */}
          <div className="relative grid size-28 place-items-center">
            <svg viewBox="0 0 100 100" aria-hidden="true" className="absolute inset-0 -rotate-90">
              <circle cx="50" cy="50" r="49.5" fill="none" stroke="var(--border)" strokeWidth="0.75" vectorEffect="non-scaling-stroke" />
              <circle ref={loaderRingRef} cx="50" cy="50" r="49.5" fill="none" stroke="var(--text)" strokeWidth="1" vectorEffect="non-scaling-stroke" pathLength="1" strokeDasharray="1" strokeDashoffset="1" />
            </svg>
            <span className="text-caption font-normal text-text-muted">Loading</span>
          </div>
        </div>

        {/* With reduced motion the story is a plain page: the same pictures, standing still. */}
        <div className="hidden flex-wrap items-end gap-8 px-4 pt-32 motion-reduce:flex">
          {CARDS.map((item) => (
            <Image key={item.key} src={item.src} alt={item.alt} width={item.width} height={item.pixelHeight} sizes="50vw" className="h-[30svh] w-auto" />
          ))}
        </div>

        <div data-overlay className="motion-reduce:contents">
          {/* Shade on the side the words are on, so they never sit on bright soil. */}
          <div aria-hidden="true" data-scrim="left" className="pointer-events-none absolute inset-y-0 left-0 w-[60%] bg-[linear-gradient(to_right,rgb(0_0_0/0.72),rgb(0_0_0/0.45)_45%,transparent)] max-md:hidden motion-reduce:hidden" />
          <div aria-hidden="true" data-scrim="right" className="pointer-events-none absolute inset-y-0 right-0 w-[60%] bg-[linear-gradient(to_left,rgb(0_0_0/0.72),rgb(0_0_0/0.45)_45%,transparent)] opacity-0 max-md:hidden motion-reduce:hidden" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[55%] bg-[linear-gradient(to_bottom,rgb(0_0_0/0.6),transparent)] md:hidden motion-reduce:hidden" />

          {BEATS.map(({ chapter, chapterIndex, paragraph, lines }) => (
            <section
              key={`${chapter.title}-${paragraph}`}
              data-chapter
              aria-label={paragraph === 0 ? chapter.title : undefined}
              className={`pointer-events-none absolute inset-x-4 top-[13svh] z-[80] md:inset-x-auto md:w-[min(33rem,40vw)] ${PLACE[chapter.side]} motion-reduce:static motion-reduce:translate-none motion-reduce:px-4 motion-reduce:py-12`}
            >
              <p data-line className="flex items-center gap-3 pb-4 text-eyebrow text-text-muted">
                <span className="tabular-nums text-text">0{chapterIndex + 1}</span>
                <span aria-hidden="true" className="h-px w-6 bg-current" />
                {chapter.when}
              </p>
              <p className="text-[1.375rem] leading-[1.45] tracking-[-0.02em] text-text md:text-[1.875rem]">
                {lines.map((line) => (
                  <span key={line} data-line className="block will-change-[transform,opacity]">
                    {line}
                  </span>
                ))}
              </p>
            </section>
          ))}

          <nav aria-label="Chapters" className="absolute bottom-4 left-1/2 z-[90] -translate-x-1/2 motion-reduce:hidden md:bottom-8">
            <ol className="flex items-center rounded-full border border-border bg-surface-raised/80 px-1 backdrop-blur-sm">
              {CHAPTERS.map((chapter, i) => (
                <li key={chapter.title}>
                  <button
                    type="button"
                    data-step
                    aria-current={i === 0 ? "step" : "false"}
                    onClick={() => scrollToProgress(chapter.at === 0 ? 0 : chapter.at + 0.4 / BEATS.length)}
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

          <p data-hint className="pointer-events-none absolute bottom-20 left-1/2 z-[90] -translate-x-1/2 border-b border-text pb-1 text-caption text-text motion-reduce:hidden md:bottom-24">
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
      </div>

      {/* Scroll distance for the journey; the scene above is pinned over it. */}
      <div data-journey aria-hidden="true" className="-mt-[100svh] motion-reduce:hidden" style={{ height: `${BEATS.length * BEAT_SCREENS * 100 + 100}svh` }} />

      {/* The closing section scrolls over the still scene, its parts set on alternating sides. */}
      <section
        data-closing
        aria-labelledby="facts-title"
        className="relative z-10 bg-[linear-gradient(to_bottom,transparent_0%,rgb(0_0_0/0.72)_22%,rgb(0_0_0/0.86)_100%)] px-4 pb-24 pt-[40svh] sm:px-8 md:px-[8vw] md:pb-32"
      >
        <div data-rise className="max-w-2xl">
          <h2 id="facts-title" className="flex items-baseline gap-4 text-eyebrow text-text-muted">
            <span className="text-text">(01)</span>
            Eagle in numbers
          </h2>
          <p className="mt-8 text-h2 text-text">
            I have been standing on the Moon for{" "}
            <span className="tabular-nums">
              <EagleClock />
            </span>
            .
          </p>
        </div>

        <dl className="mt-24 flex flex-col gap-20 md:mt-32 md:gap-28">
          {FACTS.map((fact, i) => (
            <div key={fact.value} data-rise className={`flex max-w-md flex-col gap-3 border-t border-border pt-6 ${i % 2 === 0 ? "md:ml-auto" : ""}`}>
              <dt className="order-2 max-w-[28ch] text-body text-text-muted">{fact.label}</dt>
              <dd className="order-1 text-h1 tabular-nums text-text">{fact.value}</dd>
            </div>
          ))}
        </dl>

        <div data-rise className="mx-auto mt-28 flex max-w-2xl flex-col items-center gap-8 text-center md:mt-36">
          <PillLink href="/#stories" icon={<ArrowRightIcon width={16} height={16} />}>
            Meet the other machines
          </PillLink>
          <p className="text-data-sm text-text-muted">
            Paintings made from NASA photos, public domain (AS11-40-5927, 5875, 5877, 5903), and drawn from NASA references. Earth: NASA photo AS17-148-22727. Facts: NASA Space Science Data Coordinated Archive, Apollo 11 Lunar Module / EASEP.
          </p>
        </div>
      </section>
    </article>
  );
}
