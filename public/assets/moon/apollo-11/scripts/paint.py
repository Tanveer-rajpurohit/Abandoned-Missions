"""Repaints the NASA photo cut-outs as watercolours on white paper, for the 3D story scene.

Each cut-out in ../real becomes a picture in ../painted: the photo's shapes and colours, but
simplified into flat washes the way a painter would lay them, with pigment pooling at the edge
of each wash, the grain of the paper showing through, a few dry-brush lines for the fine detail,
and a ragged margin of bare white paper left around the paint.

Usage: python paint.py [name ...] [--out DIR] [--preview]
(--preview also writes <name>-preview.jpg, the picture on a grey background, for checking by eye.)
Needs: opencv-python-headless, numpy.
"""
import sys
from pathlib import Path

import cv2
import numpy as np

HERE = Path(__file__).resolve().parent
SOURCES = HERE.parent / "real"
PAPER = np.array([0.985, 0.98, 0.965], np.float32)  # RGB, a warm white

# long: long side of the painting in pixels.  margin: bare paper around the paint, as a fraction
# of the long side.  brush: size of the smallest wash, in pixels.  colour: how far saturation is
# pushed.  lines: strength of the dry-brush detail.  tint: RGB the darkest tones are pulled toward.
# merge: how different two colours can be and still run into one wash (lower keeps more folds and
# seams).  lift: below 1 lightens the picture, lower is lighter.  punch: above 0 deepens the
# local light and shade first, for subjects that are all one pale tone.
# src: the cut-out to paint, if it is not ../real/<name>.png.
DEFAULT = dict(long=1400, margin=0.022, brush=4, colour=1.25, lines=0.5, tint=(0.2, 0.24, 0.36), merge=30, lift=0.8, punch=0, seed=1)
SUBJECTS = {
    # Eagle and the flag are each two pieces, made by split-layers.py: the thing itself, which
    # stands upright in the scene, and its patch of ground, which lies flat under it.
    "eagle-lander": dict(long=1600, brush=4, colour=1.4, seed=11),
    "eagle-ground": dict(long=1500, brush=5, colour=1.15, lines=0.4, seed=13),
    # A white suit: kept light, so most of it is bare paper with the folds washed in.
    "aldrin": dict(long=1300, brush=2, colour=1.6, lines=0.8, merge=16, lift=0.62, punch=3.0, tint=(0.22, 0.27, 0.45), seed=23),
    "flag-ground": dict(long=900, brush=4, colour=1.15, lines=0.45, seed=39),
    "bootprint": dict(long=1200, brush=5, colour=1.15, lines=0.45, seed=53),
    "earth": dict(long=1200, brush=6, colour=1.2, lines=0.2, margin=0.014, tint=(0.1, 0.18, 0.42), seed=67),
    # Drawings, not photos: ../svg/<name>.svg (from moon-drawings.mjs and moon-assets.mjs) drawn to
    # a PNG at twice its size. Their colours are already flat, so the washes are kept tighter.
    "flag-planted": dict(src="../svg/flag-planted.png", long=1300, brush=2, colour=1.1, lines=0.3, merge=18, seed=71),
    "flag-fallen": dict(src="../svg/flag-fallen.png", long=1200, brush=2, colour=1.1, lines=0.3, merge=18, seed=73),
    "seismometer": dict(src="../svg/seismometer.png", long=1400, brush=2, colour=1.15, lines=0.3, merge=18, seed=79),
    "laser-mirror": dict(src="../svg/laser-mirror.png", long=1100, brush=2, colour=1.2, lines=0.25, merge=16, seed=83),
    "laser-mirror-beam": dict(src="../svg/laser-mirror-beam.png", long=1800, brush=2, colour=1.2, lines=0.25, merge=16, margin=0.012, seed=89),
    "rock-box": dict(src="../svg/rock-box.png", long=1100, brush=2, colour=1.15, lines=0.3, merge=18, seed=97),
    "liftoff": dict(src="../svg/liftoff.png", long=1300, brush=2, colour=1.15, lines=0.3, merge=18, seed=101),
    "eagle-descent": dict(src="../svg/eagle-descent.png", long=1400, brush=2, colour=1.15, lines=0.3, merge=18, seed=103),
    "bootprints": dict(src="../svg/bootprints.png", long=900, brush=2, colour=1.1, lines=0.3, merge=18, seed=107),
}


def fbm(shape, cell, rng, octaves=4):
    """Smooth noise in 0..1 whose largest features are about `cell` pixels across."""
    h, w = shape
    out = np.zeros(shape, np.float32)
    amp, total = 1.0, 0.0
    for _ in range(octaves):
        gh, gw = max(2, int(h / cell) + 2), max(2, int(w / cell) + 2)
        grid = rng.random((gh, gw), dtype=np.float32)
        out += amp * cv2.resize(grid, (w, h), interpolation=cv2.INTER_CUBIC)
        total += amp
        amp *= 0.5
        cell = max(1.5, cell / 2)
    return np.clip(out / total, 0, 1)


