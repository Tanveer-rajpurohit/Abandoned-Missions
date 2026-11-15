import { sources, type Story } from "./types";

const OPPORTUNITY = "opportunity";
const oppImg = (file: string, credit: string, alt: string, note?: string) => ({ src: `/images/stories/${OPPORTUNITY}/${file}.jpg`, alt, credit, ...(note && { note }) });

// Told from the team's Opportunity doc, checked against NASA Science, NSSDCA (2003-032A) and NASA's releases.
export const opportunity: Story = {
  slug: OPPORTUNITY,
  title: "Opportunity",
  subtitle: "The rover that would not stop",
  eyebrow: "Opportunity · 2004 · from NASA's records",
  cover: { src: "/images/stories/opportunity.jpg", alt: "Artist's painting of the Opportunity rover on the surface of Mars", credit: "PIA04928" },
  beats: [
    {
      id: "plan",
      tick: "The plan",
      title: "A small plan",
      when: "Built 2002 to 2003",
      lines: [
        "Remember three numbers: 90, 26 and 45. By the end of this story, you will know what each one means.",
        "NASA built twin rovers for Mars, Spirit and Opportunity. Opportunity was to work for 90 Martian days and drive about 1,000 meters. That was the plan. The rover had a different idea.",
      ],
      fact: { value: "90 days", label: "the plan" },
      image: oppImg("assembly", "PIA05839", "Engineers at work on the rover that became Opportunity, at JPL in April 2002"),
    },
    {
      id: "geologist",
      tick: "The rover",
      title: "A geologist on wheels",
      when: "Built to ask: was Mars ever wet?",
      lines: [
        "It weighed 185 kilograms, rolled on six wheels, and held its cameras 1.4 meters up, close to a person's eye level. Its arm carried a microscope and a grinder that could scrape the dust off a rock.",
        "Solar panels gave it up to 140 watts. Its top speed was 3.75 centimeters per second. On Mars, careful beats fast, because nobody can come and help.",
      ],
      fact: { value: "3.75 cm/s", label: "its top speed" },
      image: oppImg("selfie", "PIA18079", "Self-portrait of the Opportunity rover on Mars in March 2014, its solar panels cleaned by the wind"),
    },
    {
      id: "bounces",
      tick: "Landing",
      title: "Twenty-six bounces",
      when: "Landed 25 January 2004 (UTC)",
      lines: [
        "It left Florida on the night of July 7, 2003. Seven months later it hit the thin air of Mars at about 19,300 km/h. A heat shield, a parachute and small rockets slowed it, and then big airbags puffed out all around it.",
        "It bounced 26 times, then rolled to a stop inside a crater only about 20 meters wide, with bare rock right in front of its cameras.",
      ],
      fact: { value: "26", label: "bounces before it stopped" },
      image: oppImg("launch", "KSC-03pd2090", "A Delta II Heavy rocket lifting off at night with Opportunity on board, 7 July 2003"),
    },
    {
      id: "blueberries",
      tick: "Blueberries",
      title: "Blueberries",
      when: "Early 2004",
      lines: [
        "Stuck in the rock and scattered on the ground were thousands of tiny round balls. The scientists called them blueberries. They are made of hematite, which on Earth usually forms in water.",
        "The rock around them held salty minerals, the kind left when salty water dries up. Within weeks Opportunity had its answer: this dry place was once soaked with water.",
      ],
      fact: { value: "Weeks", label: "to show Mars was once wet" },
      image: oppImg("berries", "PIA05273", "Close view of small round stones scattered on Martian soil"),
    },
    {
      id: "trouble",
      tick: "Trouble",
      title: "Stuck, then in the dark",
      when: "2005 to 2007",
      lines: [
        "In 2005 its wheels sank into a ripple of soft sand. Engineers practised with a test rover in a sandbox on Earth, sent commands a few centimeters at a time, and after weeks Opportunity drove free.",
        "In 2007 a huge dust storm darkened the sky for two months. With almost no power, it sat still and waited. It survived.",
      ],
      fact: { value: "2 months", label: "of darkness in the 2007 storm" },
      image: oppImg("shadow-endurance", "PIA06739", "Opportunity's own shadow stretching across the floor of Endurance Crater in 2004"),
    },
    {
      id: "marathon",
      tick: "The long drive",
      title: "Crater to crater",
      when: "2006 to 2015",
      lines: [
        "Crater walls show layers of rock that are normally hidden, so it drove from crater to crater. It reached Victoria crater in 2006, then Endeavour crater, 22 kilometers wide, on August 9, 2011.",
        "On March 24, 2015, its total distance passed 42.195 kilometers. It was the first machine to finish a marathon on another world.",
      ],
      fact: { value: "42.195 km", label: "the first marathon on another world" },
      image: oppImg("victoria", "PIA08812", "Victoria crater seen from above, with Opportunity a tiny speck on its rim", "Taken from orbit by Mars Reconnaissance Orbiter, not by Opportunity"),
    },
    {
      id: "storm",
      tick: "The storm",
      title: "The sky went dark",
      when: "Last signal · 10 June 2018",
      lines: [
        "In June 2018 a dust storm grew until it covered the whole planet. The solar panels could make no power, and on June 10 Opportunity sent its last signal.",
        "For eight months the team called, sending more than a thousand commands. On February 13, 2019, NASA declared the mission complete. “Farewell, Opportunity, and well done,” said project manager John Callas.",
      ],
      fact: { value: "1,000+", label: "commands sent to wake it" },
      image: oppImg("tracks", "PIA23246", "Opportunity's wheel tracks in Perseverance Valley, where it still stands"),
    },
    {
      id: "numbers",
      tick: "The numbers",
      title: "Ninety, twenty-six, forty-five",
      when: "January 2004 to June 2018",
      lines: [
        "Built for 90 days, it worked for more than 14 years. Built to drive 1,000 meters, it drove just over 45 kilometers and sent home more than 217,000 pictures.",
        "Its driving record stood until October 11, 2026, when a newer rover passed it: Perseverance, named like the valley where Opportunity rests.",
      ],
      fact: { value: "45 km", label: "driven on a 1,000-meter plan" },
      image: oppImg("endeavour", "PIA16120", "Opportunity's long afternoon shadow stretching into Endeavour Crater in August 2012"),
    },
  ],
  ending: "It was not abandoned. It was finished, sixty times over.",
  sources: sources(
    { label: "NASA Science: Opportunity", href: "https://science.nasa.gov/mission/mer-opportunity/" },
    { label: "NASA Space Science Data Coordinated Archive: Opportunity", href: "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=2003-032A" },
    { label: "NASA: Opportunity mission comes to an end, 13 February 2019", href: "https://www.nasa.gov/news-release/nasas-record-setting-opportunity-rover-mission-on-mars-comes-to-end/" },
    { label: "NASA JPL: Opportunity passes marathon distance", href: "https://www.jpl.nasa.gov/news/nasas-opportunity-mars-rover-passes-marathon-distance/" },
  ),
};
