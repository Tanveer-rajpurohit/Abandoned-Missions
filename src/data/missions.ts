// Facts are taken from the NSSDCA catalogue (nssdc.gsfc.nasa.gov) and NASA mission pages.
// Photos are NASA, public domain; `credit` is the NASA image ID.

export type Platform = "moon" | "mars" | "deep-space";

export interface Mission {
  slug: string;
  name: string;
  craft: string;
  platform: Platform;
  place: string;
  coords?: string;
  arrived: { label: string; date: string };
  lastSignal: { label: string; date: string };
  stat: { value: string; label: string };
  /** One line in the machine's own voice. */
  voice: string;
  body: string;
  image: { src: string; alt: string; credit: string; isArtwork?: boolean };
}

export const PLATFORM_LABEL: Record<Platform, string> = {
  moon: "The Moon",
  mars: "Mars",
  "deep-space": "Deep space",
};

export const missions: Mission[] = [
  {
    slug: "apollo-11",
    name: "Eagle",
    craft: "Apollo 11 lunar module",
    platform: "moon",
    place: "Sea of Tranquility",
    coords: "0.674° N · 23.473° E",
    arrived: { label: "Landed", date: "20 Jul 1969" },
    lastSignal: { label: "Experiments off", date: "27 Aug 1969" },
    stat: { value: "21 h 36 min", label: "with a crew on board" },
    voice: "I was the launch pad. When my crew left, I stayed.",
    body: "Eagle carried Neil Armstrong and Buzz Aldrin to the first crewed landing on the Moon. When it was time to go home, the top half fired its engine and flew back to orbit. The bottom half, the descent stage, stayed behind as the launch pad. A mirror for lasers was set up nearby, and scientists on Earth still bounce lasers off it today.",
    image: {
      src: "/images/stories/apollo-11.jpg",
      alt: "The Apollo 11 lunar module Eagle on the Moon, with Buzz Aldrin unloading experiments beside it",
      credit: "AS11-40-5927",
    },
  },
  {
    slug: "intrepid",
    name: "Intrepid",
    craft: "Apollo 12 lunar module",
    platform: "moon",
    place: "Ocean of Storms",
    coords: "3.013° S · 23.422° W",
    arrived: { label: "Landed", date: "19 Nov 1969" },
    lastSignal: { label: "Station off", date: "30 Sep 1977" },
    stat: { value: "180 m", label: "from its neighbour, Surveyor 3" },
    voice: "I landed next to a robot that had been waiting two and a half years.",
    body: "Intrepid carried Pete Conrad and Alan Bean to the Ocean of Storms, 180 m from the Surveyor 3 robot. They set up a science station powered by plutonium, walked over to Surveyor and brought parts of it home. Then the empty ascent stage was crashed into the Moon on purpose, making the first recorded artificial moonquake.",
    image: {
      src: "/images/stories/intrepid/surveyor.jpg",
      alt: "Pete Conrad beside Surveyor 3, with the lunar module Intrepid in the distance",
      credit: "AS12-48-7136",
    },
  },
  {
    slug: "falcon",
    name: "Falcon",
    craft: "Apollo 15 lunar module",
    platform: "moon",
    place: "Hadley–Apennine",
    coords: "26.132° N · 3.633° E",
    arrived: { label: "Landed", date: "30 Jul 1971" },
    lastSignal: { label: "Station off", date: "30 Sep 1977" },
    stat: { value: "27.9 km", label: "driven in three moonwalks" },
    voice: "I was the landing platform, then the launch platform. Then I stayed.",
    body: "Falcon came down at the foot of the Apennine mountains with Dave Scott and Jim Irwin on board, and a rover folded inside. They drove 27.9 km, dropped a hammer and a feather to show they fall together, and left a plaque for fourteen lost explorers. When the top half flew home, the descent stage stayed behind.",
    image: {
      src: "/images/stories/falcon.jpg",
      alt: "Astronaut Jim Irwin working beside the lunar rover, with Mount Hadley behind",
      credit: "AS15-86-11603",
    },
  },
  {
    slug: "surveyor-3",
    name: "Surveyor 3",
    craft: "Robotic lander",
    platform: "moon",
    place: "Ocean of Storms",
    coords: "3.016° S · 23.418° W",
    arrived: { label: "Landed", date: "20 Apr 1967" },
    lastSignal: { label: "Last signal", date: "4 May 1967" },
    stat: { value: "6,326", label: "pictures sent home" },
    voice: "I bounced before I settled. Two years later, astronauts came to visit.",
    body: "Surveyor 3 was sent to find out whether the Moon's ground was firm enough to land on. It dug trenches 18 cm deep with a small scoop and photographed everything around it. In November 1969, Apollo 12 landed about 180 m away. Pete Conrad and Alan Bean walked over and took its camera back to Earth.",
    image: {
      src: "/images/stories/surveyor-3.jpg",
      alt: "An Apollo 12 astronaut beside Surveyor 3, with the lunar module in the distance",
      credit: "AS12-48-7133",
    },
  },
  {
    slug: "pioneer-10",
    name: "Pioneer 10",
    craft: "Deep space probe",
    platform: "deep-space",
    place: "Heading for Aldebaran",
    arrived: { label: "Launched", date: "3 Mar 1972" },
    lastSignal: { label: "Last signal", date: "23 Jan 2003" },
    stat: { value: "2 million years", label: "to reach Aldebaran" },
    voice: "I was built for 21 months. I lasted more than 30 years.",
    body: "Pioneer 10 was the first spacecraft to cross the asteroid belt and the first to fly past Jupiter, in December 1973. Its last faint signal reached Earth in January 2003. It carries a metal plaque showing who sent it, and it is drifting toward the red star Aldebaran.",
    image: {
      src: "/images/stories/pioneer-10.jpg",
      alt: "Painting of the Pioneer 10 spacecraft leaving Earth and the Moon behind",
      credit: "ARC-1969-AC72-1353",
      isArtwork: true,
    },
  },
  {
    slug: "voyager-1",
    name: "Voyager 1",
    craft: "Interstellar probe",
    platform: "deep-space",
    place: "Interstellar space",
    arrived: { label: "Launched", date: "5 Sep 1977" },
    lastSignal: { label: "Left the Sun's bubble", date: "Aug 2012" },
    stat: { value: "1 light-day", label: "from Earth in November 2026" },
    voice: "I am the farthest thing people have ever made.",
    body: "Voyager 1 flew past Jupiter and Saturn, found an erupting volcano on the moon Io, and kept going. In 1990 it turned around and photographed Earth as a pale blue dot. In 2012 it became the first spacecraft in the space between the stars, and 49 years after launch it is still calling home, carrying a golden record of greetings from Earth.",
    image: {
      src: "/images/stories/voyager-1/cover.jpg",
      alt: "Artist's picture of the Voyager spacecraft with its dish antenna pointed toward Earth",
      credit: "PIA04495",
      isArtwork: true,
    },
  },
  {
    slug: "kepler",
    name: "Kepler",
    craft: "Space telescope",
    platform: "deep-space",
    place: "Orbiting the Sun, behind Earth",
    arrived: { label: "Launched", date: "6 Mar 2009" },
    lastSignal: { label: "Goodnight commands", date: "15 Nov 2018" },
    stat: { value: "2,600+", label: "planets found around other stars" },
    voice: "I never saw a planet. I watched their shadows.",
    body: "Kepler watched about 150,000 stars at once, waiting for the tiny dip in light when a planet crosses in front of its star. When two of its wheels broke, engineers balanced it on sunlight and kept it working for four more years. It showed that planets are common, and it still drifts around the Sun.",
    image: {
      src: "/images/stories/kepler/cover.jpg",
      alt: "Artist's picture of the Kepler space telescope in space",
      credit: "PIA11824",
      isArtwork: true,
    },
  },
  {
    slug: "sojourner",
    name: "Sojourner",
    craft: "Mars Pathfinder rover",
    platform: "mars",
    place: "Ares Vallis",
    coords: "19.33° N · 33.55° W",
    arrived: { label: "Landed", date: "4 Jul 1997" },
    lastSignal: { label: "Contact lost", date: "27 Sep 1997" },
    stat: { value: "83 days", label: "on a 7-day plan" },
    voice: "I was the size of a microwave oven, and the first rover on Mars.",
    body: "Sojourner rolled down a ramp from the Pathfinder lander two days after landing. It was planned to work for a week. Instead it spent almost three months driving up to rocks with names like Barnacle Bill and Yogi, measuring what they were made of.",
    image: {
      src: "/images/stories/sojourner.jpg",
      alt: "The small six-wheeled Sojourner rover among rocks on Mars",
      credit: "PIA04318",
    },
  },
  {
    slug: "opportunity",
    name: "Opportunity",
    craft: "Mars Exploration Rover",
    platform: "mars",
    place: "Meridiani Planum",
    coords: "1.946° S · 5.527° W",
    arrived: { label: "Landed", date: "25 Jan 2004" },
    lastSignal: { label: "Last signal", date: "10 Jun 2018" },
    stat: { value: "45.16 km", label: "driven on a 90-day plan" },
    voice: "I was built to last 90 days. I worked for more than 14 years.",
    body: "Opportunity bounced 26 times on landing and found rocks that formed in water, proof that Mars was once a wet world. It ran the first marathon on another world and drove just over 45 kilometers. In 2018 a dust storm covered the whole of Mars, its solar panels lost their sunlight, and it never answered again.",
    image: {
      src: "/images/stories/opportunity.jpg",
      alt: "Artist's painting of the Opportunity rover on the surface of Mars",
      credit: "PIA04928",
      isArtwork: true,
    },
  },
  {
    slug: "viking-1",
    name: "Viking 1",
    craft: "Mars lander",
    platform: "mars",
    place: "Chryse Planitia",
    coords: "22.27° N · 47.95° W",
    arrived: { label: "Landed", date: "20 Jul 1976" },
    lastSignal: { label: "Contact lost", date: "13 Nov 1982" },
    stat: { value: "6 years", label: "of reports from Mars" },
    voice: "I sent the first clear pictures from the ground of Mars.",
    body: "Viking 1 was the first American spacecraft to work on the surface of Mars. Its robotic arm scooped up soil and dropped it into a tiny lab on board that tested it for signs of life. It kept sending pictures and weather reports for more than six years before contact was lost.",
    image: {
      src: "/images/stories/viking-1.jpg",
      alt: "Red rocky ground stretching to the horizon, seen from the Viking 1 lander",
      credit: "PIA00563",
    },
  },
];

/** Apollo 11 touchdown, from NSSDCA: 20:17:40 UT on 20 July 1969. */
export const EAGLE_LANDED_AT = Date.UTC(1969, 6, 20, 20, 17, 40);
