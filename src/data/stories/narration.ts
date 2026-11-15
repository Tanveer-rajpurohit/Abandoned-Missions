import type { Story } from "./types";

const MONTHS: Record<string, string> = { Jan: "January", Feb: "February", Mar: "March", Apr: "April", Jun: "June", Jul: "July", Aug: "August", Sep: "September", Sept: "September", Oct: "October", Nov: "November", Dec: "December" };

/** Short units and dates are written for the eye; a voice needs them spelled out. */
export function speakable(text: string): string {
  return text
    .replace(/\b(Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec)\b/g, (month) => MONTHS[month])
    .replace(/([\d,.]+)\+/g, "more than $1")
    .replace(/(\d)\s?km\b/g, "$1 kilometres")
    .replace(/(\d)\s?cm\b/g, "$1 centimetres")
    .replace(/(\d)\s?kg\b/g, "$1 kilograms")
    .replace(/(\d)\s?m\b/g, "$1 metres")
    .replace(/(\d)\s?h\b/g, "$1 hours")
    .replace(/(\d)\s?min\b/g, "$1 minutes")
    .replace(/(\d)\s?s\b/g, "$1 seconds");
}

/** What is read aloud for each card of a story, keyed by card id: the cover, then each beat. */
export const narrationFor = (story: Story): Record<string, string> => ({
  cover: speakable(`${story.title}. ${story.subtitle}.`),
  ...Object.fromEntries(story.beats.map((beat) => [beat.id, speakable([`${beat.title}.`, ...beat.lines, `${beat.fact.value} ${beat.fact.label}.`].join(" "))])),
});
