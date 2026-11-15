import Link from "next/link";
import { ThemePicker } from "@/components/ThemeToggle";

const LINKS = [
  { href: "#why", label: "Why" },
  { href: "#stories", label: "Stories" },
];

/**
 * The header has no background of its own; its text is the same ink as the hero headline.
 */
export function SiteHeader() {
  return (
    <>
      <ThemePicker className="fixed bottom-4 right-4 z-50" />
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-4 pt-3 text-text sm:px-8 md:px-12 md:pt-5">
        <div className="flex items-center justify-between gap-4">
          <a href="#top" className="pointer-events-auto inline-flex min-h-11 items-center text-[1.0625rem] font-medium tracking-[-0.02em]">
            Stories from Void
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
            <Link
              href="/quiz"
              className="ml-1 inline-flex min-h-10 items-center rounded-full border-2 border-[var(--ink)] bg-[var(--pop-a)] px-4 text-[0.9375rem] font-semibold text-[var(--on-pop)] shadow-[3px_3px_0_var(--ink)] transition-[translate,box-shadow] duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_var(--ink)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              Take the quiz
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
}
