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
    slug: "apollo-15-rover",
    name: "Lunar Rover 1",
    craft: "Apollo 15 Lunar Roving Vehicle",
    platform: "moon",
    place: "Hadley–Apennine",
    coords: "26.132° N · 3.633° E",
    arrived: { label: "Landed", date: "30 Jul 1971" },
    lastSignal: { label: "Parked", date: "2 Aug 1971" },
    stat: { value: "27.9 km", label: "driven in three moonwalks" },
    voice: "I was the first car on the Moon. Nobody ever came back for me.",
    body: "The first lunar rover folded flat to ride on the side of the lunar module. Dave Scott and Jim Irwin unfolded it and drove it across the plains at the foot of the Apennine mountains, carrying tools and rock samples. When their work was done, they parked it and left it there.",
    image: {
      src: "/images/stories/apollo-15-rover.jpg",
      alt: "Astronaut Jim Irwin working beside the lunar rover, with Mount Hadley behind",
      credit: "AS15-86-11603",
    },
  },
  {
    slug: "alsep",
    name: "ALSEP",
    craft: "Apollo 12 science station",
    platform: "moon",
    place: "Ocean of Storms",
    coords: "3.01° S · 23.42° W",
    arrived: { label: "Set up", date: "19 Nov 1969" },
    lastSignal: { label: "Switched off", date: "30 Sep 1977" },
    stat: { value: "5", label: "experiments left running" },
    voice: "My crew went home. I stayed switched on.",
    body: "ALSEP was a set of science instruments that Apollo astronauts carried out by hand and wired to a central station. It ran on heat from a small nuclear power source, so it kept working through the two-week lunar night. Long after the astronauts left, it went on sending moonquake and magnetism readings to Earth.",
    image: {
      src: "/images/stories/alsep/cover.jpg",
      alt: "Astronaut Alan Bean setting up the ALSEP science station on the Moon",
      credit: "AS12-47-6919",
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
    voice: "I was the first to fly past Jupiter. I am still going.",
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
    stat: { value: "55", label: "languages on its golden record" },
    voice: "I am the farthest thing people have ever made.",
    body: "Voyager 1 flew past Jupiter and Saturn, found erupting volcanoes on the moon Io, and then kept going. In 1990 it turned around and photographed Earth as a pale blue dot. It crossed into the space between the stars in 2012, carrying a golden record of sounds and greetings from Earth.",
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
    arrived: { label: "Launched", date: "Mar 2009" },
    lastSignal: { label: "Retired", date: "30 Oct 2018" },
    stat: { value: "2,600+", label: "planets found around other stars" },
    voice: "I stared at one patch of sky and counted planets.",
    body: "Kepler watched about 150,000 stars at once, waiting for the tiny dip in light when a planet crosses in front of its star. It showed that planets are common, and found the first Earth-size ones where water could be liquid. When it ran out of fuel it was switched off, and it still follows Earth around the Sun.",
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
    voice: "I was built to last 90 days. I kept going for almost 15 years.",
    body: "Opportunity found rocks that could only have formed in water, proof that Mars was once a wet world. It drove farther than any vehicle had on another planet. In 2018 a dust storm covered the whole of Mars, its solar panels lost their sunlight, and it never answered again.",
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
  {
    slug: "insight",
    name: "InSight",
    craft: "Mars lander",
    platform: "mars",
    place: "Elysium Planitia",
    coords: "4.50° N · 135.62° E",
    arrived: { label: "Landed", date: "26 Nov 2018" },
    lastSignal: { label: "Last signal", date: "15 Dec 2022" },
    stat: { value: "1,300+", label: "marsquakes detected" },
    voice: "I did not drive anywhere. I stayed still and listened.",
    body: "InSight set a seismometer on the ground and listened to Mars shake for four years, showing scientists what the planet is like deep inside. Dust slowly covered its solar panels until it could no longer call home. Ten years earlier another lander, Phoenix, had dug up water ice near the north pole before the winter dark ended its mission.",
    image: {
      src: "/images/stories/insight/cover.jpg",
      alt: "Self-portrait of the InSight lander on Mars with its two round solar panels open",
      credit: "PIA22876",
    },
  },
];

/** Apollo 11 touchdown, from NSSDCA: 20:17:40 UT on 20 July 1969. */
export const EAGLE_LANDED_AT = Date.UTC(1969, 6, 20, 20, 17, 40);
