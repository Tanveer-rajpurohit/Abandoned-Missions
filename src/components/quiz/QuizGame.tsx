"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { PLATFORM_LABEL } from "@/data/missions";
import { QUIZ, type QuizQuestion } from "@/data/quiz";
import { ThemePicker } from "@/components/ThemeToggle";
import { display } from "@/components/story/fonts";

gsap.registerPlugin(useGSAP);

/** The intro and score cards are the theme's own page, like the Play cover. */
const COVER = "var(--paper)";
const ON_COVER = "var(--ink)";
/** Ink for anything printed on a colour card; dark in every theme. */
const ON_POP = "var(--on-pop)";
const POPS = ["var(--pop-a)", "var(--pop-b)", "var(--pop-c)"];
/** The face of a sticker on a colour card: warm white, so it reads on all three colours. */
const STICKER = "#fffdf6";
/** Sticker links on the paper cards, as on the story pages. */
const JUMP = "inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-[var(--ink)] px-5 text-[0.9375rem] font-semibold text-[var(--on-pop)] shadow-[4px_4px_0_var(--ink)] transition-[translate,box-shadow] duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--ink)] active:translate-x-1 active:translate-y-1 active:shadow-none";
const EASE = "duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)]";
const REDUCED = "(prefers-reduced-motion: reduce)";

const LAST_QUESTION = QUIZ.length;
const FINAL = QUIZ.length + 1;
/** The stories behind the questions, each once, in the order they come up. */
const STORY_LINKS = [...new Map(QUIZ.map((q) => [q.story.slug, q.story.title])).entries()];
const INTRO_PHOTOS = [
  { src: "/images/stories/surveyor-3.jpg", alt: "Surveyor 3 on the Moon, with the Apollo 12 lunar module in the distance" },
  { src: "/images/stories/falcon.jpg", alt: "Jim Irwin beside the lunar rover, with Mount Hadley behind" },
  { src: "/images/stories/sojourner.jpg", alt: "The Sojourner rover among rocks on Mars" },
];

const pad = (n: number) => String(n).padStart(2, "0");

function verdictLine(score: number) {
  if (score === QUIZ.length) return "A perfect score. The machines would be proud.";
  if (score >= 7) return "Mission control is impressed.";
  if (score >= 4) return "A good landing, with a bounce or two.";
  return "Surveyor 3 bounced twice too. Read the stories and try again.";
}

function Arrow() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8h10M8.5 3.5 13 8l-4.5 4.5" />
    </svg>
  );
}

function Mark({ right }: { right: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      {right ? <path d="m3 8.5 3.2 3L13 4.5" /> : <path d="m4 4 8 8M12 4l-8 8" />}
    </svg>
  );
}

/** Verdict, explanation and the story link: a paper note that is stuck on after answering. */
function Note({ q, pick, compact = false }: { q: QuizQuestion; pick: number; compact?: boolean }) {
  const isRight = pick === q.answer;
  return (
    <>
      <p className={`${display.className} flex items-center gap-2 font-extrabold leading-none tracking-[-0.03em] ${compact ? "text-[1.375rem]" : "text-[1.75rem]"}`}>
        <span className="grid size-7 shrink-0 place-items-center rounded-full" style={{ background: isRight ? ON_POP : "var(--pop-b)", color: isRight ? STICKER : ON_POP }}>
          <Mark right={isRight} />
        </span>
        {isRight ? "Right!" : "Not quite."}
      </p>
      {!isRight && (
        <p className="mt-2 text-[0.9375rem] font-semibold leading-snug">
          The answer: {q.options[q.answer]}.
        </p>
      )}
      <p className={`mt-2 leading-[1.45] ${compact ? "text-[0.875rem]" : "text-[0.9375rem]"}`}>{q.explain}</p>
    </>
  );
}

function StoryLink({ q }: { q: QuizQuestion }) {
  return (
    <Link href={`/stories/${q.story.slug}`} className="mt-3 inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-semibold underline decoration-2 underline-offset-4 hover:decoration-[3px]">
      <span>
        Read the story of <span className="whitespace-nowrap">{q.story.title}</span>
      </span>
      <Arrow />
    </Link>
  );
}

