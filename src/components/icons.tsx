import type { SVGProps } from "react";
import type { Platform } from "@/data/missions";

// One drawing grid for every icon: 24 × 24, 1.5 stroke, round joins.
type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={24}
      height={24}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

/** A lunar module seen from the front: cabin, descent stage, two legs and pads. */
export function LogoMark(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 4.5h6l1.5 3.5h-9z" />
      <path d="M6.5 8h11v4.5h-11z" />
      <path d="M8 12.5 4.5 18M16 12.5l3.5 5.5M12 12.5v3" />
      <path d="M3 18.5h3M18 18.5h3" />
    </Icon>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="9.5" cy="9.5" r="1.75" />
      <circle cx="14.5" cy="14" r="2.5" />
      <circle cx="8.5" cy="15" r="0.75" />
    </Icon>
  );
}

/** Mars: a disc with its north polar cap and a dust band. */
export function MarsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M8.5 5.2c1.1.7 5.9.7 7 0" />
      <path d="M4.3 13.5c2.6-1.4 5.4 1.2 8 0s4.7-.9 7.4.3" />
    </Icon>
  );
}

/** A probe on an escape path, leaving its star behind. */
export function DeepSpaceIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="6.5" cy="17.5" r="2" />
      <path d="M8.5 15.5c3-3.5 6.5-7 11-10" strokeDasharray="1.5 2.5" />
      <path d="m17 4.5 3 1-1 3" />
    </Icon>
  );
}

export function PlatformIcon({ platform, ...props }: IconProps & { platform: Platform }) {
  if (platform === "moon") return <MoonIcon {...props} />;
  if (platform === "mars") return <MarsIcon {...props} />;
  return <DeepSpaceIcon {...props} />;
}

export function ArrowDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v14M6 13l6 6 6-6" />
    </Icon>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Icon>
  );
}
