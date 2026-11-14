// The Apollo 11 story as a list of beats, shared by every version of the story page.
// Facts: NSSDCA catalogue entry 1969-059C and NASA's Apollo 11 mission pages.
// Photos: NASA, public domain; `credit` is the NASA image ID.

export interface Beat {
  id: string;
  title: string;
  when: string;
  /** Eagle speaking, a few short sentences. */
  lines: string[];
  fact: { value: string; label: string };
  image: { src: string; alt: string; credit: string };
  /** One strong colour for versions that theme each beat. */
  accent: string;
}

const DIR = "/images/stories/apollo-11";

export const BEATS: Beat[] = [
  {
    id: "touchdown",
    title: "Touchdown",
    when: "20 July 1969 · 20:17 UTC",
    lines: ["I am Eagle. I carried two astronauts down to the Moon.", "The ground was full of boulders, so Neil Armstrong steered me by hand until he found a flat spot."],
    fact: { value: "under 30 s", label: "of landing fuel left when my feet touched" },
    image: { src: "/images/stories/apollo-11.jpg", alt: "The lunar module Eagle standing on the Moon, with Buzz Aldrin unloading experiments beside it", credit: "AS11-40-5927" },
    accent: "#ffd23f",
  },
  {
    id: "ladder",
    title: "Down the ladder",
    when: "21 July 1969 · 02:56 UTC",
    lines: ["Six and a half hours later, Neil climbed down my ladder and stepped onto the Moon.", "Buzz Aldrin followed him. This is Buzz on my ladder, photographed by Neil."],
    fact: { value: "19 min", label: "between the first person and the second" },
    image: { src: `${DIR}/ladder.jpg`, alt: "Buzz Aldrin climbing down the ladder of the lunar module onto the Moon", credit: "AS11-40-5868" },
    accent: "#ff5d5d",
  },
  {
    id: "bootprint",
    title: "A print that stays",
    when: "On the surface",
    lines: ["Their boots pressed into dust that had not moved for billions of years.", "There is no wind here and no rain. Nothing will ever smooth these prints away."],
    fact: { value: "0", label: "wind, rain or weather to wear a bootprint down" },
    image: { src: `${DIR}/bootprint.jpg`, alt: "A single bootprint pressed into the fine grey lunar soil", credit: "AS11-40-5878" },
    accent: "#8ecae6",
  },
  {
    id: "visitors",
    title: "Two visitors",
    when: "2 hours 31 minutes outside",
    lines: ["They did not have long. Every minute outside was planned before they left Earth.", "Look closely at Buzz's visor. You can see Neil, and you can see me."],
    fact: { value: "2 h 31 min", label: "is all the time they spent walking outside" },
    image: { src: `${DIR}/aldrin.jpg`, alt: "Buzz Aldrin standing on the Moon, with Neil Armstrong and the lunar module reflected in his visor", credit: "AS11-40-5903" },
    accent: "#ffd23f",
  },
  {
    id: "flag",
    title: "A flag with a rod in it",
    when: "On the surface",
    lines: ["They planted a flag beside me.", "With no air, a flag cannot wave. A metal rod along the top holds it out so it looks like it is flying."],
    fact: { value: "1 rod", label: "sewn into the top edge keeps the flag spread" },
    image: { src: `${DIR}/flag.jpg`, alt: "Buzz Aldrin standing beside the United States flag on the Moon", credit: "AS11-40-5874" },
    accent: "#ff5d5d",
  },
  {
    id: "experiments",
    title: "What they left running",
    when: "On the surface",
    lines: ["They set up a seismometer to listen for moonquakes, and a mirror that bounces laser light back to Earth.", "Then they packed Moon rock and soil to take home."],
    fact: { value: "21.5 kg", label: "of Moon rock and soil carried back to Earth" },
    image: { src: `${DIR}/easep.jpg`, alt: "Buzz Aldrin beside the seismometer experiment, with the lunar module behind him", credit: "AS11-40-5948" },
    accent: "#8ecae6",
  },
  {
    id: "liftoff",
    title: "Only half of me goes home",
    when: "21 July 1969 · 17:54 UTC",
    lines: ["After 21 hours and 36 minutes it was time to leave. But only my top half could fly.", "It fired its engine and used me, the bottom half, as its launch pad. This is it on the way up, with Earth behind."],
    fact: { value: "21 h 36 min", label: "on the Moon with a crew on board" },
    image: { src: `${DIR}/ascent.jpg`, alt: "The top half of the lunar module flying above the Moon with Earth rising behind it", credit: "AS11-44-6642" },
    accent: "#ffd23f",
  },
  {
    id: "today",
    title: "Still here",
    when: "Today",
    lines: ["This is me, photographed from orbit forty years later. I am the bright dot with a long shadow.", "The mirror needs no power, so it never stopped working. Scientists still fire lasers at it."],
    fact: { value: "3.8 cm", label: "the Moon drifts away each year, measured with my mirror" },
    image: { src: `${DIR}/site-today.jpg`, alt: "The Apollo 11 landing site seen from lunar orbit, showing the descent stage and its shadow", credit: "PIA12909" },
    accent: "#ff5d5d",
  },
];

export const COVER = {
  title: "Eagle",
  subtitle: "The half that stayed on the Moon",
  image: { src: `${DIR}/earthrise.jpg`, alt: "Earth rising over the horizon of the Moon, seen from Apollo 11", credit: "AS11-44-6549" },
};

export const SOURCES = [
  { label: "NASA Space Science Data Coordinated Archive: Apollo 11 Lunar Module / EASEP", href: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C" },
  { label: "NASA: Apollo 11 mission", href: "https://www.nasa.gov/mission/apollo-11/" },
  { label: "NASA Image and Video Library", href: "https://images.nasa.gov" },
  { label: "NASA Photojournal: Apollo 11 landing site from orbit (PIA12909)", href: "https://photojournal.jpl.nasa.gov/catalog/PIA12909" },
];

/** One or two words per beat, for timelines and small labels. Same order as BEATS. */
export const TICKS = ["Landing", "First steps", "Bootprint", "Moonwalk", "Flag", "Science", "Liftoff", "Today"];

export const VERSIONS = [
  { href: "/stories/apollo-11", label: "3D" },
  { href: "/stories/apollo-11/version1", label: "Collage" },
  { href: "/stories/apollo-11/version2", label: "Cards" },
];
