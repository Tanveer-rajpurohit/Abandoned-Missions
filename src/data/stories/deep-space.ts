import { sources, type Story } from "./types";

const PIONEER = "pioneer-10";

/** A story photo; `note` marks a painting, or a picture the machine did not take itself. */
const pic = (dir: string, file: string, credit: string, alt: string, note?: string) => ({ src: `/images/stories/${dir}/${file}.jpg`, alt, credit, ...(note && { note }) });
const pioneerImg = (file: string, credit: string, alt: string, note?: string) => pic(PIONEER, file, credit, alt, note);

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
const PAINTING = "Artist's painting, not a photograph";

// Told from the team's Voyager 1 doc, checked against NASA Science, NSSDCA (1977-084A) and the Voyager blog.
export const voyager1: Story = {
  slug: VOYAGER,
  title: "Voyager 1",
  subtitle: "The traveler that left the Sun behind",
  eyebrow: "Voyager 1 · 1977 · from NASA's records",
  cover: { src: `/images/stories/${VOYAGER}/cover.jpg`, alt: "Artist's picture of the Voyager spacecraft with its dish antenna pointed toward Earth", credit: "PIA04495" },
  beats: [
    {
      id: "launch",
      tick: "Launch",
      title: "A lucky line of planets",
      when: "5 September 1977",
      lines: [
        "In the late 1970s the giant planets lined up, so a spacecraft could swing from one to the next like a ball passed hand to hand. NASA built twins to use the chance: Voyager 1 and Voyager 2.",
        "Voyager 1 left Cape Canaveral on a Titan-Centaur rocket. Its twin launched first, but on December 15, 1977, Voyager 1 passed it. It has been in front ever since.",
      ],
      fact: { value: "5 Sep 1977", label: "launch day, from Cape Canaveral" },
      image: pic(VOYAGER, "launch", "PIA21746", "A Titan-Centaur rocket lifting off with Voyager 1 on 5 September 1977"),
    },
    {
      id: "machine",
      tick: "The machine",
      title: "What is it made of?",
      when: "Built in the 1970s",
      lines: [
        "A ten-sided box 1.78 meters across, with a white dish 3.66 meters wide on top. The dish is its voice and its ears, and it has to stay pointed at Earth.",
        "Sunlight is too weak out there for solar panels. Three nuclear power units turn the heat of plutonium into electricity: about 470 watts at launch.",
      ],
      fact: { value: "721.9 kg", label: "the whole spacecraft" },
      image: pic(VOYAGER, "model", "PIA14111", "Artist's picture of the Voyager spacecraft with its dish antenna and long booms", PAINTING),
    },
    {
      id: "jupiter",
      tick: "Jupiter",
      title: "Jupiter up close",
      when: "5 March 1979",
      lines: [
        "Voyager 1 flew past Jupiter about 280,000 kilometers away.",
        "It found a thin, faint ring that nobody knew was there, and two new moons, Thebe and Metis.",
      ],
      fact: { value: "2", label: "new moons: Thebe and Metis" },
      image: pic(VOYAGER, "jupiter", "PIA00235", "Jupiter and its Great Red Spot photographed by Voyager 1 on 1 February 1979, with the moon Io in front"),
    },
    {
      id: "io",
      tick: "Io",
      title: "A volcano in space",
      when: "March 1979",
      lines: [
        "A few days after the flyby, an engineer named Linda Morabito noticed a strange cloud rising from the edge of the moon Io.",
        "It was a volcano, erupting into space. Nobody had ever seen an active volcano on another world before.",
      ],
      fact: { value: "1st", label: "active volcano seen beyond Earth" },
      image: pic(VOYAGER, "io", "PIA00010", "Jupiter's moon Io photographed by Voyager 1, with a volcanic plume glowing on its edge"),
    },
    {
      id: "saturn",
      tick: "Saturn",
      title: "Shepherds and haze",
      when: "12 November 1980",
      lines: [
        "Voyager 1 passed Saturn about 126,000 kilometers away. It found five new moons, a new ring, and small shepherd moons that keep a ring in shape, the way a sheepdog keeps sheep together.",
        "Then it studied Titan, Saturn's largest moon. Its thick, hazy air is about 90 percent nitrogen. Earth's air is mostly nitrogen too.",
      ],
      fact: { value: "5", label: "new moons found at Saturn" },
      image: pic(VOYAGER, "saturn", "PIA00024", "Saturn and its moons Tethys and Dione, photographed by Voyager 1 on 3 November 1980"),
    },
    {
      id: "dot",
      tick: "Looking back",
      title: "The pale blue dot",
      when: "14 February 1990",
      lines: [
        "From about 6 billion kilometers away, Voyager 1 turned around and took a family portrait of the solar system.",
        "In one picture, Earth is a tiny point of light caught in a ray of sunlight. Every person you know, and every place you have been, is inside that dot.",
      ],
      fact: { value: "6 billion km", label: "from Earth when it took this" },
      image: pic(VOYAGER, "dot", "PIA00452", "Earth seen from Voyager 1 as a tiny pale dot in a beam of scattered sunlight"),
    },
    {
      id: "bubble",
      tick: "The edge",
      title: "Out of the Sun's bubble",
      when: "25 August 2012",
      lines: [
        "The Sun blows a wind of tiny particles that makes a huge bubble around the solar system. In 1998 Voyager 1 passed Pioneer 10 and became the most distant thing people have made.",
        "On August 25, 2012, it left the bubble. It was the first spacecraft in the space between the stars.",
      ],
      fact: { value: "1st", label: "spacecraft in interstellar space" },
      image: pic(VOYAGER, "bubble", "PIA04927", "Diagram of the Sun's bubble with the termination shock, the heliopause and both Voyagers marked", "Artist's diagram, not a photograph"),
    },
    {
      id: "record",
      tick: "The record",
      title: "A golden message",
      when: "Fixed to its side in 1977",
      lines: [
        "On its side is a gold-plated copper record, 30 centimeters wide. It holds greetings in 55 languages, 115 pictures, 35 sounds from Earth and 90 minutes of music.",
        "It is for anyone, or anything, that finds the spacecraft one day. A message in a bottle, thrown into the biggest ocean there is.",
      ],
      fact: { value: "55", label: "languages say hello" },
      image: pic(VOYAGER, "record-cover", "PIA21740", "Engineers in clean-room suits fixing the cover over Voyager 1's Golden Record in 1977"),
    },
    {
      id: "light-day",
      tick: "Still talking",
      title: "One light-day away",
      when: "18 November 2026",
      lines: [
        "It has worked for 49 years. Its power drops about 4 watts a year, so the team switches things off one by one. In October 2026 it went silent for two days, then came back on its backup thrusters.",
        "On November 18, 2026, it reaches 25.9 billion kilometers: so far that a message sent on Monday arrives on Tuesday, and its answer reaches us on Wednesday.",
      ],
      fact: { value: "24 hours", label: "for a radio signal to reach it" },
      image: { src: `/images/stories/${VOYAGER}/cover.jpg`, alt: "Artist's picture of the Voyager spacecraft with its dish antenna pointed toward Earth", credit: "PIA04495", note: PAINTING },
    },
  ],
  ending: "One day its voice will stop. The spacecraft will not. It was not abandoned. It was sent.",
  sources: sources(
    { label: "NASA Science: Voyager 1", href: "https://science.nasa.gov/mission/voyager/voyager-1/" },
    { label: "NASA Space Science Data Coordinated Archive: Voyager 1", href: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1977-084A" },
    { label: "NASA Voyager blog, 29 October 2026", href: "https://science.nasa.gov/blogs/voyager/2026/10/29/nasas-voyager-1-conserves-power-resolves-brief-communications-pause/" },
  ),
};

const KEPLER = "kepler";

// Told from the team's Kepler doc, checked against NASA Science, NSSDCA (2009-011A) and NASA's 2018 releases.
export const kepler: Story = {
  slug: KEPLER,
  title: "Kepler",
  subtitle: "The telescope that counted other worlds",
  eyebrow: "Kepler · 2009 · from NASA's records",
  cover: { src: `/images/stories/${KEPLER}/cover.jpg`, alt: "Artist's picture of the Kepler space telescope in space", credit: "PIA11824" },
  beats: [
    {
      id: "question",
      tick: "Launch",
      title: "Does that star have planets?",
      when: "6 March 2009 · night, in Florida",
      lines: [
        "Pick any star. For thousands of years people asked whether it had planets, but the stars are so far away that their planets are lost in the glare.",
        "So NASA built a telescope to find out. Here Kepler is lowered onto its rocket. It never visited a planet. It watched, for nine years.",
      ],
      fact: { value: "2,600+", label: "planets found around other stars" },
      image: pic(KEPLER, "stack", "KSC-2009-1650", "Workers guiding the hanging Kepler spacecraft toward the upper stage of its rocket"),
    },
    {
      id: "blink",
      tick: "The blink",
      title: "Looking for shadows",
      when: "How it worked",
      lines: [
        "Kepler never saw a planet. When one passes in front of its star, the star dims a little, like a far-off lamp with a moth flying past. This is a transit.",
        "If the same dip comes back after the same number of days, it is a planet. The gap is its year. The size of the dip shows how big it is.",
      ],
      fact: { value: "1 dip", label: "is not enough: it has to come back" },
      image: pic(KEPLER, "transit", "PIA14724", "Painting of a planet crossing in front of its star", PAINTING),
    },
    {
      id: "eye",
      tick: "The camera",
      title: "A very big eye",
      when: "Launched on a Delta II rocket",
      lines: [
        "Its main mirror was 1.4 meters across, and it carried the largest digital camera sent into space up to then. The whole spacecraft had a mass of 1,039 kilograms.",
        "It did not circle Earth. It went around the Sun, following behind our planet, so Earth could never get in the way.",
      ],
      fact: { value: "1.4 m", label: "across its main mirror" },
      image: pic(KEPLER, "cleanroom", "PIA11188", "The Kepler spacecraft standing in a clean room before launch"),
    },
    {
      id: "patch",
      tick: "Staring",
      title: "One patch of sky",
      when: "From 13 May 2009",
      lines: [
        "Kepler stared at one patch of sky in the constellations Cygnus and Lyra, measuring about 150,000 stars at the same time.",
        "A transit can last only a few hours, so it never looked away. In its first six weeks it found five planets.",
      ],
      fact: { value: "150,000", label: "stars watched at once" },
      image: pic(KEPLER, "stars", "PIA11984", "Kepler's full view of the sky: a grid of squares packed with stars"),
    },
    {
      id: "two-suns",
      tick: "Strange worlds",
      title: "Two suns",
      when: "2011",
      lines: [
        "Around one star, Kepler-11, it found six planets. In September 2011 came Kepler-16b, a planet that goes around two stars at once.",
        "If you could stand there, you would see two suns set in the evening.",
      ],
      fact: { value: "6", label: "planets around the star Kepler-11" },
      image: pic(KEPLER, "two-suns", "PIA14725", "Painting of two suns in the sky above the planet Kepler-16b", PAINTING),
    },
    {
      id: "just-right",
      tick: "Just right",
      title: "Not too hot, not too cold",
      when: "December 2011 to April 2014",
      lines: [
        "Kepler-22b was its first planet in a habitable zone, where liquid water could exist. In April 2014 came Kepler-186f, the first Earth-size planet found in one.",
        "The most common planet it found is bigger than Earth and smaller than Neptune. Our solar system does not have a single one.",
      ],
      fact: { value: "1st", label: "Earth-size planet in a habitable zone" },
      image: pic(KEPLER, "planet", "PIA17999", "Painting of the planet Kepler-186f, a rocky world orbiting a red star", "Artist's painting: Kepler measured starlight and took no close-ups"),
    },
    {
      id: "wheels",
      tick: "Breakdown",
      title: "The wheels break",
      when: "July 2012 and May 2013",
      lines: [
        "Kepler held itself steady with four spinning wheels and needed three of them. In July 2012 one failed. In May 2013 a second one failed, and its first mission was over.",
        "The camera still worked and there was fuel in the tank, but the telescope kept drifting. What would you do with a telescope that cannot stay still?",
      ],
      fact: { value: "2 of 4", label: "wheels lost, and it needed 3" },
      image: pic(KEPLER, "wheels", "PIA11825", "Painting of the Kepler spacecraft", PAINTING),
    },
    {
      id: "k2",
      tick: "K2",
      title: "Balancing on sunlight",
      when: "From 30 May 2014",
      lines: [
        "Sunlight pushes on things, very gently. The team pointed Kepler so sunlight pressed evenly on both sides of it, and the light itself became the third wheel.",
        "The new mission was called K2. About every three months it turned to a new patch of sky, and the stars it had studied grew to more than 500,000.",
      ],
      fact: { value: "500,000+", label: "stars studied by the end" },
      image: pic(KEPLER, "sunlight", "KSC-2009-1124", "Test lights reflecting off Kepler's solar panels before launch"),
    },
    {
      id: "goodnight",
      tick: "Goodnight",
      title: "Goodnight, Kepler",
      when: "15 November 2018",
      lines: [
        "Its fuel ran out, and on October 30, 2018, NASA retired Kepler. On the evening of November 15, the team sent the goodnight commands that switched off its transmitters.",
        "Johannes Kepler, the astronomer it was named after, died on November 15, 1630. The commands went out 388 years later, to the day.",
      ],
      fact: { value: "388 years", label: "after its namesake died, to the day" },
      image: pic(KEPLER, "fields", "ACD20-0045-001", "Map of every patch of sky Kepler and K2 studied"),
    },
    {
      id: "legacy",
      tick: "Legacy",
      title: "Most stars have planets",
      when: "Still drifting around the Sun",
      lines: [
        "Before Kepler, people wondered whether planets were rare. Kepler found more than 2,600 and showed that they are common.",
        "From its data, scientists estimate that 20 to 50 percent of the stars you can see at night may have a small, possibly rocky planet in the habitable zone.",
      ],
      fact: { value: "20–50%", label: "of the stars you can see may have one" },
      image: pic(KEPLER, "star-chart", "PIA11983", "Star chart of Cygnus and Lyra with Kepler's view drawn as a grid of squares"),
    },
  ],
  ending: "Kepler is silent now. It was not abandoned. It finished its job, and it changed the night sky.",
  sources: sources(
    { label: "NASA Science: Kepler / K2", href: "https://science.nasa.gov/mission/kepler/" },
    { label: "NASA Space Science Data Coordinated Archive: Kepler", href: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2009-011A" },
    { label: "NASA: Kepler retires, 30 October 2018", href: "https://www.nasa.gov/news-release/nasa-retires-kepler-space-telescope-passes-planet-hunting-torch/" },
    { label: "NASA Science: Goodnight Kepler", href: "https://science.nasa.gov/universe/exoplanets/goodnight-kepler-final-commands-for-space-telescope/" },
  ),
};
