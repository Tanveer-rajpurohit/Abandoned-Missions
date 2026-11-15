"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowDownIcon } from "@/components/icons";
import { PillLink } from "@/components/PillLink";
import { missions, type Mission } from "@/data/missions";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const SLIDE_MS = 4500;
const SLIDES = ["surveyor-3", "opportunity", "pioneer-10"]
  .map((slug) => missions.find((m) => m.slug === slug))
  .filter((m): m is Mission => m !== undefined);

function Word({ text, className }: { text: string; className: string }) {
  return (
    <span aria-hidden="true" className={`absolute whitespace-nowrap text-[16vw] font-normal uppercase leading-[0.8] tracking-[-0.055em] text-text md:text-[13vw] ${className}`}>
      {[...text].map((ch, i) => (
        <span key={i} data-char className="inline-block">
          <span data-char-in className="inline-block opacity-0">
            {ch === " " ? " " : ch}
          </span>
        </span>
      ))}
    </span>
  );
}

/**
 * The section is two screens tall and its scene is sticky, so no GSAP pin is involved. Over the
 * first screen the photo card grows to fill the viewport; the next section has a negative top
 * margin and slides over the scene before the growth has finished, like a curtain.
 */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), SLIDE_MS);
    return () => window.clearInterval(id);
  }, []);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;
      const q = gsap.utils.selector(section);
      const card = q("[data-card]")[0];
      // Load and scroll animations never share an element: load moves the inner "-in" nodes,
      // scroll moves their wrappers. Sharing one made each tween record the other's mid-state, and
      // on a reload the title and button could be left at opacity 0.
      const chars = q("[data-char]");
      const charsIn = q("[data-char-in]");
      const fades = q("[data-fade]");
      const fadesIn = q("[data-fade-in]");
      const cardWidth = () => window.innerWidth * (window.matchMedia("(min-width: 48rem)").matches ? 0.36 : 0.84);
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // One sequence, one thing at a time: the title resolves letter by letter, the card opens
        // once the title has mostly landed (wiping up from its bottom edge), then the small UI
        // settles. The wipe is a polygon clip: a zero-area polygon draws nothing, where
        // inset(100%) could leave a one-pixel hairline.
        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .fromTo(charsIn, { yPercent: 40, opacity: 0, filter: "blur(20px)" }, { yPercent: 0, opacity: 1, filter: "blur(0px)", duration: 1.4, stagger: 0.05 }, 0.1)
          .set(card, { opacity: 1 }, 1.1)
          .fromTo(
            card,
            { clipPath: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)" },
            { clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)", duration: 1.4, ease: "power4.inOut" },
            1.1,
          )
          .from(q("[data-zoom-in]"), { scale: 1.35, duration: 2, ease: "expo.out" }, 1.1)
          .fromTo(fadesIn, { y: 12, opacity: 0, filter: "blur(8px)" }, { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.8, stagger: 0.1 }, 1.8);

        const lazy = { immediateRender: false };
        gsap
          .timeline({ scrollTrigger: { trigger: section, start: "top top", end: "+=100%", scrub: 1, invalidateOnRefresh: true } })
          .fromTo(card, { width: cardWidth, height: () => (cardWidth() * 2) / 3 }, { ...lazy, width: () => window.innerWidth, height: () => window.innerHeight, ease: "power2.inOut" }, 0)
          .fromTo(q("[data-zoom]"), { scale: 1.2 }, { ...lazy, scale: 1, ease: "power2.inOut" }, 0)
          .fromTo(chars, { yPercent: 0, opacity: 1, filter: "blur(0px)" }, { ...lazy, yPercent: -40, opacity: 0, filter: "blur(16px)", stagger: { each: 0.02, from: "center" }, duration: 0.5, ease: "power2.in" }, 0)
          .fromTo(fades, { autoAlpha: 1 }, { ...lazy, autoAlpha: 0, duration: 0.2 }, 0);
      });

      // The intro nodes start at opacity 0 in the markup so nothing flashes before hydration;
      // with reduced motion they are simply shown.
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set([...charsIn, ...fadesIn, card], { opacity: 1 });
      });

      return () => mm.revert();
    },
    { scope: sectionRef },
  );

  const current = SLIDES[slide];

  return (
    <section ref={sectionRef} aria-labelledby="hero-title" className="relative h-[200svh]">
      <div className="sticky top-0 h-svh overflow-hidden">
        <h1 id="hero-title" className="sr-only">
          Stories from Void
        </h1>
        <Word text="Stories" className="left-4 top-[14%] sm:left-8 md:left-12 md:top-[13%]" />
        <Word text="from Void" className="bottom-[16%] right-4 sm:right-8 md:bottom-[8%] md:right-12" />

        <div className="absolute inset-0 z-10 grid place-items-center">
          <div data-card className="relative opacity-0 aspect-[3/2] w-[84vw] overflow-hidden bg-surface-sunken md:w-[36vw]">
            <div data-zoom className="absolute inset-0 scale-[1.2]">
              <div data-zoom-in className="absolute inset-0">
              {SLIDES.map((m, i) => (
                <Image
                  key={m.slug}
                  src={m.image.src}
                  alt={i === slide ? m.image.alt : ""}
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  className={`object-cover transition-[opacity,scale] duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${i === slide ? "scale-100 opacity-100" : "scale-110 opacity-0"}`}
                />
              ))}
              </div>
            </div>
            <div data-fade className="absolute bottom-2 left-2">
              <p data-fade-in aria-live="polite" className="opacity-0 bg-black/60 px-2 py-1 text-data-sm text-white">
                {current.name} · {current.image.isArtwork ? "Artwork" : "Photo"}: NASA
              </p>
            </div>
          </div>
        </div>

        <div data-fade className="absolute inset-x-0 bottom-0 z-20">
          <div data-fade-in className="opacity-0 flex items-center justify-between px-4 pb-6 sm:px-8 md:px-12 md:pb-8">
          <PillLink href="#why" variant="solid" icon={<ArrowDownIcon width={16} height={16} />}>
              Start the story
            </PillLink>
          </div>
        </div>
      </div>
    </section>
  );
}
