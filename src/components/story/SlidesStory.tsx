"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Story } from "@/data/stories";
import { ThemePicker } from "@/components/ThemeToggle";
import { Sources } from "./Sources";
import { display } from "./fonts";
import { useStepper } from "./useStepper";

const SECONDS_PER_BEAT = 8;
const INK = "var(--ink)";
const PAPER = "var(--paper)";
/** Ink for anything printed on a colour card; dark in every theme. */
const ON_POP = "var(--on-pop)";
const POPS = ["var(--pop-a)", "var(--pop-b)", "var(--pop-c)"];

/** The cover card, then one card per beat in the three flat colours in turn. */
const toSlides = (story: Story) => [
  { id: "cover", title: story.title, when: story.eyebrow, lines: [story.subtitle], fact: null, image: story.cover, colour: INK },
  ...story.beats.map((beat, i) => ({ id: beat.id, title: beat.title, when: beat.when, lines: beat.lines, fact: beat.fact, image: beat.image, colour: POPS[i % POPS.length] })),
];

function Arrow({ flip = false }: { flip?: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={flip ? "rotate-180" : ""}>
      <path d="M3 8h10M8.5 3.5 13 8l-4.5 4.5" />
    </svg>
  );
}

/**
 * Version 2: a deck of loud cards. Every moment is one full-screen card in a flat colour with
 * a huge number and headline; the next card is dealt up from the bottom on top of the last.
 * Arrow keys, buttons, or auto-play, which is what a narrated telling would drive.
 */
