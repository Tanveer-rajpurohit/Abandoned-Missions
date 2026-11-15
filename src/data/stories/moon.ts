// The four Moon stories are the team's own writing (the Apollo 11, Apollo 12, Apollo 15 and
// Surveyor 3 docs), cut into one panel per chapter. Numbers, times and places follow NASA's records.
import { sources, type Beat, type Story, type StoryImage } from "./types";

const img = (dir: string, file: string, credit: string, alt: string): StoryImage => ({ src: `/images/stories/${dir}/${file}.jpg`, alt, credit });

function b(id: string, image: StoryImage, tick: string, title: string, when: string, lines: string[], fact: [value: string, label: string]): Beat {
  return { id, tick, title, when, lines, fact: { value: fact[0], label: fact[1] }, image };
}

const EAGLE = "apollo-11";

export const apollo11: Story = {
  slug: EAGLE,
  title: "Eagle",
  subtitle: "The half that stayed on the Moon",
  eyebrow: "Apollo 11 · 1969 · from NASA's records",
  cover: img(EAGLE, "earthrise", "AS11-44-6549", "Earth rising over the horizon of the Moon, seen from Apollo 11"),
  beats: [
    b(
      "look-up",
      img(EAGLE, "earthrise", "AS11-44-6549", "Earth rising over the horizon of the Moon, seen from Apollo 11"),
      "Look up",
      "What is it like up there?",
      "16 July 1969",
      [
        "Every person who has ever looked up at night has seen the Moon. For thousands of years, people stared at it and asked the same question: what is it like up there?",
        "On July 16, 1969, a giant Saturn 5 rocket lifted off from Cape Canaveral, carrying the machine that would help answer it. That machine had a name: Eagle.",
      ],
      ["1st", "crewed vehicle ever to land on the Moon"],
    ),
    b(
      "two-machines",
      img(EAGLE, "ascent-stage", "S69-32396", "The ascent stage of Apollo 11's lunar module hanging from a crane during assembly at Kennedy Space Center"),
      "Two in one",
      "Two machines in one",
      "Built for the Moon",
      [
        "Here is the first secret. Eagle was not one machine. It was two, stacked together like a sandwich: the descent stage on the bottom, the ascent stage on top.",
        "Together they had a mass of 15,103 kilograms, and about 70 percent of it was fuel. Imagine a backpack where most of what you carry is the thing you're going to burn.",
      ],
      ["15,103 kg", "total mass, about 70% of it fuel"],
    ),
    b(
      "legs",
      img(EAGLE, "ladder", "AS11-40-5868", "Buzz Aldrin climbing down the ladder of the lunar module onto the Moon"),
      "Legs",
      "Four legs and a hidden ladder",
      "The descent stage",
      [
        "The descent stage was a flat, eight-sided box, 4.2 meters across. Four legs held it 1.5 meters above the surface, 9.4 meters from one footpad to the opposite one.",
        "Why so wide? Think about how you stand when you want to stay balanced. One leg also had a small platform and a ladder: Eagle's front door to the Moon.",
      ],
      ["9.4 m", "from one footpad to the opposite one"],
    ),
    b(
      "muscles",
      { src: "/images/stories/apollo-11.jpg", alt: "The lunar module Eagle standing on the Moon, with Buzz Aldrin unloading experiments beside it", credit: "AS11-40-5927" },
      "Engines",
      "Muscles, brain and tiny pushers",
      "How Eagle flew",
      [
        "The descent engine could turn its power up or down, the way you press a bike pedal softly or with all your strength. At full power it pushed with about 45,000 newtons.",
        "Sixteen little 450-newton thrusters nudged Eagle to turn and tilt. Its brain was radar, gyroscopes, accelerometers and a guidance computer. You carry versions of all three in your phone.",
      ],
      ["45,000 N", "of thrust from the descent engine"],
    ),
    b(
      "landing",
      img(EAGLE, "site-today", "PIA12909", "The Apollo 11 landing site seen from lunar orbit, showing the descent stage and its shadow"),
      "Landing",
      "Seven hundred and fifty-six seconds",
      "20 July 1969 · 20:17:40 UTC",
      [
        "Eagle undocked from the command ship, where Michael Collins stayed in orbit. At 20:05 UTC the descent engine fired for 756.3 seconds, about twelve and a half minutes.",
        "Eagle touched down in the Sea of Tranquility. Neil Armstrong radioed home: \"Houston, Tranquility Base here. The Eagle has landed.\"",
      ],
      ["756.3 s", "the burn that carried Eagle down"],
    ),
    b(
      "cabin",
      img(EAGLE, "cabin", "AS11-36-5389", "Inside the Apollo 11 lunar module: control panels beside a triangular window"),
      "Cabin",
      "A cabin with no seats",
      "Inside Eagle",
      [
        "The crew compartment was just 6.65 cubic meters, a snug space for two astronauts and their controls. And here is a surprise: there were no seats.",
        "A system recycled oxygen, six silver-zinc batteries gave power, and an S-band antenna carried TV and voices to Earth.",
      ],
      ["6.65 m³", "of room for two astronauts"],
    ),
    b(
      "first-step",
      img(EAGLE, "bootprint", "AS11-40-5878", "A single bootprint pressed into the fine grey lunar soil"),
      "First step",
      "One small step",
      "21 July 1969 · 02:56:15 UTC",
      [
        "Armstrong stepped onto the Moon and said, \"That's one small step for man, one giant leap for mankind.\"",
        "Nineteen minutes later, Buzz Aldrin followed. He looked around and called the lunar surface \"Magnificent desolation.\"",
      ],
      ["19 min", "between the first step and the second"],
    ),
    b(
      "plaque",
      img(EAGLE, "plaque", "AS11-40-5899", "The plaque fixed to a leg of the Apollo 11 lunar module"),
      "Plaque",
      "We came in peace",
      "On the surface",
      [
        "They unveiled a plaque on a strut behind the ladder and read it aloud: \"Here men from the planet Earth first set foot on the Moon July 1969, A.D. We came in peace for all mankind.\"",
        "They put up a flag and spoke with President Nixon by radiotelephone.",
      ],
      ["1 plaque", "on the half of Eagle that stayed"],
    ),
    b(
      "work",
      img(EAGLE, "aldrin", "AS11-40-5903", "Buzz Aldrin standing on the Moon, with Neil Armstrong and the lunar module reflected in his visor"),
      "Moonwalk",
      "Then they got to work",
      "On the surface",
      [
        "They took photographs, collected rock and soil, and pushed two core tubes into the ground. They walked about 250 meters, never more than about 100 meters from Eagle.",
        "Aldrin climbed back in after 1 hour and 41 minutes. Armstrong followed about twelve minutes later.",
      ],
      ["21.55 kg", "of lunar rock and soil collected"],
    ),
    b(
      "easep",
      img(EAGLE, "easep", "AS11-40-5948", "Buzz Aldrin beside the seismometer experiment, with the lunar module behind him"),
      "Science",
      "The little science station",
      "21 July 1969 · 04:40 UTC",
      [
        "They set up EASEP, a 48-kilogram station with solar panels, a seismometer and a dust detector. Nearby sat a laser ranging retroreflector that needed no power at all.",
        "The Moon got 30 °C hotter than planned, and still EASEP worked normally. On August 27 it stopped accepting commands, and the experiment ended.",
      ],
      ["48 kg", "station, set up 17 m south of Eagle"],
    ),
    b(
      "liftoff",
      img(EAGLE, "ascent", "AS11-44-6642", "The top half of the lunar module flying above the Moon with Earth rising behind it"),
      "Liftoff",
      "Liftoff, and left behind",
      "21 July 1969 · 17:54:01 UTC",
      [
        "After 21 hours and 36 minutes on the Moon, the ascent stage lifted off, using the descent stage as its launch platform. It docked with Michael Collins at 21:34.",
        "Then the used-up ascent stage was let go into lunar orbit. Nobody knows for sure what happened next. It probably crashed into the Moon within one to four months.",
      ],
      ["21 h 36 min", "on the Moon"],
    ),
    b(
      "left-behind",
      img(EAGLE, "flag", "AS11-40-5874", "Buzz Aldrin standing beside the United States flag on the Moon"),
      "Today",
      "Still at Tranquility Base",
      "Today",
      [
        "But the descent stage did not go anywhere.",
        "It was left behind on the Moon, at Tranquility Base, along with a flag, a plaque, and a small science station.",
      ],
      ["0.674° N", "23.473° E, where the descent stage stands"],
    ),
  ],
  ending: "The descent stage did not go anywhere. It is still at Tranquility Base.",
  sources: sources(
    { label: "NASA Space Science Data Coordinated Archive: Apollo 11 Lunar Module / EASEP", href: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C" },
    { label: "NASA: Apollo 11 mission", href: "https://www.nasa.gov/mission/apollo-11/" },
    { label: "NASA Photojournal: Apollo 11 landing site from orbit (PIA12909)", href: "https://photojournal.jpl.nasa.gov/catalog/PIA12909" },
  ),
  scene3d: "/stories/apollo-11/3d",
};

const FALCON = "apollo-15-rover";

export const apollo15Rover: Story = {
  slug: FALCON,
  title: "Falcon",
  subtitle: "At the foot of the mountains",
  eyebrow: "Apollo 15 · 1971 · from NASA's records",
  cover: { src: "/images/stories/apollo-15-rover.jpg", alt: "Astronaut Jim Irwin working beside the lunar rover, with Mount Hadley behind", credit: "AS15-86-11603" },
  beats: [
    b(
      "look-up",
      img(FALCON, "mountain", "AS15-85-11437", "Astronaut Dave Scott studying a boulder on the slope of Hadley Delta"),
      "Look up",
      "At the foot of the mountains",
      "30 July 1971",
      [
        "Find the Moon and look for the dark, smooth patch near the top called Mare Imbrium. Along its edge, a range of mountains rises from the plain: the Apennines.",
        "On July 30, 1971, a spacecraft named Falcon came down right at the foot of those mountains.",
      ],
      ["4th", "crewed vehicle ever to land on the Moon"],
    ),
    b(
      "two-pieces",
      img(FALCON, "falcon", "AS15-86-11600", "The Apollo 15 lunar module Falcon on the Moon, with the rover beside it"),
      "Two in one",
      "A spaceship in two pieces",
      "Launched 26 July 1971",
      [
        "Falcon carried Commander David Scott and lunar module pilot James Irwin, the seventh and eighth people to walk on the Moon.",
        "It was two machines stacked together, a descent stage and an ascent stage: 16,430 kilograms in all, and more than two-thirds of that was fuel and oxidizer.",
      ],
      ["16,430 kg", "total mass, over two-thirds fuel"],
    ),
    b(
      "touchdown",
      img(FALCON, "hadley", "S71-44671", "The Hadley-Apennine landing area seen from lunar orbit by Apollo 15"),
      "Landing",
      "Touchdown at Hadley",
      "30 July 1971 · 22:16:29 UTC",
      [
        "Falcon touched down at 26.13239° north, 3.63330° east, a spot pinned down later by the Lunar Reconnaissance Orbiter.",
        "Two hours later, Scott stood at the upper hatch for 33 minutes, describing and photographing the view. Mountains ahead, a plain around, and nobody had ever stood there before.",
      ],
      ["33 min", "looking out from the top hatch"],
    ),
    b(
      "rover",
      img(FALCON, "rover-scott", "AS15-85-11471", "Astronaut Dave Scott seated in the Lunar Roving Vehicle during the first Apollo 15 moonwalk"),
      "Rover",
      "A car folded inside",
      "31 July 1971 · 13:13 UTC",
      [
        "Folded inside Falcon's descent stage was the Lunar Roving Vehicle. On the first moonwalk the astronauts unloaded it, deployed it and drove it.",
        "It was the first time a vehicle like it had ever been used, and NASA's record calls its performance very successful.",
      ],
      ["5 km", "the farthest the rover went from Falcon"],
    ),
    b(
      "drives",
      img(FALCON, "rille", "AS15-89-12100", "A telephoto view across Hadley Rille, a long winding valley on the Moon"),
      "Drives",
      "Three drives, three journeys",
      "31 July to 2 August 1971",
      [
        "First, 10.3 kilometers to the edge of Hadley Rille. Second, 12.5 kilometers along the foot of the Apennines. Third, 5.1 kilometers west to Scarp Crater and back.",
        "In 18 hours and 35 minutes outside, they collected 77.31 kilograms of rock and soil.",
      ],
      ["27.9 km", "driven in three moonwalks"],
    ),
    b(
      "generator",
      img("alsep", "fuel", "AS12-46-6790", "Alan Bean on Apollo 12 lifting the fuel element for a SNAP-27 generator, the same kind that powered Apollo 15's station"),
      "Power",
      "A generator with a secret",
      "Switched on 31 July 1971",
      [
        "The ALSEP science station got its power from a SNAP-27 generator. Inside sat a 4-kilogram rod of plutonium-238, which gives off heat as it slowly breaks down.",
        "442 thermoelectric couples turned that heat into about 70 watts, roughly one light bulb. The station listened to the Moon until September 30, 1977.",
      ],
      ["6+ years", "of listening to the Moon"],
    ),
    b(
      "hammer-feather",
      img(FALCON, "hammer-feather", "S71-43788", "Television picture of Dave Scott on the Moon during the hammer and feather drop"),
      "Hammer",
      "A hammer and a feather",
      "After the last moonwalk",
      [
        "Commander Scott held up a hammer and a feather for the TV camera and let both fall at once. They hit the ground together.",
        "On Earth, air slows a feather but hardly slows a hammer. On the Moon there is no air, so a hammer and a feather fall at the same rate.",
      ],
      ["0", "air to slow the feather down"],
    ),
    b(
      "plaque",
      img(FALCON, "plaque", "AS15-88-11894", "The memorial plaque left on the Moon at the Hadley-Apennine landing site"),
      "Plaque",
      "Fourteen names",
      "Hadley-Apennine",
      [
        "The astronauts left a plaque and a small figure on the surface.",
        "They were left in memory of all fourteen American and Soviet space explorers who had died during the two nations' space programs.",
      ],
      ["14", "explorers remembered on the plaque"],
    ),
    b(
      "liftoff",
      img(FALCON, "liftoff", "S71-41511", "Television picture of Falcon on the Moon seconds before its ascent stage lifted off"),
      "Liftoff",
      "Going home, staying behind",
      "2 August 1971 · 17:11:22 UTC",
      [
        "Falcon lifted off after 66 hours and 55 minutes on the Moon and docked with Alfred Worden in the command ship.",
        "The descent stage had been the landing platform, then the launch platform. Then it stayed. The ascent stage was let go and came down on the Moon at 26.36° north, 0.25° east.",
      ],
      ["66 h 55 min", "on the Moon"],
    ),
  ],
  ending: "It was the landing platform, then the launch platform. Then it stayed.",
  sources: sources({ label: "NASA Space Science Data Coordinated Archive: Apollo 15 Lunar Module / ALSEP", href: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1971-063C" }),
};

const INTREPID = "alsep";

export const alsep: Story = {
  slug: INTREPID,
  title: "Intrepid",
  subtitle: "Neighbours on the Ocean of Storms",
  eyebrow: "Apollo 12 · 1969 · from NASA's records",
  cover: img(INTREPID, "surveyor", "AS12-48-7136", "Pete Conrad beside Surveyor 3, with the lunar module Intrepid in the distance"),
  beats: [
    b(
      "neighbours",
      { src: "/images/stories/surveyor-3.jpg", alt: "Surveyor 3 in the foreground and the Apollo 12 lunar module Intrepid in the distance", credit: "AS12-48-7133" },
      "Look up",
      "Two neighbours",
      "Oceanus Procellarum",
      [
        "Look toward the western side of the Moon, at a huge dark plain called Oceanus Procellarum, the Ocean of Storms. There is no water in it, and no storms.",
        "On that plain, two spacecraft once sat just 180 meters apart. A robot called Surveyor 3 had been there since April 1967. A lunar module named Intrepid arrived in November 1969.",
      ],
      ["180 m", "between Intrepid and Surveyor 3"],
    ),
    b(
      "launch",
      img(INTREPID, "launch", "6903391", "The Saturn 5 rocket carrying Apollo 12 lifting off from Kennedy Space Center"),
      "Launch",
      "The second crew to land",
      "14 November 1969",
      [
        "Intrepid was the second crewed vehicle to land on the Moon. It left Cape Canaveral on a Saturn 5 rocket.",
        "It carried Commander Charles \"Pete\" Conrad and lunar module pilot Alan Bean, the third and fourth people to walk on the Moon.",
      ],
      ["3rd & 4th", "people to walk on the Moon"],
    ),
    b(
      "two-pieces",
      img(INTREPID, "intrepid", "AS12-51-7507", "The Apollo 12 lunar module Intrepid flying above the Moon in landing configuration"),
      "Two in one",
      "A spaceship in two pieces",
      "Before landing",
      [
        "Intrepid was two machines stacked together, 15,235 kilograms in all, and about 70 percent of that was fuel and oxidizer.",
        "Four legs held the descent stage 1.5 meters above the ground. The ascent stage was the astronauts' home: 6.65 cubic meters, two triangular windows, and no seats.",
      ],
      ["15,235 kg", "total mass, about 70% of it fuel"],
    ),
    b(
      "touchdown",
      img("surveyor-3", "two-spacecraft", "AS12-48-7099", "Surveyor 3 in the foreground with the Apollo 12 lunar module Intrepid behind it"),
      "Landing",
      "Touchdown, next to a robot",
      "19 November 1969 · 06:54:35 UTC",
      [
        "Intrepid landed in the Ocean of Storms at 3.0128° south, 23.4219° west. We know the spot so precisely from images taken years later by the Lunar Reconnaissance Orbiter.",
        "And Surveyor 3 was right there, within about 180 meters.",
      ],
      ["3.0128° S", "23.4219° W, where Intrepid landed"],
    ),
    b(
      "camera",
      img(INTREPID, "tv-camera", "AS12-46-6780", "Alan Bean on the Moon with the TV camera, far from the lunar module"),
      "Moonwalk",
      "A camera pointed at the Sun",
      "First moonwalk · 11:32 UTC",
      [
        "On the first moonwalk the astronauts collected samples and set up the ALSEP science station and a solar wind foil collector.",
        "But the TV camera was pointed toward the Sun by accident. Its vidicon tube was damaged and it stopped working. Even the best-planned missions meet surprises.",
      ],
      ["3 h 56 min", "the first moonwalk"],
    ),
    b(
      "station",
      img(INTREPID, "station", "AS12-47-6918", "Three parts of the ALSEP science station standing on the lunar surface"),
      "Station",
      "The station that listened",
      "Switched on 19 November 1969 · 14:21 UTC",
      [
        "ALSEP was meant to stay. Its central station was a 25-kilogram box with a 58-centimeter antenna, aimed at Earth by the astronauts.",
        "Cables linked it to six instruments: a seismometer, an ion detector, an ion gauge, a dust detector, a magnetometer and a solar wind spectrometer.",
      ],
      ["6", "instruments wired to one station"],
    ),
    b(
      "power",
      img(INTREPID, "fuel", "AS12-46-6790", "Alan Bean unloading the fuel element for the ALSEP power unit from the lunar module"),
      "Power",
      "Power from plutonium",
      "Until 30 September 1977",
      [
        "The astronauts placed a 4-kilogram rod of plutonium-238 into a SNAP-27 generator. Plutonium-238 gives off heat as it slowly breaks down.",
        "442 thermoelectric couples turned that heat into about 70 watts, roughly the power of one light bulb.",
      ],
      ["70 W", "about one ordinary light bulb"],
    ),
    b(
      "visit",
      img(INTREPID, "surveyor", "AS12-48-7136", "Pete Conrad examining Surveyor 3, with Intrepid in the distance"),
      "Visit",
      "A visit to a robot",
      "20 November 1969 · second moonwalk",
      [
        "After a 1.3-kilometer geology walk, the astronauts walked over to Surveyor 3. It had been waiting in the same spot for more than two and a half years.",
        "They brought back about 10 kilograms of its parts, including the soil scoop and camera, to show what time on the Moon does to a machine.",
      ],
      ["34.35 kg", "of rock and soil from both moonwalks"],
    ),
    b(
      "moonquake",
      img(INTREPID, "moonquake", "S69-59547", "A seismometer reading of the moonquake made when Apollo 12's ascent stage hit the Moon"),
      "Moonquake",
      "One last job",
      "20 November 1969 · 20:21:30 UTC",
      [
        "Intrepid lifted off after 31 hours and 31 minutes on the Moon. The descent stage stayed behind as the launch platform it had always been meant to be.",
        "Then the empty ascent stage was crashed into the Moon on purpose, about 60 kilometers from the seismometer. It made the first recorded artificial moonquake.",
      ],
      ["1st", "artificial moonquake ever recorded"],
    ),
  ],
  ending: "Intrepid's descent stage is still on the Ocean of Storms, 180 meters from Surveyor 3.",
  sources: sources({ label: "NASA Space Science Data Coordinated Archive: Apollo 12 Lunar Module / ALSEP", href: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-099C" }),
};

const SURVEYOR = "surveyor-3";

export const surveyor3: Story = {
  slug: SURVEYOR,
  title: "Surveyor 3",
  subtitle: "Bounced twice, then got to work",
  eyebrow: "Surveyor programme · 1967 · from NASA's records",
  cover: { src: "/images/stories/surveyor-3.jpg", alt: "An Apollo 12 astronaut beside Surveyor 3, with the lunar module in the distance", credit: "AS12-48-7133" },
  beats: [
    b(
      "question",
      img(SURVEYOR, "painting", "S69-55553", "Painting of the Surveyor 3 lander standing inside a crater on the Moon"),
      "Question",
      "What is the Moon made of?",
      "Before Apollo",
      [
        "Picture a machine about as heavy as a small car that has to land on the Moon. No pilot, no windshield, nobody to call if it gets a little lost.",
        "It carries a question: is the Moon's ground hard like a sidewalk, or soft like fresh snow? Before anyone could send astronauts, someone had to go and find out.",
      ],
      ["997.9 kg", "the spacecraft, about a small car"],
    ),
    b(
      "eyes-hand",
      img(SURVEYOR, "close", "AS12-48-7110", "Close view of a Surveyor 3 footpad and its surface sampler scoop"),
      "Hand",
      "Eyes and a hand",
      "Designed at JPL",
      [
        "NASA and the Jet Propulsion Laboratory gave Surveyor 3 two instruments: a TV camera for eyes and a surface sampler for a hand.",
        "The hand could reach about 1.5 meters out and dig about 18 centimeters down. No Surveyor before it had carried a tool for digging.",
      ],
      ["18 cm", "the deepest the hand could dig"],
    ),
    b(
      "ignition",
      img(SURVEYOR, "shroud", "GRC-1964-C-71093", "Engineers testing the Centaur nose cone that protected Surveyor spacecraft during launch"),
      "Launch",
      "Ignition",
      "17 April 1967 · 07:05:01 UTC",
      [
        "An Atlas Centaur rocket climbed into the sky from Cape Canaveral. Surveyor 3 waited first in a parking orbit around Earth, then the Centaur fired again to send it to the Moon.",
        "For three days it coasted through the dark. Back on Earth, the people who built it did the hardest thing in engineering. They waited.",
      ],
      ["3 days", "coasting to the Moon"],
    ),
    b(
      "bounces",
      img(SURVEYOR, "crater", "AS12-48-7121", "Surveyor 3 sitting on the inside slope of its crater"),
      "Landing",
      "Three touches",
      "20 April 1967 · 00:04:17 UTC",
      [
        "Shiny rocks confused the radar, and the engine kept firing too long. Surveyor 3 touched the Moon and bounced 10 meters high, then bounced again, 3 meters.",
        "On the third touch it settled in the Ocean of Storms. That is grit: being knocked around and still doing your job.",
      ],
      ["2", "bounces before it settled"],
    ),
    b(
      "first-picture",
      img("alsep", "surveyor", "AS12-48-7136", "Pete Conrad examining Surveyor 3 and its TV camera on the Moon"),
      "Pictures",
      "The first picture",
      "Less than an hour later",
      [
        "The camera had a wide lens and a zoom, under a mirror that could swing and tilt, so it could look around without the lander moving.",
        "Each picture took about twenty seconds to send. Patience paid off: Surveyor 3 sent back 6,326 of them.",
      ],
      ["6,326", "TV pictures sent home"],
    ),
    b(
      "digging",
      img(SURVEYOR, "footpad", "PIA02978", "A Surveyor footpad resting in lunar soil next to a small trench (Surveyor 5)"),
      "Digging",
      "Like wet sand",
      "April 1967",
      [
        "Engineers sent commands and the arm dug, trench by trench, while the camera watched. The soil was a lot like damp sand on a beach.",
        "It could bear about 0.7 kilograms per square centimeter: solid enough to support an Apollo lunar module.",
      ],
      ["4", "trenches, 4 bearing tests and 13 impact tests"],
    ),
    b(
      "night",
      { src: "/images/stories/surveyor-3.jpg", alt: "Surveyor 3 on the Ocean of Storms, with the Apollo 12 lunar module far behind", credit: "AS12-48-7133" },
      "Silence",
      "The long night",
      "4 May 1967",
      [
        "A night on the Moon lasts about two weeks. When it began, Surveyor 3 was alone in the dark on the Ocean of Storms.",
        "Two days later, people on Earth made contact with it for the last time. Then there was only silence.",
      ],
      ["2 weeks", "one night on the Moon"],
    ),
    b(
      "visitors",
      img(SURVEYOR, "visit", "AS12-48-7134", "Astronaut Alan Bean beside Surveyor 3, with the Apollo 12 lunar module on the crater rim behind"),
      "Visitors",
      "Somebody came",
      "November 1969",
      [
        "Then the Apollo 12 lunar module Intrepid landed about 180 meters away, carrying Charles Conrad Jr. and Alan L. Bean.",
        "On their second moonwalk, they walked over to the quiet, inactive lander.",
      ],
      ["180 m", "from Intrepid's landing spot"],
    ),
    b(
      "finished",
      img(SURVEYOR, "two-spacecraft", "AS12-48-7099", "Surveyor 3 in the foreground with the Apollo 12 lunar module behind it"),
      "Today",
      "Not abandoned. Finished.",
      "Today",
      [
        "Surveyor 3 left proof that the Moon's ground can hold us, thousands of pictures, and a lesson: grit, imagination, logic and will.",
        "It was not abandoned. It was finished. It did its job, and it handed the future to the people who came after.",
      ],
      ["3° S", "23.41° W, still in the Ocean of Storms"],
    ),
  ],
  ending: "What is your question about the world? And are you willing to bounce twice to find the answer?",
  sources: sources({ label: "NASA Science: Surveyor 3", href: "https://science.nasa.gov/mission/surveyor-3/" }),
};
