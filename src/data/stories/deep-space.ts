import { beat, sources, type Story } from "./types";

const PIONEER = "pioneer-10";

/** A Pioneer 10 photo; `note` marks a painting rather than a photograph. */
const pioneerImg = (file: string, credit: string, alt: string, note?: string) => ({ src: `/images/stories/${PIONEER}/${file}.jpg`, alt, credit, ...(note && { note }) });

// Told from the team's Pioneer 10 doc, checked against NASA Science and NSSDCA (1972-012A).
export const pioneer10: Story = {
  slug: PIONEER,
  title: "Pioneer 10",
  subtitle: "The little spacecraft that kept going",
  eyebrow: "Pioneer 10 · 1972 · from NASA's records",
  cover: { src: "/images/stories/pioneer-10.jpg", alt: "Painting of the Pioneer 10 spacecraft leaving Earth and the Moon behind", credit: "ARC-1969-AC72-1353" },
  beats: [
    {
      id: "plan",
      tick: "The plan",
      title: "The plan was small",
      when: "Built in the early 1970s",
      lines: [
        "Remember three numbers: 21, 30 and 14. By the end of this story, you will know what each one means.",
        "Pioneer 10 weighed just 258 kilograms. Its job was to fly past Jupiter, and it was designed to last 21 months. That was the plan. The spacecraft had a different idea.",
      ],
      fact: { value: "21 months", label: "the mission it was designed for" },
      image: pioneerImg("assembly", "ARC-1973-AC73-9019", "The Pioneer 10 spacecraft during final assembly, with its large dish antenna"),
    },
    {
      id: "launch",
      tick: "Launch",
      title: "Blast off",
      when: "2 March 1972 · 8:49 p.m. in Florida",
      lines: [
        "An Atlas Centaur rocket lifted off from Cape Canaveral with Pioneer 10 on top. Its third stage used a solid-fuel engine adapted from the one on the Surveyor lander.",
        "Pioneer 10 sped away at 51,682 kilometers per hour, faster than anything people had ever launched.",
      ],
      fact: { value: "51,682 km/h", label: "the fastest launch yet" },
      image: pioneerImg("launch", "ARC-1972-AC72-2142", "The Atlas Centaur rocket lifting off at night with Pioneer 10 on board"),
    },
    {
      id: "belt",
      tick: "Asteroids",
      title: "Through the belt",
      when: "15 July 1972 to February 1973",
      lines: [
        "Between Mars and Jupiter lies the asteroid belt. No spacecraft had ever flown through it, and nobody knew what it would be like.",
        "Pioneer 10 travelled 435 million kilometers through it and came out safe. It was hit by fewer particles than scientists had expected.",
      ],
      fact: { value: "1st", label: "spacecraft through the asteroid belt" },
      image: pioneerImg("asteroid-belt", "ARC-1974-AC73-9344", "Painting of Pioneer 10 crossing the asteroid belt on its way to Jupiter", "Artist's painting by Rick Guidice, not a photograph"),
    },
    {
      id: "closing-in",
      tick: "Closing in",
      title: "Closing in",
      when: "26 November 1973 · 20:30 UTC",
      lines: [
        "The solar wind dropped and the temperature jumped 100 times. Pioneer 10 had crossed into Jupiter's magnetosphere, the planet's giant magnetic bubble.",
        "Its pictures of Jupiter grew bigger every day. A command from Earth and its reply now took up to 92 minutes.",
      ],
      fact: { value: "92 min", label: "for a command to go out and its reply to return" },
      image: pioneerImg("composite", "ARC-1973-AC73-9341", "Pioneer 10's pictures of Jupiter, growing larger as the spacecraft closed in"),
    },
    {
      id: "jupiter",
      tick: "Jupiter",
      title: "The big moment",
      when: "4 December 1973 · 02:26 UTC",
      lines: [
        "Pioneer 10 raced past Jupiter at about 126,000 kilometers per hour, just 130,354 kilometers above the clouds.",
        "Jupiter's radiation was hard on it. Of its 11 instruments, 6 ran without a break. The radiation overcame its imaging instrument before it reached the moon Io, so there are no pictures of Io.",
      ],
      fact: { value: "1st", label: "spacecraft ever to fly past Jupiter" },
      image: pioneerImg("jupiter-real", "ARC-1973-AC73-9253", "Jupiter photographed by Pioneer 10 on 2 December 1973, from about 2.6 million kilometers away"),
    },
    {
      id: "pictures",
      tick: "Pictures",
      title: "Five hundred pictures",
      when: "November 1973 to January 1974",
      lines: [
        "Pioneer 10 took about 500 pictures of Jupiter, clearly showing the Great Red Spot. It also photographed the moons Callisto, Ganymede and Europa.",
        "This is Ganymede, seen up close for the first time.",
      ],
      fact: { value: "500", label: "pictures of Jupiter" },
      image: pioneerImg("ganymede", "ARC-1973-AC73-9279", "Jupiter's moon Ganymede photographed by Pioneer 10"),
    },
    {
      id: "kept-going",
      tick: "Beyond",
      title: "And then, it kept going",
      when: "1976 to 1983",
      lines: [
        "The job was done, but the spacecraft still worked, so it kept travelling. It crossed Saturn's orbit in February 1976 and Neptune's on June 13, 1983.",
        "It was the first human-made object to go beyond Neptune. Planned for 21 months, Pioneer 10 lasted more than 30 years.",
      ],
      fact: { value: "30+ years", label: "from a mission planned for 21 months" },
      image: { src: "/images/stories/pioneer-10.jpg", alt: "Painting of the Pioneer 10 spacecraft travelling through space", credit: "ARC-1969-AC72-1353", note: "Painting by Don Moore, not a photograph" },
    },
    {
      id: "letting-go",
      tick: "Silence",
      title: "Learning to let go",
      when: "Last signal · 23 January 2003",
      lines: [
        "Routine contact ended on March 31, 1997, when Pioneer 10 was 67 AU away. In 1998, Voyager 1 passed it as the farthest human-made object.",
        "Its last signal came from 12.23 billion kilometers away and took 11 hours and 20 minutes to reach Earth. Its power had faded. Nothing broke. It had given everything it had.",
      ],
      fact: { value: "11 h 20 min", label: "for its last signal to reach Earth" },
      image: pioneerImg("pad", "ARC-1972-AC72-2135", "Pioneer 10 being readied for launch at Cape Kennedy in 1972, the last time people saw it"),
    },
    {
      id: "plaque",
      tick: "Plaque",
      title: "A message in a bottle",
      when: "Bolted to its side",
      lines: [
        "Pioneer 10 carries an aluminum plaque with a man, a woman, a map of the solar system, and the Sun's position marked against 14 pulsars.",
        "It is heading toward Aldebaran, the red eye of Taurus, and should pass it in about two million years.",
      ],
      fact: { value: "14", label: "pulsars on the plaque's map" },
      image: pioneerImg("plaque", "ARC-1972-AC72-1338", "The Pioneer plaque: line drawings of a man, a woman, the spacecraft and a map of the Sun's position"),
    },
  ],
  ending: "Two million years to Aldebaran, with nobody watching. It keeps going anyway.",
  sources: sources(
    { label: "NASA Science: Pioneer 10", href: "https://science.nasa.gov/mission/pioneer-10/" },
    { label: "NASA Space Science Data Coordinated Archive: Pioneer 10", href: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1972-012A" },
  ),
};

const VOYAGER = "voyager-1";

export const voyager1: Story = {
  slug: VOYAGER,
  title: "Voyager 1",
  subtitle: "The farthest thing people have ever made",
  eyebrow: "Voyager · 1977 · told by the machine itself",
  cover: { src: `/images/stories/${VOYAGER}/cover.jpg`, alt: "Artist's picture of the Voyager spacecraft with its dish antenna pointed toward Earth", credit: "PIA04495" },
  beats: [
    beat(
      VOYAGER,
      "model",
      "PIA14111",
      "Launch",
      "Off to the giants",
      "5 September 1977",
      ["I am Voyager 1. I left Earth in 1977 to visit the giant planets.", "My twin, Voyager 2, launched two weeks before me. I took the faster road."],
      ["5 Sep 1977", "the day I left Earth"],
      "Artist's picture of the Voyager spacecraft in space",
    ),
    beat(
      VOYAGER,
      "jupiter",
      "PIA00235",
      "Jupiter",
      "Jupiter up close",
      "1979",
      ["At Jupiter I photographed storms bigger than the whole Earth.", "I also found volcanoes erupting on its moon Io, the first ever seen beyond Earth."],
      ["1979", "the year I flew past Jupiter"],
      "Jupiter and its Great Red Spot photographed by Voyager 1, with the moon Io in front",
    ),
    beat(
      VOYAGER,
      "record",
      "PIA14113",
      "The record",
      "A golden record",
      "Fixed to my side",
      ["I carry a golden record with sounds, music and pictures from Earth.", "On it, people say hello in many languages. It is a letter to anyone who finds me."],
      ["55", "languages say hello on the record"],
      "The gold-plated record carried by the Voyager spacecraft",
    ),
    beat(
      VOYAGER,
      "dot",
      "PIA00452",
      "Looking back",
      "The pale blue dot",
      "14 February 1990",
      ["Before my cameras were switched off for good, I turned around and took one last picture of home.", "Earth is the tiny dot in the beam of light."],
      ["6 billion km", "from Earth when I took this picture"],
      "Earth seen from Voyager 1 as a tiny pale dot in a beam of scattered sunlight",
    ),
  ],
  ending: "In 2012 I left the Sun's bubble behind. I am still calling home.",
  sources: sources({ label: "NASA Science: Voyager 1", href: "https://science.nasa.gov/mission/voyager/voyager-1/" }),
};

const KEPLER = "kepler";

export const kepler: Story = {
  slug: KEPLER,
  title: "Kepler",
  subtitle: "The telescope that counted planets",
  eyebrow: "Kepler Space Telescope · 2009 · told by the machine itself",
  cover: { src: `/images/stories/${KEPLER}/cover.jpg`, alt: "Artist's picture of the Kepler space telescope in space", credit: "PIA11824" },
  beats: [
    beat(
      KEPLER,
      "cleanroom",
      "PIA11188",
      "One job",
      "Built for one question",
      "Before launch",
      ["I am Kepler. I was built to answer one question: how common are planets like Earth?", "This is me in a clean room, where not even dust is allowed."],
      ["0.95 m", "the width of my telescope"],
      "The Kepler spacecraft standing in a clean room before launch",
    ),
    beat(
      KEPLER,
      "stack",
      "KSC-2009-1650",
      "Launch",
      "Onto the rocket",
      "March 2009",
      ["Here engineers are lowering me onto the top of my rocket.", "I did not go around Earth. I followed it around the Sun, so nothing would block my view."],
      ["2009", "the year I launched from Florida"],
      "Workers guiding the hanging Kepler spacecraft toward the upper stage of its rocket",
    ),
    beat(
      KEPLER,
      "stars",
      "PIA11984",
      "Staring",
      "One patch of sky",
      "2009 to 2013",
      ["I watched the same stars for years without blinking.", "When a planet passes in front of its star, the star dims a tiny bit. That small dip is how I found them."],
      ["150,000", "stars watched at the same time"],
      "Kepler's full view of the sky: a grid of squares packed with stars",
    ),
    beat(
      KEPLER,
      "planet",
      "PIA17999",
      "Planets",
      "Worlds everywhere",
      "Retired 30 October 2018",
      ["I found thousands of planets. It turns out there are more planets than stars.", "This painting shows Kepler-186f, the first Earth-size planet found where water could be liquid."],
      ["2,600+", "planets confirmed from my data"],
      "Painting of the planet Kepler-186f, a rocky world with oceans orbiting a red star",
    ),
  ],
  ending: "I ran out of fuel in 2018. I am still out here, following Earth around the Sun.",
  sources: sources({ label: "NASA Science: Kepler", href: "https://science.nasa.gov/mission/kepler/" }),
};
