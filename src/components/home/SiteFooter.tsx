"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { missions, PLATFORM_LABEL, type Platform } from "@/data/missions";
import { ArrowDownIcon } from "@/components/icons";
import { PillLink } from "@/components/PillLink";
import { EagleClock } from "./EagleClock";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const WORDMARK = "Abandoned Missions";
const PLATFORMS: Platform[] = ["moon", "mars", "deep-space"];

const COLUMNS = [
  {
    title: "Explore",
    links: [
      { href: "#why", label: "Why these machines" },
      { href: "#stories", label: "The machines" },
    ],
  },
  {
    title: "Destinations",
    links: PLATFORMS.map((p) => ({ href: `#${missions.find((m) => m.platform === p)?.slug ?? "stories"}`, label: PLATFORM_LABEL[p] })),
  },
  {
    title: "Sources",
    links: [
      { href: "https://nssdc.gsfc.nasa.gov/", label: "NASA NSSDCA" },
      { href: "https://images.nasa.gov/", label: "NASA Image Library" },
    ],
  },
];

export function SiteFooter() {
  const footerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // The wordmark climbs out of the page's bottom edge as the scroll runs out.
        gsap.from("[data-mark]", {
          yPercent: 100,
          ease: "none",
          stagger: 0.04,
          scrollTrigger: { trigger: "[data-mark-row]", start: "top bottom", end: "bottom bottom", scrub: 0.6 },
        });
      });
      return () => mm.revert();
    },
    { scope: footerRef },
  );

  return (
    <footer ref={footerRef} className="overflow-hidden border-t border-border bg-surface">
      <div className="px-4 pt-16 sm:px-8 md:px-12 md:pt-24">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="flex items-baseline gap-4 text-eyebrow text-text-muted">
              <span className="text-text">(03)</span>
              Still out there
            </p>
            <p className="mt-6 max-w-2xl text-h1 text-text">Nobody came to collect them.</p>
          </div>
          <PillLink
            href="#top"
            className="self-start md:self-auto"
            icon={<ArrowDownIcon width={16} height={16} className="rotate-180" />}
           
          >
            Back to top
          </PillLink>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-x-6 gap-y-10 border-t border-border pt-8 md:grid-cols-4">
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="text-eyebrow text-text-muted">{col.title}</p>
              <ul className="mt-4 grid gap-1">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      className="inline-flex min-h-11 items-center text-body text-text underline-offset-4 hover:underline"
                      {...(l.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          <div>
            <p className="text-eyebrow text-text-muted">Eagle, on the Moon for</p>
            <p className="mt-4 flex min-h-11 items-center text-data text-text">
              <EagleClock />
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-border pt-6 text-data-sm text-text-muted md:flex-row md:justify-between">
          <p>Photos and artwork: NASA, public domain. Mission facts: NASA Space Science Data Coordinated Archive.</p>
          <p>NASA Space Apps Challenge 2026</p>
        </div>
      </div>

      <p
        data-mark-row
        aria-hidden="true"
        className="mt-10 overflow-hidden whitespace-nowrap px-[1.5vw] pb-[1vw] text-center text-[10vw] font-normal uppercase leading-[0.82] tracking-[-0.055em] text-text"
      >
        {[...WORDMARK].map((ch, i) => (
          <span key={i} data-mark className="inline-block">
            {ch === " " ? " " : ch}
          </span>
        ))}
      </p>
    </footer>
  );
}
