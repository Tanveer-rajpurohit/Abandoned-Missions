import { SiteHeader } from "@/components/home/SiteHeader";
import { Hero } from "@/components/home/Hero";
import { Intro } from "@/components/home/Intro";
import { Stories } from "@/components/home/Stories";
import { SiteFooter } from "@/components/home/SiteFooter";

export default function Home() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-caption focus:text-on-accent"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main">
        <div id="top">
          <Hero />
        </div>
        <Intro />
        <Stories />
      </main>
      <SiteFooter />
    </>
  );
}
