import type { Metadata } from "next";
import Link from "next/link";
import { EagleStory } from "@/components/story/EagleStory";

export const metadata: Metadata = {
  title: "Eagle in 3D, the half that stayed on the Moon",
  description:
    "The Apollo 11 lunar module tells its own story: the landing, the first steps, the experiments, and the 21 hours before its top half flew home and left it behind.",
};

export default function EagleStoryPage() {
  return (
    <div data-world="moon" className="min-h-full bg-surface text-text">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-caption focus:text-on-accent"
      >
        Skip to content
      </a>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-4 pt-3 text-white mix-blend-difference sm:px-8 md:px-12 md:pt-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="pointer-events-auto inline-flex min-h-11 items-center text-[1.0625rem] font-medium tracking-[-0.02em]">
              Stories from Void
            </Link>
          </div>
          <nav aria-label="Main" className="pointer-events-auto flex items-center gap-1 sm:gap-3">
            <Link href="/#stories" className="hidden min-h-11 items-center px-2 text-[0.9375rem] underline-offset-4 hover:underline sm:inline-flex">
              All machines
            </Link>
          </nav>
        </div>
      </header>
      <main id="main">
        <EagleStory />
      </main>
    </div>
  );
}
