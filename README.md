# Abandoned Missions

**2026 NASA Space Apps Challenge — "Abandoned but not Forgotten"**

An interactive, story-driven educational website that tells the history of the hardware NASA left behind across the solar system — from the perspective of the machines themselves.

---

## What it is

Since the 1960s, NASA has left landers, rovers, probes, and science stations on the Moon, on Mars, and in deep space. Most of them completed extraordinary science before going silent. Few people know their stories.

*Abandoned Missions* covers eleven of these machines and gives each one a voice. Every story is told in first person — the machine speaking — so a school-age audience hears history not as a list of facts but as the experience of an explorer. The site pairs that narrative with real NASA photographs, precise mission data, and three ways to consume each story.

---

## The machines

| Machine | Type | Location | Status |
|---|---|---|---|
| Eagle | Apollo 11 lunar module | Sea of Tranquility, Moon | Silent since 1969 |
| Lunar Rover 1 | Apollo 15 LRV | Hadley–Apennine, Moon | Parked forever |
| ALSEP | Apollo 12 science station | Ocean of Storms, Moon | Switched off 1977 |
| Surveyor 3 | Robotic lander | Ocean of Storms, Moon | Last signal 1967 |
| Pioneer 10 | Deep space probe | Heading for Aldebaran | Last signal 2003 |
| Voyager 1 | Interstellar probe | Interstellar space | Still transmitting |
| Kepler | Space telescope | Sun-trailing orbit | Retired 2018 |
| Sojourner | Mars Pathfinder rover | Ares Vallis, Mars | Contact lost 1997 |
| Opportunity | Mars Exploration Rover | Meridiani Planum, Mars | Last signal 2018 |
| Viking 1 | Mars lander | Chryse Planitia, Mars | Contact lost 1982 |
| InSight | Mars lander | Elysium Planitia, Mars | Last signal 2022 |

---

## Story modes

Each machine's story can be experienced three ways.

**Collage** (`/stories/[slug]`)
A horizontal-scrolling article where the user travels through the machine's timeline. Each chapter wipes open a photograph as the panel enters view, a dot traces a looping SVG rail along the bottom of the screen, and a loading screen flashes all images in sequence before the cover arrives. This is the default reading mode.

**Play** (`/stories/[slug]/play`)
A full-screen card deck that can be read by hand or handed off to the browser's speech engine. The Web Speech API reads each card aloud, advances automatically on completion, and shows a progress bar. Users can pick any voice the device provides, set speed (Slow / Calm / Quick), and those choices persist across sessions. Keyboard arrow keys move through cards without a pointer.

**3D scene** (`/stories/apollo-11/3d`)
An interactive Three.js experience available for Eagle. The user scrolls through five chapters — pre-dawn, touchdown, moonwalk, departure, night — while a camera travels 140 metres along the Tranquility Base terrain. Cut-out photographs of the mission stand at different depths in the scene and paint themselves in as they enter the frame, using real-time GPU watercolour shaders. The user can also paint directly onto the lunar surface with their pointer.

---

## Technical highlights

### Three.js moon scene

The 3D scene uses a photogrammetry-derived mesh of Tranquility Base (compressed with Meshopt, 6 MB on desktop, 2.6 MB on mobile) paired with two custom GLSL shader programs.

The **ground shader** renders the lunar regolith using a real Apollo 11 surface photo as a tile texture, triplanar mapping to cover the mesh without seams, and a sun-direction diffuse light. Where the pointer or the story places paint, the full soil colour and contrast are restored through a GPU-simulated watercolour paint map.

The **paint simulation** runs on a ping-pong render target. Each pointer move deposits brush dabs with per-bristle noise and frayed edges. While paint is wet it flows along a slowly rotating curl-noise current, bleeds into dry paper along noise-driven channels, then dries back over about seven seconds — the whole effect computed in a fragment shader every frame.

The **card shader** presents photographs as watercolour paintings: a grey wash first, then colour as a second pass of soft blotches, with pigment pooling at wash edges and bare paper showing through in the lightest areas. Each card "paints itself in" as it rises from the terrain.

Performance scales automatically: mobile and coarse-pointer devices use the lower-resolution terrain, a 1024-wide paint map, no MSAA, and a 1.25 pixel ratio cap. The render loop idles when nothing has moved for three seconds.

