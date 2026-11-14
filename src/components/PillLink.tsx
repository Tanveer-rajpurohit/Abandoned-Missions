import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "solid" | "outline";

const VARIANT: Record<Variant, { root: string; fill: string; label: string; chip: string }> = {
  solid: {
    root: "border-accent bg-accent text-on-accent",
    fill: "bg-on-accent",
    label: "group-hover:text-accent",
    chip: "bg-on-accent text-accent group-hover:bg-accent group-hover:text-on-accent",
  },
  outline: {
    root: "border-text text-text",
    fill: "bg-text",
    label: "group-hover:text-surface",
    chip: "bg-text text-surface group-hover:bg-surface group-hover:text-text",
  },
};

// Tailwind v4 writes scale as its own CSS property, so transitions name it; "transform" alone
// would leave it snapping.
const EASE = "duration-500 ease-[cubic-bezier(0.65,0,0.35,1)]";

/**
 * Pill link with an arrow chip. On hover a disc grows out of the chip until it fills the pill,
 * and the colours invert.
 */
export function PillLink({
  href,
  children,
  icon,
  variant = "outline",
  className = "",
}: {
  href: string;
  children: ReactNode;
  icon: ReactNode;
  variant?: Variant;
  className?: string;
}) {
  const v = VARIANT[variant];
  return (
    <Link
      href={href}
      className={`group relative isolate inline-flex h-12 items-center gap-3 overflow-hidden rounded-full border pl-6 pr-2 text-caption transition-[scale] duration-150 active:scale-[0.97] ${v.root} ${className}`}
    >
      <span aria-hidden="true" className={`absolute right-2 top-1/2 -z-10 size-8 -translate-y-1/2 rounded-full transition-[scale] group-hover:scale-[16] ${EASE} ${v.fill}`} />
      <span className={`transition-colors ${EASE} ${v.label}`}>{children}</span>
      <span className={`grid size-8 place-items-center rounded-full transition-colors ${EASE} ${v.chip}`}>
        {icon}
      </span>
    </Link>
  );
}