def stretch(n, lo=0.3, hi=0.7):
    """Noise from fbm sits in a narrow band around 0.5; this spreads it over 0..1."""
    return np.clip((n - lo) / (hi - lo), 0, 1)


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def darken(colour, density):
    """Lays more (density > 1) or less (< 1) pigment over a colour, as watercolour does: light
    tones barely move and mid tones deepen. `colour` is RGB 0..1, `density` one number per pixel."""
    d = density[..., None]
    return np.clip(colour * (1 - (1 - colour) * (d - 1)), 0, 1)


def paint(name, out_dir, preview):
    cfg = {**DEFAULT, **SUBJECTS.get(name, {})}
    rng = np.random.default_rng(cfg["seed"])
    src = cv2.imread(str(SOURCES / cfg.get("src", f"{name}.png")), cv2.IMREAD_UNCHANGED)
    if src is None or src.shape[2] != 4:
        raise SystemExit(f"{name}: needs an RGBA png in {SOURCES}")

    scale = cfg["long"] / max(src.shape[:2])
    src = cv2.resize(src, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA if scale < 1 else cv2.INTER_CUBIC)
    pad = int(cfg["long"] * cfg["margin"] * 2.4) + 8
    src = cv2.copyMakeBorder(src, pad, pad, pad, pad, cv2.BORDER_CONSTANT, value=(0, 0, 0, 0))
    h, w = src.shape[:2]
    rgb = src[..., 2::-1].astype(np.float32) / 255
    alpha = src[..., 3].astype(np.float32) / 255

    # A hand never follows an outline exactly: everything is pushed about by a few pixels.
    wobble = cfg["long"] * 0.0035
    dx = (fbm((h, w), cfg["long"] / 22, rng, 3) - 0.5) * 2 * wobble
    dy = (fbm((h, w), cfg["long"] / 22, rng, 3) - 0.5) * 2 * wobble
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    rgb = cv2.remap(rgb, xx + dx, yy + dy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    alpha = cv2.remap(alpha, xx + dx, yy + dy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)

    # Where the paint goes. A hard photo edge stays where it is; a soft one (the faded patches of
    # ground) breaks up into the lobed edge a loaded brush leaves.
    lobes = stretch(fbm((h, w), cfg["long"] / 14, rng, 4))
    painted = (alpha + (lobes - 0.5) * 0.5 > 0.5).astype(np.float32)
    painted = cv2.GaussianBlur(painted, (0, 0), 1.6)
    inside = painted > 0.5

    # The paper is the painted shape grown outward by an uneven margin.
    reach = cfg["long"] * cfg["margin"]
    spread = cv2.GaussianBlur(inside.astype(np.float32), (0, 0), reach)
    torn = stretch(fbm((h, w), cfg["long"] / 9, rng, 4))
    paper = cv2.GaussianBlur((spread > 0.05 + 0.3 * torn).astype(np.float32), (0, 0), 2.2) > 0.5
    # Thin things (a flagpole, an antenna) are too slight to grow a margin that way, so they get a narrow one.
    narrow = max(3, int(reach * 0.4))
    paper |= cv2.dilate(inside.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (narrow * 2 + 1, narrow * 2 + 1))) > 0
    paper_alpha = cv2.GaussianBlur(paper.astype(np.float32), (0, 0), 0.9)

    # Colour just outside the shape is whatever the photo had there (black sky, usually). Replace
    # it with the nearest colour from inside, so the washes do not pick up a dark fringe.
    weight = inside.astype(np.float32)
    filled = rgb * weight[..., None]
    for sigma in (3, 9, 27):
        near = cv2.GaussianBlur(filled, (0, 0), sigma) / np.maximum(cv2.GaussianBlur(weight, (0, 0), sigma), 1e-4)[..., None]
        filled = np.where(weight[..., None] > 0, filled, near)
        weight = np.maximum(weight, (cv2.GaussianBlur(weight, (0, 0), sigma) > 0.02).astype(np.float32))
    rgb = np.where(inside[..., None], rgb, filled)

    # Flat washes: smooth within each area of colour but not across its edges, then round off
    # anything smaller than the brush.
    base = (rgb * 255).astype(np.uint8)
    if cfg["punch"] > 0:
        lab = cv2.cvtColor(base, cv2.COLOR_RGB2LAB)
        lab[..., 0] = cv2.createCLAHE(clipLimit=cfg["punch"], tileGridSize=(6, 6)).apply(lab[..., 0])
        base = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)
        rgb = base.astype(np.float32) / 255
    wash = cv2.pyrMeanShiftFiltering(cv2.cvtColor(base, cv2.COLOR_RGB2BGR), sp=cfg["brush"] * 3, sr=cfg["merge"], maxLevel=1)
    wash = cv2.cvtColor(wash, cv2.COLOR_BGR2RGB)
    blob = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (cfg["brush"] * 2 + 1, cfg["brush"] * 2 + 1))
    wash = cv2.morphologyEx(cv2.morphologyEx(wash, cv2.MORPH_CLOSE, blob), cv2.MORPH_OPEN, blob)
    wash = cv2.medianBlur(wash, cfg["brush"] | 1).astype(np.float32) / 255

    # Watercolour has no black. The darkest tones become a deep blue, everything is a little
    # lighter than the photo, and colour is stronger.
    hsv = cv2.cvtColor(wash, cv2.COLOR_RGB2HSV)
    hsv[..., 1] = np.clip(hsv[..., 1] * cfg["colour"], 0, 1)
    colour = cv2.cvtColor(hsv, cv2.COLOR_HSV2RGB)
    luma = colour @ np.array([0.299, 0.587, 0.114], np.float32)
    tint = np.array(cfg["tint"], np.float32)
    shade = (1 - smoothstep(0.03, 0.34, luma))[..., None]
    colour = colour * (1 - shade) + (tint + colour * 0.5) * shade
    colour = np.clip(colour, 0, 1) ** cfg["lift"]
    colour = colour + (1 - colour) * 0.07

    # Pigment pools where a wash stops: at edges between washes and at the edge of the paint.
    grey = cv2.GaussianBlur(cv2.cvtColor(colour, cv2.COLOR_RGB2GRAY), (0, 0), 1.2)
    gx, gy = cv2.Sobel(grey, cv2.CV_32F, 1, 0), cv2.Sobel(grey, cv2.CV_32F, 0, 1)
    wash_edge = np.clip(cv2.GaussianBlur(np.hypot(gx, gy), (0, 0), 1.0) * 1.6, 0, 1)
    rim = np.clip((cv2.GaussianBlur(painted, (0, 0), 1.0) - cv2.GaussianBlur(painted, (0, 0), cfg["brush"] * 1.6)) * 2.2, 0, 1) * painted

    # Uneven water: broad areas where the wash went on thicker or thinner, and the grain of the
    # paper, which holds pigment in its hollows.
    pooling = stretch(fbm((h, w), cfg["long"] / 6, rng, 4))
    grain = stretch(fbm((h, w), 3.2, rng, 2), 0.25, 0.75)
    density = 1 + 0.55 * (pooling - 0.5) + 0.32 * (grain - 0.5) + 0.75 * wash_edge + 0.7 * rim
    colour = darken(colour, density)

    # Fine detail the washes lost (struts, rungs, seams), brushed back on as a few darker lines.
    photo_luma = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    lines = cv2.GaussianBlur(photo_luma, (0, 0), cfg["brush"] * 1.4) - cv2.GaussianBlur(photo_luma, (0, 0), 0.9)
    lines = smoothstep(0.035, 0.2, lines) * cfg["lines"] * (0.55 + 0.45 * stretch(fbm((h, w), 9, rng, 2)))
    colour = colour * (1 - lines[..., None]) + (tint * 0.9) * lines[..., None]
    # And the brightest glints, left as bare paper.
    glints = smoothstep(0.05, 0.22, cv2.GaussianBlur(photo_luma, (0, 0), 0.9) - cv2.GaussianBlur(photo_luma, (0, 0), cfg["brush"] * 1.4))
    glints *= smoothstep(0.55, 0.8, photo_luma) * 0.8

    # In light passages the brush skips and the paper shows.
    skipped = smoothstep(0.62, 0.72, fbm((h, w), cfg["long"] / 40, rng, 3)) * smoothstep(0.55, 0.9, luma) * 0.7
    bare = np.clip(np.maximum(glints, skipped), 0, 1)

    sheet = PAPER * (0.99 + 0.02 * grain[..., None])
    coverage = (painted * (1 - bare))[..., None]
    picture = sheet * (1 - coverage) + colour * sheet * coverage

    rgba = np.dstack([np.clip(picture[..., ::-1], 0, 1), paper_alpha])
    ys, xs = np.where(paper_alpha > 0.02)
    rgba = rgba[max(ys.min() - 2, 0) : ys.max() + 3, max(xs.min() - 2, 0) : xs.max() + 3]
    out8 = (rgba * 255 + 0.5).astype(np.uint8)

    out_dir.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(out_dir / f"{name}.webp"), out8, [cv2.IMWRITE_WEBP_QUALITY, 88])
    if preview:
        a = out8[..., 3:].astype(np.float32) / 255
        flat = (out8[..., :3] * a + np.array([214, 213, 210], np.float32) * (1 - a)).astype(np.uint8)
        cv2.imwrite(str(out_dir / f"{name}-preview.jpg"), flat, [cv2.IMWRITE_JPEG_QUALITY, 90])
    print(f"{name}: {out8.shape[1]} x {out8.shape[0]}")


def main():
    args = sys.argv[1:]
    out_dir = HERE.parent / "painted"
    if "--out" in args:
        i = args.index("--out")
        out_dir = Path(args[i + 1])
        del args[i : i + 2]
    preview = "--preview" in args
    names = [a for a in args if not a.startswith("--")] or list(SUBJECTS)
    for name in names:
        paint(name, out_dir, preview)


if __name__ == "__main__":
    main()
