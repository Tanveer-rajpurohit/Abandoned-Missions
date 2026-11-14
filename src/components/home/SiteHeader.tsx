import { ThemeToggle } from "@/components/ThemeToggle";

const LINKS = [
  { href: "#why", label: "Why" },
  { href: "#stories", label: "Stories" },
];

/**
 * White text with mix-blend-mode: difference reads as black on the off-white page and as
 * white over the photos, so the header never needs its own background.
 */
export function SiteHeader() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-4 pt-3 text-white mix-blend-difference sm:px-8 md:px-12 md:pt-5">
      <div className="flex items-center justify-between gap-4">
        <a href="#top" className="pointer-events-auto inline-flex min-h-11 items-center text-[1.0625rem] font-medium tracking-[-0.02em]">
          Abandoned Missions
        </a>
        <nav aria-label="Main" className="pointer-events-auto flex items-center gap-1 sm:gap-3">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="hidden min-h-11 items-center px-2 text-[0.9375rem] underline-offset-4 hover:underline sm:inline-flex"
            >
              {l.label}
            </a>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
