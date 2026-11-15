"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { missions, PLATFORM_LABEL } from "@/data/missions";
import { ArrowRightIcon } from "@/components/icons";
import { PillLink } from "@/components/PillLink";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Splits a name into per-letter spans, keeping each word unbreakable so lines wrap between words. */
function SplitName({ text }: { text: string }) {
  return text.split(" ").map((word, w) => (
    <span key={w} className="inline-block whitespace-nowrap">
      {[...word].map((ch, i) => (
        <span key={i} data-char className="inline-block will-change-[transform,filter,opacity]">
          {ch}
        </span>
      ))}
      {" "}
    </span>
  ));
}

/**
 * Full-bleed split rows, photo and panel swapping sides on every row, as in the home.mp4
 * reference. Each photo drifts inside its frame against the scroll; the machine's name resolves
 * out of a blur letter by letter as its row arrives.
 */
export function Stories() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-head] > *", {
          y: 24,
          opacity: 0,
          filter: "blur(12px)",
          duration: 1,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: "[data-head]", start: "top 80%", once: true },
        });

        gsap.utils.toArray<HTMLElement>("[data-row]").forEach((row) => {
          const scrub = { trigger: row, start: "top bottom", end: "bottom top", scrub: true };
          gsap.fromTo(row.querySelector("[data-row-img]"), { yPercent: -16 }, { yPercent: 16, ease: "none", scrollTrigger: scrub });
          gsap.fromTo(row.querySelector("[data-row-drift]"), { yPercent: 10 }, { yPercent: -10, ease: "none", scrollTrigger: scrub });

          gsap
            .timeline({ scrollTrigger: { trigger: row, start: "top 72%", once: true } })
            .from(row.querySelectorAll("[data-char]"), { yPercent: 70, opacity: 0, filter: "blur(14px)", duration: 1, stagger: 0.03, ease: "power3.out" })
            .from(row.querySelectorAll("[data-rise]"), { y: 20, opacity: 0, filter: "blur(8px)", duration: 0.8, stagger: 0.07, ease: "power3.out" }, 0.25);
        });
      });
      return () => mm.revert();
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} id="stories" aria-labelledby="stories-title">
      <header data-head className="px-4 pb-16 pt-20 sm:px-8 md:px-12 md:pb-20 md:pt-28">
        <p className="flex items-baseline gap-4 text-eyebrow text-text-muted">
          <span className="text-text">(02)</span>
          Eleven machines
        </p>
        <h2 id="stories-title" className="mt-8 max-w-4xl text-h1 text-text md:text-display">
          The stories
        </h2>
        <p className="mt-6 max-w-xl text-story text-text-muted">
          From the Moon to Mars and out past Jupiter. Each one finished its work, sent its last signal, and is still out there.
        </p>
      </header>

      <ol>
        {missions.map((m, i) => {
          const isPhotoRight = i % 2 === 1;
          return (
            <li key={m.slug} id={m.slug} data-row className="grid min-h-[90svh] md:grid-cols-2">
              <figure className={`relative min-h-[60svh] overflow-hidden bg-surface-sunken md:min-h-0 ${isPhotoRight ? "md:order-2" : ""}`}>
                <div data-row-img className="absolute inset-x-0 -inset-y-[20%]">
                  <Image src={m.image.src} alt={m.image.alt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
                </div>
                <figcaption className="absolute bottom-4 left-4 bg-black/60 px-2 py-1 text-data-sm text-white md:left-6">
                  {m.image.isArtwork ? "Artwork" : "Photo"}: NASA · {m.image.credit}
                </figcaption>
              </figure>

              <article className="flex flex-col justify-between gap-16 px-4 py-12 sm:px-8 md:px-12 md:py-16">
                <div data-rise className="flex items-baseline justify-between gap-4 text-eyebrow text-text-muted">
                  <p className="flex items-baseline gap-4">
                    <span className="text-text">({pad2(i + 1)})</span>
                    {PLATFORM_LABEL[m.platform]} · {m.place}
                  </p>
                  {m.coords && <p className="hidden text-right lg:block">{m.coords}</p>}
                </div>

                <div data-row-drift>
                  <h3 aria-label={m.name} className="text-[clamp(2.5rem,4.8vw,4.5rem)] font-normal uppercase leading-[0.92] tracking-[-0.045em] text-text">
                    <span aria-hidden="true">
                      <SplitName text={m.name} />
                    </span>
                  </h3>
                  <p data-rise className="mt-4 text-caption text-text-muted">{m.craft}</p>
                  <p data-rise className="mt-6 max-w-lg text-body text-text-muted">{m.body}</p>
                </div>

                <div className="flex flex-col gap-10">
                  <dl data-rise className="grid grid-cols-2 gap-6 border-t border-border pt-6 sm:grid-cols-3">
                    <div className="col-span-2 sm:col-span-1">
                      <dt className="text-data-sm text-text-muted">{m.stat.label}</dt>
                      <dd className="mt-2 text-[1.75rem] leading-none tracking-[-0.03em] tabular-nums text-text">{m.stat.value}</dd>
                    </div>
                    <div>
                      <dt className="text-data-sm text-text-muted">{m.arrived.label}</dt>
                      <dd className="mt-2 text-data text-text">{m.arrived.date}</dd>
                    </div>
                    <div>
                      <dt className="text-data-sm text-text-muted">{m.lastSignal.label}</dt>
                      <dd className="mt-2 text-data text-text">{m.lastSignal.date}</dd>
                    </div>
                  </dl>

                  <div data-rise>
                    <PillLink href={`/stories/${m.slug}`} icon={<ArrowRightIcon width={16} height={16} />}>
                      Read the story
                    </PillLink>
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
