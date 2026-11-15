// The quiz. Every answer and explanation comes from the story pages in ./stories (mostly the
// team's checked Moon and Pioneer 10 writing), so the numbers here match what the stories say.
import type { Platform } from "./missions";
import { getStory, type StoryImage } from "./stories";

export type QuizKind = "choice" | "riddle";

export interface QuizQuestion {
  id: string;
  /** "choice" asks about a fact; "riddle" is a machine describing itself, "Who am I?". */
  kind: QuizKind;
  place: Platform;
  prompt: string;
  /** Always four, so the number keys 1 to 4 can answer. */
  options: [string, string, string, string];
  /** Index into `options`. */
  answer: number;
  /** Shown after answering. */
  explain: string;
  /** The story the question comes from: its slug, title and the photo revealed after answering. */
  story: { slug: string; title: string };
  image: StoryImage;
}

/** The story a question comes from, and the photo of one of its panels (or its cover). */
function from(slug: string, beatId?: string) {
  const story = getStory(slug);
  if (!story) throw new Error(`Quiz: no story "${slug}"`);
  const image = beatId ? story.beats.find((beat) => beat.id === beatId)?.image : story.cover;
  if (!image) throw new Error(`Quiz: no panel "${beatId}" in "${slug}"`);
  return { story: { slug, title: story.title }, image };
}

export const QUIZ: QuizQuestion[] = [
  {
    id: "surveyor-pictures",
    kind: "choice",
    place: "moon",
    prompt: "Surveyor 3 sent home thousands of TV pictures from the Moon. How long did each one take to send?",
    options: ["About two seconds", "About twenty seconds", "About twenty minutes", "About two hours"],
    answer: 1,
    explain: "Each picture took about twenty seconds to send. Patience paid off: Surveyor 3 sent back 6,326 of them.",
    ...from("surveyor-3", "first-picture"),
  },
  {
    id: "who-intrepid",
    kind: "riddle",
    place: "moon",
    prompt: "I landed on 19 November 1969, just 180 m from a robot that had been waiting more than two and a half years. Later my empty top half was crashed into the Moon on purpose. Who am I?",
    options: ["Eagle", "Surveyor 3", "Intrepid", "Falcon"],
    answer: 2,
    explain: "Intrepid, the Apollo 12 lunar module, landed on the Ocean of Storms beside Surveyor 3. Its empty ascent stage made the first recorded artificial moonquake.",
    ...from("intrepid", "two-pieces"),
  },
  {
    id: "pioneer-lifetime",
    kind: "choice",
    place: "deep-space",
    prompt: "Pioneer 10 was designed to last 21 months. How long did it actually keep going?",
    options: ["More than 30 years", "21 months, as planned", "About 5 years", "About 90 days"],
    answer: 0,
    explain: "The job was done, but the spacecraft still worked, so it kept travelling, past Saturn's orbit and then Neptune's. Planned for 21 months, it lasted more than 30 years.",
    ...from("pioneer-10", "jupiter"),
  },
  {
    id: "eagle-cabin",
    kind: "choice",
    place: "moon",
    prompt: "Eagle's cabin was just 6.65 cubic meters, a snug space for two astronauts. Which of these did it NOT have?",
    options: ["Batteries", "An oxygen system", "An antenna", "Seats"],
    answer: 3,
    explain: "There were no seats. A system recycled oxygen, six silver-zinc batteries gave power, and an S-band antenna carried TV and voices to Earth.",
    ...from("apollo-11", "cabin"),
  },
  {
    id: "who-opportunity",
    kind: "riddle",
    place: "mars",
    prompt: "I bounced 26 times before I rolled to a stop on Mars. I was meant to drive about 1,000 meters, but I drove just over 45 kilometers, and I was the first machine to finish a marathon on another world. Who am I?",
    options: ["Sojourner", "Opportunity", "Viking 1", "InSight"],
    answer: 1,
    explain: "Opportunity landed on 25 January 2004 (UTC). Built for 90 days, it worked for more than 14 years, and on 24 March 2015 its total distance passed 42.195 kilometers.",
    ...from("opportunity", "geologist"),
  },
  {
    id: "who-falcon",
    kind: "riddle",
    place: "moon",
    prompt: "I came down at the foot of the Apennine mountains with a car folded inside me. Beside me, my commander dropped a hammer and a feather, and they hit the ground together. Who am I?",
    options: ["Falcon", "Eagle", "Intrepid", "Surveyor 3"],
    answer: 0,
    explain: "Falcon, the Apollo 15 lunar module, carried the Lunar Roving Vehicle folded inside. On the Moon there is no air, so a hammer and a feather fall at the same rate.",
    ...from("falcon", "two-pieces"),
  },
  {
    id: "pioneer-last-signal",
    kind: "choice",
    place: "deep-space",
    prompt: "Pioneer 10's last signal came from 12.23 billion kilometers away. How long did it take to reach Earth?",
    options: ["8 minutes", "92 minutes", "11 hours 20 minutes", "3 days"],
    answer: 2,
    explain: "The last signal, on 23 January 2003, took 11 hours and 20 minutes to reach Earth. Its power had faded. Nothing broke. It had given everything it had.",
    ...from("pioneer-10", "letting-go"),
  },
  {
    id: "sojourner-days",
    kind: "choice",
    place: "mars",
    prompt: "Sojourner, the first rover on Mars, was planned to work for one week. How long did it keep going?",
    options: ["7 days", "14 years", "6 years", "83 days"],
    answer: 3,
    explain: "83 days on a 7-day plan, almost three months. Sojourner never broke: the lander that passed its radio messages to Earth went silent.",
    ...from("sojourner"),
  },
  {
    id: "who-surveyor",
    kind: "riddle",
    place: "moon",
    prompt: "I bounced 10 meters high, then 3 meters, before I settled in the Ocean of Storms. Then I dug trenches with my hand and sent home 6,326 pictures. Who am I?",
    options: ["Viking 1", "Surveyor 3", "Sojourner", "InSight"],
    answer: 1,
    explain: "Surveyor 3 landed in April 1967. Its digging showed the soil could bear about 0.7 kilograms per square centimeter: solid enough to support an Apollo lunar module.",
    ...from("surveyor-3", "bounces"),
  },
  {
    id: "who-pioneer",
    kind: "riddle",
    place: "deep-space",
    prompt: "I was the first spacecraft through the asteroid belt and the first to fly past Jupiter. I carry a plaque with a map of 14 pulsars, and I'm heading for Aldebaran. Who am I?",
    options: ["Voyager 1", "Kepler", "Opportunity", "Pioneer 10"],
    answer: 3,
    explain: "Pioneer 10 left Earth in 1972. It should pass Aldebaran, the red eye of Taurus, in about two million years.",
    ...from("pioneer-10", "plan"),
  },
];

