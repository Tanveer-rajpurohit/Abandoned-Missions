"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Story } from "@/data/stories";
import { narrationFor } from "@/data/stories/narration";
import { ThemePicker } from "@/components/ThemeToggle";
import { Sources } from "./Sources";
import { display } from "./fonts";
import { RATES, useNarrator } from "./useNarrator";
import { useStepper } from "./useStepper";

/** Pause between the end of one card being read and the next card arriving. */
const GAP_MS = 1000;
/** The cover card is the theme's own page: the same background and ink as the home page. */
const COVER = "var(--paper)";
const ON_COVER = "var(--ink)";
/** Ink for anything printed on a colour card; dark in every theme. */
const ON_POP = "var(--on-pop)";
const POPS = ["var(--pop-a)", "var(--pop-b)", "var(--pop-c)"];

const languageNames = new Intl.DisplayNames(["en"], { type: "language", fallback: "code" });
const regionNames = new Intl.DisplayNames(["en"], { type: "region", fallback: "code" });

/** "Microsoft Aria Online (Natural) - English (United States)" becomes "Aria (Natural), United States". */
function voiceLabel(voice: SpeechSynthesisVoice): string {
  const name = voice.name.split(" - ")[0].replace(/^Microsoft\s+/, "").replace(/\s*Online\s*\(Natural\)/, " (Natural)");
  const region = voice.lang.split(/[-_]/)[1]?.toUpperCase();
  return region ? `${name}, ${regionNames.of(region) ?? region}` : name;
}

/** Voices grouped by language with English first, the way the dropdown lists them. */
function groupByLanguage(voices: SpeechSynthesisVoice[]) {
  const groups = new Map<string, SpeechSynthesisVoice[]>();
  for (const voice of voices) {
    const code = voice.lang.split(/[-_]/)[0].toLowerCase();
    groups.set(code, [...(groups.get(code) ?? []), voice]);
  }
  return [...groups.entries()]
    .map(([code, list]) => ({ code, name: languageNames.of(code) ?? code, voices: list.sort((a, b) => voiceLabel(a).localeCompare(voiceLabel(b))) }))
    .sort((a, b) => (a.code === "en" ? -1 : b.code === "en" ? 1 : a.name.localeCompare(b.name)));
}

/** The cover card, then one card per beat in the three flat colours in turn. */
const toSlides = (story: Story) => [
  { id: "cover", title: story.title, when: story.eyebrow, lines: [story.subtitle], fact: null, image: story.cover, colour: COVER },
  ...story.beats.map((beat, i) => ({ id: beat.id, title: beat.title, when: beat.when, lines: beat.lines, fact: beat.fact, image: beat.image, colour: POPS[i % POPS.length] })),
];