export function SlidesStory({ story }: { story: Story }) {
  const slides = toSlides(story);
  const meterRef = useRef<HTMLSpanElement>(null);
  const { index, go, next, prev, isPlaying, toggle } = useStepper(slides.length, {
    seconds: SECONDS_PER_BEAT,
    onProgress: (t) => {
      if (meterRef.current) meterRef.current.style.transform = `scaleX(${t})`;
    },
  });
  const isLast = index === slides.length - 1;
  const onDark = index === 0;

  return (
    <article className="relative h-svh overflow-hidden" style={{ background: INK, color: INK }}>
      <h1 className="sr-only">{`${story.title}: ${story.subtitle}`}</h1>

      {slides.map((slide, i) => {
        const where = i === index ? "now" : i < index ? "past" : "ahead";
        const isCover = i === 0;
        return (
          <section
            key={slide.id}
            aria-label={slide.title}
            aria-hidden={where !== "now"}
            inert={where !== "now"}
            data-where={where}
            style={{ background: slide.colour, color: isCover ? PAPER : ON_POP, zIndex: i }}
            className="absolute inset-0 overflow-hidden transition-[translate,scale,rotate,filter] duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] data-[where=ahead]:translate-y-[112%] data-[where=ahead]:rotate-3 data-[where=past]:-translate-y-[3%] data-[where=past]:scale-[0.92] data-[where=past]:brightness-50 motion-reduce:transition-none"
          >
            <p aria-hidden="true" className={`${display.className} pointer-events-none absolute -right-[2vw] -top-[6vw] text-[42vw] font-extrabold leading-none tracking-[-0.06em] opacity-[0.12] md:text-[34vw]`}>
              {isCover ? "11" : String(i).padStart(2, "0")}
            </p>

            <div className="relative grid h-full content-center gap-6 px-6 pb-28 pt-20 md:grid-cols-[1.15fr_1fr] md:items-center md:gap-14 md:px-16">
              <div className="order-2 md:order-1">
                <p className="flex items-center gap-3 text-eyebrow">
                  {!isCover && (
                    <>
                      <span className="tabular-nums">
                        {String(i).padStart(2, "0")} / {String(story.beats.length).padStart(2, "0")}
                      </span>
                    </>
                  )}
                  {slide.when}
                </p>
                <h2
                  className={`${display.className} mt-3 text-balance font-extrabold leading-[0.86] tracking-[-0.045em] ${isCover ? "text-[clamp(5rem,17vw,15rem)]" : "max-w-[11ch] text-[clamp(2.75rem,7.4vw,7.5rem)]"}`}
                >
                  {slide.title}
                </h2>
                <div className={`mt-5 flex max-w-[38ch] flex-col gap-2 leading-[1.5] ${isCover ? `${display.className} text-[clamp(1.375rem,2.6vw,2.25rem)] font-medium leading-[1.1]` : "text-[1.0625rem] font-medium md:text-[1.25rem]"}`}>
                  {slide.lines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
                {slide.fact && (
                  <p className="mt-5 inline-flex max-w-full items-center gap-3 rounded-2xl px-4 py-3" style={{ background: ON_POP, color: slide.colour }}>
                    <span className={`${display.className} whitespace-nowrap text-[1.5rem] font-extrabold leading-none tabular-nums md:text-[2rem]`}>{slide.fact.value}</span>
                    <span className="text-[0.8125rem] leading-snug text-white">
                      {slide.fact.label}
                    </span>
                  </p>
                )}
                {isCover && (
                  <button
                    type="button"
                    onClick={next}
                    className="mt-8 inline-flex min-h-14 items-center gap-3 rounded-full bg-[var(--pop-a)] px-8 text-[1.125rem] font-medium text-[var(--on-pop)] transition-[background-color,translate] duration-150 hover:-translate-y-0.5 hover:bg-white active:translate-y-0 active:scale-[0.98]"
                  >
                    Start the story
                    <Arrow />
                  </button>
                )}
                {i === slides.length - 1 && (
                  <details className="mt-4 max-w-[40ch]">
                    <summary className="cursor-pointer text-[0.9375rem] font-medium underline underline-offset-4">Sources and other machines</summary>
                    <Sources sources={story.sources} className="mt-3" />
                    <Link href="/#stories" className="mt-3 inline-block font-medium underline underline-offset-4">
                      Meet the other machines
                    </Link>
                  </details>
                )}
              </div>

              <div className={`relative order-1 mx-auto aspect-[5/4] w-[min(34svh,78vw)] md:order-2 md:aspect-[4/5] md:w-[min(62svh,34vw)] ${i % 2 ? "-rotate-2" : "rotate-2"}`}>
                <Image
                  src={slide.image.src}
                  alt={where === "now" ? slide.image.alt : ""}
                  fill
                  priority={i < 2}
                  sizes="(min-width: 768px) 34vw, 78vw"
                  className="rounded-3xl border-[3px] object-cover"
                  style={{ borderColor: isCover ? PAPER : ON_POP, boxShadow: `12px 12px 0 ${isCover ? "var(--pop-a)" : ON_POP}` }}
                />
                <p className="absolute -bottom-9 left-0 text-data-sm opacity-70 max-md:hidden">Photo: NASA {slide.image.credit}</p>
                {slide.image.note && <p className="absolute inset-x-0 top-[calc(100%+1.25rem)] text-[0.6875rem] leading-snug opacity-60 md:top-[calc(100%+2.75rem)] md:text-[0.75rem]">{slide.image.note}</p>}
              </div>
            </div>
          </section>
        );
      })}

      <Link href={`/stories/${story.slug}`} className="absolute left-4 top-4 z-50 md:left-8 inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-[var(--ink)] bg-[var(--paper)] px-4 text-[0.875rem] font-medium text-[var(--ink)] transition-colors duration-150 hover:bg-[var(--ink)] hover:text-[var(--paper)] active:scale-[0.97]">
        <span aria-hidden="true">←</span> Back
      </Link>
      <ThemePicker className="absolute right-4 top-4 z-50 md:right-8" />

      {/* Controls sit above every card and take the ink or paper colour of the card below. */}
      <div className="absolute inset-x-4 bottom-4 z-50 flex items-center justify-between gap-4 transition-colors duration-300 md:inset-x-8 md:bottom-6" style={{ color: onDark ? PAPER : ON_POP }}>
        <button
          type="button"
          onClick={prev}
          disabled={index === 0}
          aria-label="Previous"
          className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-current transition-colors duration-150 hover:bg-[var(--on-pop)] hover:text-white active:scale-[0.96] disabled:pointer-events-none disabled:opacity-30"
        >
          <Arrow flip />
        </button>

        <ol className="hidden min-w-0 flex-1 items-center gap-1.5 sm:flex">
          {slides.map((slide, i) => (
            <li key={slide.id} className="flex-1">
              <button type="button" onClick={() => go(i)} aria-label={slide.title} aria-current={i === index ? "step" : undefined} className="group block w-full py-3">
                <span className="relative block h-1.5 overflow-hidden rounded-full bg-current/25 transition-[height] duration-150 group-hover:h-2.5">
                  <span key={i === index ? "now" : "rest"} ref={i === index ? meterRef : undefined} className="absolute inset-0 origin-left bg-current" style={{ transform: `scaleX(${i < index ? 1 : 0})` }} />
                </span>
              </button>
            </li>
          ))}
        </ol>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={toggle}
            aria-pressed={isPlaying}
            aria-label={isPlaying ? "Pause auto-play" : "Play the story automatically"}
            className="grid size-12 place-items-center rounded-full border-2 border-current transition-colors duration-150 hover:bg-[var(--on-pop)] hover:text-white active:scale-[0.96]"
          >
            <svg aria-hidden="true" viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
              {isPlaying ? <path d="M4 3h3v10H4zM9 3h3v10H9z" /> : <path d="M5 3l8 5-8 5z" />}
            </svg>
          </button>
          <button
            type="button"
            onClick={next}
            disabled={isLast}
            aria-label="Next"
            className="grid size-12 place-items-center rounded-full border-2 border-current transition-colors duration-150 hover:bg-[var(--on-pop)] hover:text-white active:scale-[0.96] disabled:pointer-events-none disabled:opacity-30"
          >
            <Arrow />
          </button>
        </div>
      </div>
    </article>
  );
}