/**
 * The quiz as a deck of Play cards: an intro, one flat-colour card per question and a score
 * card. Answer with a click or the keys 1 to 4; the right answer pops, a wrong one shakes, then
 * the photo wipes open with the explanation stuck beside it. Enter or the right arrow moves on.
 */
export function QuizGame() {
  const rootRef = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
  /** Bumped by "Play again" so every question card mounts fresh. */
  const [round, setRound] = useState(0);
  const [picks, setPicks] = useState<(number | null)[]>(() => QUIZ.map(() => null));
  const [announcement, setAnnouncement] = useState("");

  const score = picks.reduce<number>((n, pick, i) => n + (pick === QUIZ[i].answer ? 1 : 0), 0);
  const answered = picks.filter((pick) => pick !== null).length;
  const isQuestion = index >= 1 && index <= LAST_QUESTION;
  const current = isQuestion ? QUIZ[index - 1] : null;
  const currentPick = isQuestion ? picks[index - 1] : null;
  const canAdvance = index === 0 || (isQuestion && currentPick !== null);
  const onCover = index === 0 || index === FINAL;

  const { contextSafe } = useGSAP({ scope: rootRef });

  const next = useCallback(() => {
    if (canAdvance) setIndex((i) => Math.min(FINAL, i + 1));
  }, [canAdvance]);

  /** Pop and sparks for a right answer, a shake for a wrong one. Transforms only. */
  const celebrate = contextSafe((qIndex: number, option: number, isRight: boolean) => {
    if (window.matchMedia(REDUCED).matches) return;
    const card = rootRef.current?.querySelector(`[data-card="${qIndex + 1}"]`);
    const button = card?.querySelector<HTMLElement>(`[data-option="${option}"]`);
    if (!button) return;
    if (isRight) {
      gsap.fromTo(button.querySelector("[data-face]"), { scale: 0.9 }, { scale: 1, duration: 0.6, ease: "back.out(4)" });
      button.querySelectorAll<HTMLElement>("[data-spark]").forEach((spark, i, all) => {
        const angle = (i / all.length) * Math.PI * 2 + 0.3;
        const reach = 54 + (i % 3) * 16;
        gsap.fromTo(
          spark,
          { x: 0, y: 0, scale: 0.2, autoAlpha: 1, rotate: 0 },
          { x: Math.cos(angle) * reach * 1.6, y: Math.sin(angle) * reach, scale: 1, rotate: 140, autoAlpha: 0, duration: 0.75, ease: "power3.out" },
        );
      });
      gsap.fromTo("[data-score]", { scale: 1.3 }, { scale: 1, duration: 0.5, ease: "back.out(3)" });
    } else {
      gsap.fromTo(button, { x: 0 }, { keyframes: { x: [-10, 9, -7, 5, -2, 0] }, duration: 0.45, ease: "none" });
    }
  });

  const pick = useCallback(
    (qIndex: number, option: number) => {
      if (picks[qIndex] !== null) return;
      const q = QUIZ[qIndex];
      const isRight = option === q.answer;
      setPicks((all) => all.map((p, i) => (i === qIndex ? option : p)));
      const newScore = score + (isRight ? 1 : 0);
      setAnnouncement(`${isRight ? "Right!" : `Not quite. The answer is ${q.options[q.answer]}.`} ${q.explain} Score: ${newScore} of ${QUIZ.length}.`);
      celebrate(qIndex, option, isRight);
    },
    [picks, score, celebrate],
  );

  const playAgain = () => {
    setPicks(QUIZ.map(() => null));
    setRound((r) => r + 1);
    setAnnouncement("");
    setIndex(1);
  };

  // Keys: 1 to 4 answer, Enter or the right arrow moves on once the question is answered.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (target?.closest("input, textarea, select")) return;
      const number = Number(event.key);
      if (isQuestion && number >= 1 && number <= 4) {
        pick(index - 1, number - 1);
      } else if (event.key === "ArrowRight" || event.key === "Enter") {
        // Enter on a link or an ordinary button does that control's own job.
        if (event.key === "Enter" && target?.closest("a, button:not([data-option])")) return;
        if (!canAdvance) return;
        next();
      } else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, isQuestion, canAdvance, next, pick]);

  // Each new card: its parts rise in as it slides up, focus moves to its heading, and the score
  // card counts up.
  const isFirstRender = useRef(true);
  useGSAP(
    () => {
      const card = rootRef.current?.querySelector(`[data-card="${index}"]`);
      if (!card) return;
      if (!isFirstRender.current) card.querySelector<HTMLElement>("[data-heading]")?.focus({ preventScroll: true });
      isFirstRender.current = false;
      if (window.matchMedia(REDUCED).matches) return;
      gsap.from(card.querySelectorAll("[data-rise]"), { y: 28, autoAlpha: 0, duration: 0.7, ease: "power3.out", stagger: 0.06, delay: 0.22, clearProps: "transform,opacity,visibility" });
      const counter = card.querySelector<HTMLElement>("[data-count]");
      if (counter) {
        const total = Number(counter.dataset.count);
        const tally = { n: 0 };
        counter.textContent = "0";
        gsap.to(tally, { n: total, duration: 0.5 + total * 0.12, delay: 0.5, ease: "power2.out", onUpdate: () => (counter.textContent = String(Math.round(tally.n))) });
      }
    },
    { scope: rootRef, dependencies: [index, round] },
  );

  // After an answer: the photo wipes open, as on the story pages, and the note is stuck on. On
  // phones the note takes the place of the options once the pop or shake has played.
  useGSAP(
    () => {
      if (currentPick === null || window.matchMedia(REDUCED).matches) return;
      const card = rootRef.current?.querySelector(`[data-card="${index}"]`);
      if (!card) return;
      const wipes = card.querySelectorAll("[data-wipe]");
      gsap.fromTo(wipes, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.9, delay: 0.35, ease: "power3.inOut" });
      gsap.fromTo(card.querySelectorAll(".wipe-img"), { scale: 1.3 }, { scale: 1, duration: 1.2, delay: 0.35, ease: "power3.out" });
      gsap.from(card.querySelectorAll("[data-note]"), { y: 28, rotate: 3, autoAlpha: 0, duration: 0.6, delay: 0.75, ease: "back.out(1.6)" });
      gsap.from(card.querySelectorAll("[data-panel]"), { y: 28, autoAlpha: 0, duration: 0.55, delay: 0.85, ease: "power3.out" });
    },
    { scope: rootRef, dependencies: [currentPick] },
  );

  const cards = QUIZ.length + 2;

  return (
    <article ref={rootRef} className="relative h-svh overflow-hidden" style={{ background: COVER, color: ON_POP }}>
      <h1 className="sr-only">Stories from Void quiz</h1>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {Array.from({ length: cards }, (_, i) => {
        const where = i === index ? "now" : i < index ? "past" : "ahead";
        const shell = `group absolute inset-0 overflow-hidden transition-[translate,scale,rotate] ${EASE} data-[where=ahead]:translate-y-[112%] data-[where=ahead]:rotate-3 data-[where=past]:-translate-y-[3%] data-[where=past]:scale-[0.92] motion-reduce:transition-none`;
        const dim = <div aria-hidden="true" className={`pointer-events-none absolute inset-0 z-20 bg-black opacity-0 transition-opacity ${EASE} group-data-[where=past]:opacity-50 motion-reduce:transition-none`} />;
        const common = { "data-card": i, "data-where": where, "aria-hidden": where !== "now", inert: where !== "now" };

        if (i === 0) {
          return (
            <section key="intro" {...common} aria-labelledby="quiz-intro" className={shell} style={{ background: COVER, color: ON_COVER, zIndex: i }}>
              <p aria-hidden="true" className={`${display.className} pointer-events-none absolute -right-[2vw] -top-[6vw] text-[42vw] font-extrabold leading-none tracking-[-0.06em] opacity-[0.08] md:text-[34vw]`}>
                ?
              </p>
              <div className="relative grid h-full gap-8 px-6 pb-28 pt-20 [align-content:safe_center] md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:items-center md:gap-14 md:px-16">
                <div className="order-2 min-w-0 md:order-1">
                  <p data-rise className="flex items-center gap-3 text-eyebrow">
                    Stories from Void
                    <span aria-hidden="true" className="h-px w-8 bg-current" />
                    {QUIZ.length} questions
                  </p>
                  <h2 id="quiz-intro" data-heading tabIndex={-1} data-rise className={`${display.className} mt-3 max-w-[12ch] text-balance text-[clamp(2.75rem,min(7vw,11svh),7rem)] font-extrabold leading-[0.88] tracking-[-0.045em] outline-none`}>
                    How well do you know the machines?
                  </h2>
                  <p data-rise className="mt-5 max-w-[40ch] text-[1.0625rem] font-medium leading-[1.5] md:text-[1.1875rem]">
                    Every answer is in the stories. Some questions are facts; some are riddles, told by a machine about itself. Answer with a click or the keys 1 to 4.
                  </p>
                  <div data-rise className="mt-7">
                    <button type="button" onClick={next} className={`${JUMP} min-h-14 bg-[var(--pop-a)] px-8 text-[1.0625rem]`}>
                      Start the quiz
                      <Arrow />
                    </button>
                  </div>
                </div>
                <div data-rise aria-hidden="true" className="relative order-1 mx-auto aspect-[5/4] w-[min(26svh,62vw)] md:order-2 md:aspect-[4/5] md:w-[min(52svh,30vw)]">
                  {INTRO_PHOTOS.map((photo, n) => (
                    <div
                      key={photo.src}
                      className="absolute inset-0"
                      style={{ translate: `${(n - 1) * 14}% ${(1 - n) * 6}%`, rotate: `${(n - 1) * 7}deg`, zIndex: n === 1 ? 3 : n }}
                    >
                      <div className="absolute -bottom-3 -right-3 left-3 top-3 rounded-[1.25rem] border-2 border-[var(--ink)]" style={{ background: POPS[n] }} />
                      <Image src={photo.src} alt="" fill priority sizes="(min-width: 768px) 30vw, 62vw" className="rounded-[1.25rem] border-2 border-[var(--ink)] object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        }

        if (i === FINAL) {
          return (
            <section key="final" {...common} aria-labelledby="quiz-final" className={shell} style={{ background: COVER, color: ON_COVER, zIndex: i }}>
              {dim}
              <p aria-hidden="true" className={`${display.className} pointer-events-none absolute -right-[2vw] -top-[6vw] text-[42vw] font-extrabold leading-none tracking-[-0.06em] opacity-[0.08] md:text-[34vw]`}>
                {pad(score)}
              </p>
              <div className="relative grid h-full gap-6 px-6 pb-28 pt-20 [align-content:safe_center] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center md:gap-14 md:px-16">
                <div className="min-w-0">
                  <p data-rise className="text-eyebrow">Your score</p>
                  <h2 id="quiz-final" data-heading tabIndex={-1} className="outline-none">
                    <span data-rise className={`${display.className} mt-2 flex items-baseline gap-3 text-[clamp(5rem,min(16vw,22svh),13rem)] font-extrabold leading-[0.85] tracking-[-0.05em] tabular-nums`}>
                      <span data-count={score}>{score}</span>
                      <span className="text-[0.4em] tracking-[-0.03em] opacity-60">/ {QUIZ.length}</span>
                    </span>
                    <span data-rise className={`${display.className} mt-4 block max-w-[20ch] text-balance text-[clamp(1.5rem,2.8vw,2.5rem)] font-medium leading-[1.05] tracking-[-0.02em]`}>
                      {verdictLine(score)}
                    </span>
                  </h2>
                  <div data-rise className="mt-7 flex flex-wrap items-center gap-3">
                    <button type="button" onClick={playAgain} className={`${JUMP} bg-[var(--pop-a)]`}>
                      <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2.5 8a5.5 5.5 0 1 0 1.6-3.9M2.5 2.5v3h3" />
                      </svg>
                      Play again
                    </button>
                    <Link href="/#stories" className="inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-[var(--ink)] px-5 text-[0.9375rem] font-semibold transition-colors duration-150 hover:bg-[var(--ink)] hover:text-[var(--paper)] active:scale-[0.98]">
                      Meet all the machines
                    </Link>
                  </div>
                </div>
                <div className="min-w-0">
                  <p data-rise className="text-eyebrow">Read the stories behind the questions</p>
                  <ul className="mt-4 flex flex-wrap gap-3">
                    {STORY_LINKS.map(([slug, title], n) => (
                      <li key={slug} data-rise>
                        <Link href={`/stories/${slug}`} className={`${JUMP} min-h-11 px-4`} style={{ background: POPS[n % POPS.length] }}>
                          {title}
                          <Arrow />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          );
        }

        const qIndex = i - 1;
        const q = QUIZ[qIndex];
        const colour = POPS[qIndex % POPS.length];
        const block = POPS[(qIndex + 1) % POPS.length];
        const chosen = picks[qIndex];
        const isAnswered = chosen !== null;
        return (
          <section
            key={`${round}-${q.id}`}
            {...common}
            data-answered={isAnswered}
            aria-labelledby={`quiz-${q.id}`}
            className={shell}
            style={{ background: colour, color: ON_POP, zIndex: i }}
          >
            {dim}
            <p aria-hidden="true" className={`${display.className} pointer-events-none absolute -right-[2vw] -top-[6vw] text-[42vw] font-extrabold leading-none tracking-[-0.06em] opacity-[0.12] md:text-[34vw]`}>
              {pad(i)}
            </p>

            <div className="relative grid h-full gap-10 px-5 pb-24 pt-[4.75rem] [align-content:safe_center] sm:px-6 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:items-center md:gap-14 md:px-16 md:pb-28 md:pt-20">
              <div className="min-w-0">
                <p data-rise className="flex flex-wrap items-center gap-x-3 gap-y-1 text-eyebrow">
                  <span className="tabular-nums">
                    {pad(i)} / {pad(QUIZ.length)}
                  </span>
                  <span aria-hidden="true" className="h-px w-6 bg-current" />
                  {PLATFORM_LABEL[q.place]}
                  {q.kind === "riddle" && <span className="rounded-full bg-[var(--on-pop)] px-2 py-0.5" style={{ color: colour }}>Who am I?</span>}
                </p>
                <h2
                  id={`quiz-${q.id}`}
                  data-heading
                  tabIndex={-1}
                  data-rise
                  className={`${display.className} mt-3 max-w-[30ch] text-pretty text-[clamp(1.3125rem,min(2.3vw+0.45rem,4.6svh),2.625rem)] font-bold leading-[1.08] tracking-[-0.025em] outline-none md:mt-4`}
                >
                  {q.prompt}
                </h2>

                {/* Options and, on phones, the note that replaces them share one grid cell. */}
                <div className="mt-5 grid md:mt-7">
                  <div
                    role="group"
                    aria-label="Answers"
                    className={`grid gap-2.5 [grid-area:1/1] sm:grid-cols-2 sm:gap-3 max-md:transition-[opacity,visibility] max-md:duration-300 ${isAnswered ? "max-md:invisible max-md:opacity-0 max-md:delay-[900ms] motion-reduce:delay-0" : ""}`}
                  >
                    {q.options.map((option, n) => {
                      const isRight = n === q.answer;
                      const isChosen = n === chosen;
                      const state = !isAnswered ? "open" : isRight ? "right" : isChosen ? "wrong" : "rest";
                      return (
                        <div key={option} data-rise className={`relative ${state === "right" ? "z-10" : ""}`}>
                          <button
                            type="button"
                            data-option={n}
                            data-state={state}
                            aria-disabled={isAnswered}
                            onClick={() => pick(qIndex, n)}
                            className="group/opt relative block w-full text-left outline-offset-4 aria-disabled:cursor-default"
                          >
                            {/* The hard shadow stays put; the face moves, so the press is transform only. */}
                            <span aria-hidden="true" className="absolute inset-0 translate-x-1 translate-y-1 rounded-2xl" style={{ background: ON_POP }} />
                            <span
                              data-face
                              className={`relative flex min-h-12 items-center gap-3 rounded-2xl border-2 px-3 py-2 text-[0.9375rem] font-semibold leading-snug transition-[translate,opacity] duration-100 sm:min-h-14 md:text-[1rem] ${
                                state === "open"
                                  ? "group-hover/opt:-translate-x-0.5 group-hover/opt:-translate-y-0.5 group-active/opt:translate-x-1 group-active/opt:translate-y-1"
                                  : state === "right"
                                    ? ""
                                    : state === "wrong"
                                      ? "translate-x-1 translate-y-1"
                                      : "[&>span]:opacity-50"
                              }`}
                              style={{
                                borderColor: ON_POP,
                                background: state === "right" ? ON_POP : STICKER,
                                color: state === "right" ? STICKER : ON_POP,
                              }}
                            >
                              <span
                                className="grid size-7 shrink-0 place-items-center rounded-full border-2 text-[0.8125rem] font-bold tabular-nums"
                                style={
                                  state === "right"
                                    ? { borderColor: colour, background: colour, color: ON_POP }
                                    : state === "wrong"
                                      ? { borderColor: ON_POP, background: "var(--pop-b)", color: ON_POP }
                                      : { borderColor: ON_POP }
                                }
                              >
                                {state === "right" || state === "wrong" ? <Mark right={state === "right"} /> : n + 1}
                              </span>
                              <span className={state === "wrong" ? "line-through decoration-2" : ""}>{option}</span>
                              {state === "right" && <span className="sr-only">(the right answer)</span>}
                              {state === "wrong" && <span className="sr-only">(your answer, not right)</span>}
                            </span>
                            {isRight && (
                              <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2">
                                {Array.from({ length: 10 }, (_, s) => (
                                  <span
                                    key={s}
                                    data-spark
                                    className={`invisible absolute -left-1.5 -top-1.5 size-3 border-2 ${s % 2 ? "rounded-full" : "rotate-45 rounded-[2px]"}`}
                                    style={{ borderColor: ON_POP, background: s % 3 === 0 ? STICKER : POPS[(qIndex + 1 + (s % 2)) % POPS.length] }}
                                  />
                                ))}
                              </span>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {isAnswered && (
                    <div
                      data-panel
                      className="flex flex-col self-start rounded-[1.25rem] border-2 p-3 [grid-area:1/1] md:hidden"
                      style={{ background: STICKER, borderColor: ON_POP, boxShadow: `5px 5px 0 ${ON_POP}` }}
                    >
                      <div className="flex gap-3">
                        <div className="relative aspect-[4/5] w-24 shrink-0">
                          <div className="absolute -bottom-1.5 -right-1.5 left-1.5 top-1.5 rounded-xl border-2" style={{ background: block, borderColor: ON_POP }} />
                          <div data-wipe className="absolute inset-0 overflow-hidden rounded-xl border-2" style={{ borderColor: ON_POP, background: ON_POP }}>
                            <Image src={q.image.src} alt={q.image.alt} fill sizes="96px" className="wipe-img object-cover" />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <Note q={q} pick={chosen} compact />
                        </div>
                      </div>
                      <StoryLink q={q} />
                    </div>
                  )}
                </div>
              </div>

              {/* The photo: a question mark until answered, then it wipes open. */}
              <div className="relative mx-auto w-[min(40svh,28vw)] max-md:hidden">
                <div className="relative aspect-[5/4] rotate-2">
                  <div className="absolute -bottom-4 -right-4 left-4 top-4 rounded-[1.25rem] border-2" style={{ background: block, borderColor: ON_POP }} />
                  <div className="absolute inset-0 grid place-items-center rounded-[1.25rem] border-2" style={{ background: ON_POP, borderColor: ON_POP, color: colour }}>
                    <span aria-hidden="true" className={`${display.className} text-[clamp(6rem,14svh,10rem)] font-extrabold leading-none`}>?</span>
                  </div>
                  {isAnswered && (
                    <div data-wipe className="absolute inset-0 overflow-hidden rounded-[1.25rem] border-2" style={{ borderColor: ON_POP, background: ON_POP }}>
                      <Image src={q.image.src} alt={q.image.alt} fill sizes="28vw" className="wipe-img object-cover" />
                    </div>
                  )}
                </div>
                {isAnswered ? (
                  <div
                    data-note
                    className="relative z-10 -mt-3 ml-6 -rotate-1 rounded-[1.25rem] border-2 p-4"
                    style={{ background: STICKER, borderColor: ON_POP, boxShadow: `6px 6px 0 ${ON_POP}` }}
                  >
                    <Note q={q} pick={chosen} />
                    <StoryLink q={q} />
                  </div>
                ) : (
                  <p className="mt-6 text-center text-eyebrow opacity-70">Answer to see the photo</p>
                )}
                {isAnswered && <p className="mt-3 text-right text-data-sm opacity-70">Photo: NASA {q.image.credit}{q.image.note ? ` · ${q.image.note}` : ""}</p>}
              </div>
            </div>
          </section>
        );
      })}

      <Link href="/" className="absolute left-4 top-4 z-50 inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-[var(--ink)] bg-[var(--paper)] px-4 text-[0.875rem] font-medium text-[var(--ink)] transition-colors duration-150 hover:bg-[var(--ink)] hover:text-[var(--paper)] active:scale-[0.97] md:left-8">
        <span aria-hidden="true">←</span> Back
      </Link>
      <ThemePicker className="absolute right-4 top-4 z-50 md:right-8" />

      {/* Controls sit above every card and take the ink of the card below. */}
      <div
        className="absolute inset-x-4 bottom-4 z-50 flex items-center justify-between gap-3 transition-colors duration-300 md:inset-x-8 md:bottom-6 md:gap-4"
        style={{ color: onCover ? ON_COVER : ON_POP, "--hover-bg": onCover ? ON_COVER : ON_POP, "--hover-fg": onCover ? COVER : STICKER } as CSSProperties}
      >
        <p data-score className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full border-2 border-current px-4 text-[0.875rem] font-semibold">
          Score
          <span className={`${display.className} text-[1.375rem] font-extrabold leading-none tabular-nums`}>{score}</span>
        </p>

        <p className="flex-1 text-center text-eyebrow tabular-nums sm:hidden">
          {isQuestion ? `${pad(index)} / ${pad(QUIZ.length)}` : index === FINAL ? "Done" : ""}
        </p>
        <ol aria-label={`${answered} of ${QUIZ.length} answered`} className="hidden min-w-0 flex-1 items-center gap-1.5 sm:flex">
          {QUIZ.map((q, n) => {
            const p = picks[n];
            return (
              <li key={q.id} className="flex-1 py-3">
                <span className="relative block h-1.5 overflow-hidden rounded-full bg-current/25">
                  <span
                    className={`absolute inset-0 origin-left bg-current transition-[scale,opacity] duration-500 ${p === null ? "scale-x-0" : "scale-x-100"} ${p !== null && p !== q.answer ? "opacity-45" : ""}`}
                  />
                </span>
                <span className="sr-only">{p === null ? "Not answered" : p === q.answer ? "Right" : "Wrong"}</span>
              </li>
            );
          })}
        </ol>

        <button
          type="button"
          onClick={next}
          disabled={!canAdvance}
          className={`inline-flex h-12 shrink-0 items-center gap-2 rounded-full border-2 border-current px-5 text-[0.9375rem] font-semibold transition-[background-color,color,opacity] duration-150 hover:bg-[var(--hover-bg)] hover:text-[var(--hover-fg)] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-30 ${index === FINAL ? "invisible" : ""}`}
        >
          {index === 0 ? "Start" : index === LAST_QUESTION ? "My score" : "Next"}
          <Arrow />
        </button>
      </div>
    </article>
  );
}