/** A themed dropdown that opens upward, since the controls sit at the bottom of the screen. */
function VoicePicker({ voices, current, onPick }: { voices: SpeechSynthesisVoice[]; current: SpeechSynthesisVoice | undefined; onPick: (voiceURI: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const groups = useMemo(() => groupByLanguage(voices), [voices]);
  return (
    <div className="relative mt-2" onKeyDown={(event) => event.key === "Escape" && isOpen && (event.stopPropagation(), setIsOpen(false))}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border-2 border-[var(--ink)] px-3 text-left text-[0.9375rem] font-medium transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--ink)_10%,transparent)]"
      >
        <span className="truncate">{current ? voiceLabel(current) : "No voices on this device"}</span>
        <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 transition-transform duration-150 ${isOpen ? "" : "rotate-180"}`}>
          <path d="m3.5 6 4.5 4.5L12.5 6" />
        </svg>
      </button>
      {isOpen && (
        <div role="listbox" aria-label="Narrator voice" className="absolute inset-x-0 bottom-full z-10 mb-2 max-h-[min(15rem,40svh)] overflow-y-auto rounded-xl border-2 border-[var(--ink)] bg-[var(--paper)] p-1 shadow-[4px_4px_0_var(--ink)]">
          {groups.map((group) => (
            <div key={group.code} role="group" aria-label={group.name}>
              <p className="px-3 pb-1 pt-2 text-eyebrow opacity-70">{group.name}</p>
              {group.voices.map((option) => (
                <button
                  key={option.voiceURI}
                  type="button"
                  role="option"
                  aria-selected={option.voiceURI === current?.voiceURI}
                  onClick={() => {
                    onPick(option.voiceURI);
                    setIsOpen(false);
                  }}
                  className="block min-h-10 w-full rounded-lg px-3 text-left text-[0.9375rem] transition-colors duration-100 hover:bg-[color-mix(in_srgb,var(--ink)_14%,transparent)] aria-selected:bg-[var(--ink)] aria-selected:font-semibold aria-selected:text-[var(--paper)]"
                >
                  {voiceLabel(option)}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SpeakerIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6v4h3l4 3V3L5 6zM11.5 5.5a3.5 3.5 0 0 1 0 5M13 3.5a6.5 6.5 0 0 1 0 9" />
    </svg>
  );
}

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
  const slides = useMemo(() => toSlides(story), [story]);
  const meterRef = useRef<HTMLSpanElement>(null);
  const narrator = useNarrator();
  const { speak, stop } = narrator;
  const script = useMemo(() => narrationFor(story), [story]);
  
  const [isNarrating, setIsNarrating] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const { index, go, next, prev } = useStepper(slides.length);
  const isLast = index === slides.length - 1;
  const onDark = index === 0;

  const setMeter = (fraction: number) => {
    if (meterRef.current) meterRef.current.style.transform = `scaleX(${fraction})`;
  };

  // Reads the current card, waits a beat, then moves on. A new card, voice or speed restarts
  // this effect, and pausing cancels the speech in its cleanup.
  useEffect(() => {
    if (!isNarrating) return;
    let gap: number | undefined;
    setMeter(0);
    speak(script[slides[index].id], {
      onProgress: setMeter,
      onEnd: () => {
        setMeter(1);
        gap = window.setTimeout(() => {
          if (index < slides.length - 1) next();
          else {
            setIsNarrating(false);
            setHasFinished(true);
          }
        }, GAP_MS);
      },
      onFail: () => setIsNarrating(false),
    });
    return () => {
      window.clearTimeout(gap);
      stop();
    };
  }, [isNarrating, index, slides, script, speak, stop, next]);

  const listen = () => {
    if (isNarrating) {
      setIsNarrating(false);
      return;
    }
    if (hasFinished) go(0);
    setHasFinished(false);
    setIsNarrating(true);
  };

  return (
    <article className="relative h-svh overflow-hidden" style={{ background: COVER, color: ON_POP }}>
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
            style={{ background: slide.colour, color: isCover ? ON_COVER : ON_POP, zIndex: i }}
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
                      <span aria-hidden="true" className="h-px w-8 bg-current" />
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
                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={next}
                      className="inline-flex min-h-14 items-center gap-3 rounded-full bg-[var(--pop-a)] px-8 text-[1.125rem] font-medium text-[var(--on-pop)] transition-[background-color,translate] duration-150 hover:-translate-y-0.5 hover:bg-white active:translate-y-0 active:scale-[0.98]"
                    >
                      Start the story
                      <Arrow />
                    </button>
                    {narrator.isSupported && (
                      <button
                        type="button"
                        onClick={() => {
                          setHasFinished(false);
                          setIsNarrating(true);
                        }}
                        className="inline-flex min-h-14 items-center gap-3 rounded-full border-2 border-current px-7 text-[1.125rem] font-medium transition-colors duration-150 hover:bg-[var(--ink)] hover:text-[var(--paper)] active:scale-[0.98]"
                      >
                        <SpeakerIcon />
                        Listen to it
                      </button>
                    )}
                  </div>
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
                  style={{ borderColor: isCover ? ON_COVER : ON_POP, boxShadow: `12px 12px 0 ${isCover ? "var(--pop-a)" : ON_POP}` }}
                />
                <p className="absolute -bottom-9 left-0 text-data-sm opacity-70 max-md:hidden">Photo: NASA {slide.image.credit}</p>
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
      <div className="absolute inset-x-4 bottom-4 z-50 flex items-center justify-between gap-4 transition-colors duration-300 md:inset-x-8 md:bottom-6" style={{ color: onDark ? ON_COVER : ON_POP, "--hover-bg": onDark ? ON_COVER : ON_POP, "--hover-fg": onDark ? COVER : "#ffffff" } as React.CSSProperties}>
        <button
          type="button"
          onClick={prev}
          disabled={index === 0}
          aria-label="Previous"
          className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-current transition-colors duration-150 hover:bg-[var(--hover-bg)] hover:text-[var(--hover-fg)] active:scale-[0.96] disabled:pointer-events-none disabled:opacity-30"
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

        <div className="relative flex shrink-0 items-center gap-2">
          {narrator.isSupported && (
            <>
            <button
              type="button"
              onClick={() => setIsVoiceOpen((open) => !open)}
              aria-expanded={isVoiceOpen}
              aria-label="Voice and speed"
              className="grid size-12 place-items-center rounded-full border-2 border-current transition-colors duration-150 hover:bg-[var(--hover-bg)] hover:text-[var(--hover-fg)] active:scale-[0.96] aria-expanded:bg-[var(--hover-bg)] aria-expanded:text-[var(--hover-fg)]"
            >
              <SpeakerIcon />
            </button>
            <button
              type="button"
              onClick={listen}
              aria-pressed={isNarrating}
              aria-label={isNarrating ? "Pause the narration" : "Read the story aloud"}
              className={`inline-flex h-12 items-center justify-center gap-2 rounded-full border-2 border-current transition-colors duration-150 hover:bg-[var(--hover-bg)] hover:text-[var(--hover-fg)] active:scale-[0.96] min-w-28 px-5 text-[0.9375rem] font-semibold`}
            >
              <svg aria-hidden="true" viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
                {isNarrating ? <path d="M4 3h3v10H4zM9 3h3v10H9z" /> : <path d="M5 3l8 5-8 5z" />}
              </svg>
              {isNarrating ? "Pause" : "Listen"}
            </button>
            </>
          )}
          <button
            type="button"
            onClick={next}
            disabled={isLast}
            aria-label="Next"
            className="grid size-12 place-items-center rounded-full border-2 border-current transition-colors duration-150 hover:bg-[var(--hover-bg)] hover:text-[var(--hover-fg)] active:scale-[0.96] disabled:pointer-events-none disabled:opacity-30"
          >
            <Arrow />
          </button>

          {isVoiceOpen && (
            <>
              <button type="button" aria-label="Close voice settings" tabIndex={-1} onClick={() => setIsVoiceOpen(false)} className="fixed inset-0 -z-10 cursor-default" />
              <div role="dialog" aria-label="Voice and speed" onKeyDown={(event) => event.key === "Escape" && setIsVoiceOpen(false)} className="absolute bottom-full right-0 mb-3 w-[min(21rem,calc(100vw-2rem))] rounded-2xl border-2 border-[var(--ink)] bg-[var(--paper)] p-4 text-[var(--ink)] shadow-[6px_6px_0_var(--ink)]">
                <p className="text-eyebrow">Voice</p>
                <VoicePicker voices={narrator.voices} current={narrator.voice} onPick={narrator.setVoice} />

                <p className="mt-4 text-eyebrow">Speed</p>
                <div role="group" aria-label="Speaking speed" className="mt-2 flex gap-2">
                  {RATES.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => narrator.setRate(option.value)}
                      aria-pressed={narrator.rate === option.value}
                      className="min-h-11 flex-1 rounded-full border-2 border-[var(--ink)] text-[0.875rem] font-medium transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--ink)_12%,transparent)] active:scale-[0.97] aria-pressed:bg-[var(--ink)] aria-pressed:text-[var(--paper)]"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <p className="mt-4 text-[0.8125rem] leading-snug opacity-75">Voices come from this device, so the list differs between phones and computers. Changing the voice or speed starts the card again.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
