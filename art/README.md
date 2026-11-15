# Source art

Everything that makes the pictures in the 3D story scenes, kept out of `public/` so the site only
serves the finished files. Each world has one folder (`moon/apollo-11` today).

## How a painted picture is made

The watercolour cut-outs standing in the Moon scene (`public/assets/moon/apollo-11/painted/*.webp`)
come from two kinds of source, both turned into the same paint style by one script.

```text
NASA photo ──photo-cutout.py──> real/<name>.png ─┐
                                                 ├──paint.py──> public/.../painted/<name>.webp
SVG drawing (moon-assets.mjs) ──> svg/<name>.png ┘
```

1. **Cut the subject out.** For a photo, `scripts/photo-cutout.py src out x y w h` runs OpenCV
   GrabCut inside the box you give it and writes an RGBA png to `real/`. Hardware NASA never
   photographed cleanly is drawn as plain SVG instead (`moon-assets.mjs`, `moon-drawings.mjs`,
   drawn to scale from NSSDCA figures) and exported to `svg/<name>.png` at twice its size.
2. **Paint it.** `scripts/paint.py <name>` simplifies the cut-out into flat washes, pools pigment
   at each wash edge, adds paper grain and a few dry-brush lines, and leaves a ragged margin of
   white paper. The settings per subject live in `SUBJECTS` at the top of the script; `--preview`
   also writes a jpg on grey for checking by eye.
3. **Place it.** Add a `card(...)` line in `src/components/story/EagleStory.tsx` with its real
   height in metres and where along the walk it stands.

Needs Python 3 with `opencv-python-headless` and `numpy`, and Node for the SVG scripts.

## Doing it for another mission

Make `art/<world>/<mission>/{real,svg,scripts}`, copy `paint.py`, point its output at
`public/assets/<world>/<mission>/painted`, and add a `SUBJECTS` entry per picture. For Mars, set
`tint` toward rust instead of the Moon's slate blue so the shadows sit in the landscape.

`moon/apollo-11/scripts/moon-terrain.py` builds the 3D ground in Blender
(`blender --background --python moon-terrain.py -- out.glb`).