### Scroll and animation

GSAP 3 drives all scroll-triggered and entrance animations via `useGSAP` with `gsap.matchMedia`, so every animation respects `prefers-reduced-motion`. Lenis provides the smooth scroll foundation. In the collage story, the entire horizontal track is translated by a single GSAP scrub tween, keeping the scroll-to-pixel relationship frame-accurate. In the home page intro, the mission statement resolves word by word across a 220svh scroll section.

### Theming

Three themes — **Paper** (cream + navy), **Grape** (lavender), **Dark** — are implemented entirely with CSS custom properties on `<html data-theme="...">`. A small inline script reads `localStorage` before first paint so a returning visitor never sees a flash. Story pages set an additional `data-world="moon"` attribute that substitutes moon-specific surface colours without touching any component code.

### Web Speech narration

`useNarrator` wraps the browser's `SpeechSynthesis` API. It filters out Google's streaming voices (which cut out mid-card on many devices), scores the remaining voices by quality (preferring neural and enhanced voices, then warm English ones), and defaults to George where available. `narrationFor()` pre-processes each card's text into TTS-friendly form: expanding abbreviations, writing out units, and spelling out month names.

---

## Stack

| | |
|---|---|
| Framework | Next.js 16.4.6 — App Router, React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Animation | GSAP 3 + `@gsap/react` |
| Smooth scroll | Lenis 1.3.27 |
| 3D | Three.js 0.187 |
| Fonts | Space Grotesk (variable, Google Fonts) · Commit Mono (self-hosted, SIL OFL 1.1) |
| Package manager | pnpm 12 |
| Build | Turbopack (dev) · `next build` (production) |

All story routes are statically generated at build time.

---

## Getting started

### Prerequisites

- Node.js 20 or later
- pnpm 12 (`npm install -g pnpm`)

### Install

```bash
pnpm install
```

### Develop

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
pnpm build
pnpm start
```

### Lint

```bash
pnpm lint
```

---

## Project structure

```
src/
  app/
    page.tsx                    Home page
    globals.css                 Three-theme design token system
    stories/
      [slug]/page.tsx           Collage story
      [slug]/play/page.tsx      Slides + TTS story
      apollo-11/3d/page.tsx     3D interactive scene
  components/
    home/                       Hero, Intro, Stories grid, EagleClock, SiteHeader
    story/
      CollageStory.tsx          Horizontal-scroll collage layout
      SlidesStory.tsx           Card deck with auto-play and Web Speech
      EagleStory.tsx            Apollo 11 scroll-driven 3D experience
      MoonScene.tsx             Three.js renderer and GLSL shaders
      useNarrator.ts            Web Speech API hook
      useStepper.ts             Keyboard-navigable card controller
  data/
    missions.ts                 Canonical mission facts (all 11 machines)
    stories/
      moon.ts                   Apollo 11, Apollo 15 Rover, ALSEP, Surveyor 3
      mars.ts                   InSight, Opportunity, Sojourner, Viking 1
      deep-space.ts             Kepler, Pioneer 10, Voyager 1
      narration.ts              TTS text preprocessor
public/
  assets/moon/3d/               Terrain mesh (.glb), height map (.json)
  assets/moon/apollo-11/        Real Apollo photographs, SVG cut-outs
  images/stories/               Mission photos (NASA public domain)
```

---

## Data sources

All mission facts are drawn from the [NASA Space Science Data Coordinated Archive (NSSDCA)](https://nssdc.gsfc.nasa.gov) and individual NASA mission pages. All photographs are NASA public domain, credited by their NASA image ID in the source data.

---

## Accessibility

- Skip-to-content link on every page
- Decorative split-character headings have an `sr-only` accessible equivalent
- `aria-live` region on the hero's rotating photo caption
- Full keyboard navigation in the voice picker and slides deck
- All animations degrade gracefully when `prefers-reduced-motion: reduce` is active

---

## License

The source code is released under the [MIT License](LICENSE).  
All NASA photographs are public domain. The Commit Mono font is licensed under the [SIL Open Font License 1.1](src/app/fonts/CommitMono-OFL.txt).
