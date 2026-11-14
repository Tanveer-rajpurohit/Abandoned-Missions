// One story page per machine. Every version of the page (collage, cards) reads this shape.
// Photos are NASA, public domain; `credit` is the NASA image ID.

export interface StoryImage {
  src: string;
  alt: string;
  credit: string;
}

export interface Beat {
  id: string;
  /** One or two words, for the timeline. */
  tick: string;
  title: string;
  when: string;
  /** The machine speaking, a few short sentences. */
  lines: string[];
  fact: { value: string; label: string };
  image: StoryImage;
}

export interface Story {
  /** Matches the mission's slug in missions.ts and the page URL. */
  slug: string;
  title: string;
  subtitle: string;
  /** Small line above the title: mission and year. */
  eyebrow: string;
  cover: StoryImage;
  beats: Beat[];
  /** The machine's last line, on the closing panel. */
  ending: string;
  sources: { label: string; href: string }[];
  /** Only stories that have a 3D scene built. */
  scene3d?: string;
}

const IMAGE_LIBRARY = { label: "NASA Image and Video Library", href: "https://images.nasa.gov" };

/** Every story credits the image library; `own` are the pages its facts come from. */
export const sources = (...own: Story["sources"]) => [...own, IMAGE_LIBRARY];

/** Shorthand for a beat whose photo lives in /images/stories/<slug>/<file>.jpg. */
export function beat(
  slug: string,
  file: string,
  credit: string,
  tick: string,
  title: string,
  when: string,
  lines: string[],
  fact: [value: string, label: string],
  alt: string,
): Beat {
  return { id: file, tick, title, when, lines, fact: { value: fact[0], label: fact[1] }, image: { src: `/images/stories/${slug}/${file}.jpg`, alt, credit } };
}
