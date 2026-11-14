import Link from "next/link";
import { SOURCES, VERSIONS } from "@/data/apollo11";

/** Temporary: lets the team flip between the versions of the story while we choose one. */
export function VersionSwitcher({ current }: { current: string }) {
  return (
    <nav aria-label="Story versions" className="fixed left-1/2 top-3 z-[100] flex max-w-[calc(100vw-1.5rem)] -translate-x-1/2 items-center overflow-x-auto [scrollbar-width:none] rounded-full bg-[#0d0d0c] p-1 text-[0.8125rem] text-white">
      {VERSIONS.map((version) => (
        <Link
          key={version.href}
          href={version.href}
          aria-current={version.href === current ? "page" : undefined}
          className="inline-flex min-h-9 shrink-0 items-center rounded-full px-3 transition-colors duration-150 hover:bg-white/15 aria-[current=page]:bg-white aria-[current=page]:text-[#0d0d0c]"
        >
          {version.label}
        </Link>
      ))}
    </nav>
  );
}

/** Where the facts and photos come from. Colours are inherited so it fits any theme. */
export function Sources({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <p className="text-eyebrow opacity-70">Sources</p>
      <ul className="mt-3 flex flex-col gap-2 text-[0.9375rem] leading-snug">
        {SOURCES.map((source) => (
          <li key={source.href}>
            <a href={source.href} target="_blank" rel="noreferrer" className="underline decoration-1 underline-offset-4 hover:decoration-2">
              {source.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
