import type { Story } from "@/data/stories";

/** Where the facts and photos come from. Colours are inherited so it fits any theme. */
export function Sources({ sources, className = "" }: { sources: Story["sources"]; className?: string }) {
  return (
    <div className={className}>
      <p className="text-eyebrow opacity-70">Sources</p>
      <ul className="mt-3 flex flex-col gap-2 text-[0.9375rem] leading-snug">
        {sources.map((source) => (
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
