// Writes the drawings that are later repainted as watercolours for the 3D story (see paint.py).
// Usage: node art/moon/apollo-11/scripts/moon-drawings.mjs   (output: ../svg)
//
// These are for the things no Apollo 11 photo shows clearly enough for a child to read: the flag
// (in the photos it is creased and half in shadow), the two experiments (small and far from the
// camera) and the moments nobody photographed from outside, such as the liftoff. Shapes follow
// NASA's deployment photos AS11-40-5948 and 6900966 (seismometer with its two solar panels and
// aerial), the Laser Ranging Retroreflector drawings (a tilted square tray of 100 glass corner
// reflectors, ten by ten) and S69-45002 (the rock box).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "svg");
mkdirSync(out, { recursive: true });

const INK = "#35343a";
const r1 = (n) => Math.round(n * 10) / 10;
const d = (pts) => "M" + pts.map((p) => `${r1(p[0])} ${r1(p[1])}`).join("L") + "z";
const svg = (w, h, defs, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" fill="none" stroke-linejoin="round" stroke-linecap="round">
<defs>${defs}</defs>
${body}
</svg>
`;
const linear = (id, x1, y1, x2, y2, stops) =>
  `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join("")}</linearGradient>`;
const radial = (id, cx, cy, r, stops) =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join("")}</radialGradient>`;

/* The flag: nylon on a gold pole, held out by a rod along its top edge because there is no wind. */
function flagParts() {
  const X0 = 108, W = 344, TOP = 62, H = 184;
  // The rod did not slide out all the way, so the cloth hangs in soft ripples.
  const top = (x) => TOP + 2.5 * Math.sin((x - X0) / 46);
  const drop = (x) => H + 9 * Math.sin((x - X0) / 31 + 0.9) + 5 * Math.sin((x - X0) / 13);
  const at = (x, t) => [x, top(x) + t * drop(x)];
  const band = (x0, x1, t0, t1) => {
    const xs = [];
    for (let x = x0; x < x1; x += 8) xs.push(x);
    xs.push(x1);
    return d([...xs.map((x) => at(x, t0)), ...xs.reverse().map((x) => at(x, t1))]);
  };
  const stripes = Array.from({ length: 13 }, (_, k) => `<path d="${band(X0, X0 + W, k / 13, (k + 1) / 13)}" fill="${k % 2 ? "#f6f2e8" : "#cf3a41"}"/>`).join("");
  const CW = W * 0.4;
  const stars = [];
  for (let row = 0; row < 9; row++) {
    const count = row % 2 ? 5 : 6;
    for (let i = 0; i < count; i++) {
      const [x, y] = at(X0 + (CW * (i + (row % 2 ? 1 : 0.5))) / 6, ((row + 0.5) / 9) * (7 / 13));
      stars.push(`<circle cx="${r1(x)}" cy="${r1(y)}" r="3.6" fill="#f6f2e8"/>`);
    }
  }
  const folds = [0.2, 0.47, 0.72, 0.93].map((f, i) => `<path d="${band(X0 + W * f - 16, X0 + W * f + 16, 0, 1)}" fill="url(#fold)" opacity="${i % 2 ? 0.55 : 0.8}"/>`).join("");
  const defs = linear("fold", 0, 0, 1, 0, [[0, "#1c2440", 0], [0.5, "#1c2440", 0.3], [1, "#1c2440", 0]]) + linear("pole", 0, 0, 1, 0, [[0, "#f1d98a"], [0.5, "#d8ae45"], [1, "#96702a"]]);
  const cloth = `<g stroke="none">${stripes}<path d="${band(X0, X0 + CW, 0, 7 / 13)}" fill="#2f4c8f"/>${stars.join("")}${folds}</g>
<path d="${band(X0, X0 + W, 0, 1)}" stroke="${INK}" stroke-width="2.5"/>`;
  const pole = `<path d="M96 44H${X0 + W + 6}" stroke="${INK}" stroke-width="9"/><path d="M96 44H${X0 + W + 6}" stroke="#e3c467" stroke-width="5"/>
<rect x="89" y="34" width="13" height="716" rx="5" fill="url(#pole)" stroke="${INK}" stroke-width="2.5"/><circle cx="95.500" cy="32" r="8" fill="#e3c467" stroke="${INK}" stroke-width="2.5"/>`;
  return { defs, cloth, pole };
}
function flag() {
  const { defs, cloth, pole } = flagParts();
  return svg(480, 760, defs, cloth + pole);
}
/* The same flag after the liftoff blew it over: lying on the ground, seen a little from above. */
function flagFallen() {
  const { defs, cloth, pole } = flagParts();
  return svg(800, 590, defs, `<g transform="translate(14 468) rotate(-82)">${cloth}${pole}</g>`);
}

/* The Passive Seismic Experiment: a drum that feels moonquakes, two solar panels and an aerial. */
function seismometer() {
  const defs =
    linear("drum", 0, 0, 1, 0, [[0, "#f0c56a"], [0.35, "#d89a3c"], [0.75, "#a9642a"], [1, "#7c4520"]]) +
    linear("cap", 0, 0, 1, 1, [[0, "#f7f5ef"], [1, "#b9bcc0"]]) +
    linear("deck", 0, 0, 0, 1, [[0, "#efede6"], [1, "#c9c8c2"]]) +
    linear("side", 0, 0, 0, 1, [[0, "#a7a8a8"], [1, "#7f8083"]]) +
    linear("cellL", 0, 0, 1, 1, [[0, "#5d83c9"], [1, "#27407f"]]) +
    linear("cellR", 1, 0, 0, 1, [[0, "#476cb4"], [1, "#1c3167"]]);
  // A solar panel: a tilted sheet of cells, four across and three down, in a pale frame.
  const panel = (p, fill) => {
    const [a, b, c, e] = p; // top-left, top-right, bottom-right, bottom-left
    const mix = (u, v, t) => [u[0] + (v[0] - u[0]) * t, u[1] + (v[1] - u[1]) * t];
    let lines = "";
    for (let i = 1; i < 4; i++) lines += `M${mix(a, b, i / 4).map(r1).join(" ")}L${mix(e, c, i / 4).map(r1).join(" ")}`;
    for (let j = 1; j < 3; j++) lines += `M${mix(a, e, j / 3).map(r1).join(" ")}L${mix(b, c, j / 3).map(r1).join(" ")}`;
    return `<path d="${d(p)}" fill="url(#${fill})" stroke="#e9e7df" stroke-width="9"/><path d="${d(p)}" stroke="${INK}" stroke-width="2.5"/><path d="${lines}" stroke="#b9cdf0" stroke-width="2.5" opacity=".85"/>`;
  };
  const body = `
<g stroke="${INK}" stroke-width="2.5">
<path d="M196 386 126 344M704 386 774 344" stroke-width="9" stroke="#8f9092"/>
${panel([[40, 250], [246, 168], [262, 352], [58, 446]], "cellL")}
${panel([[654, 168], [860, 250], [842, 446], [638, 352]], "cellR")}
<path d="${d([[250, 392], [650, 392], [716, 452], [184, 452]])}" fill="url(#deck)"/>
<path d="${d([[184, 452], [716, 452], [716, 486], [184, 486]])}" fill="url(#side)"/>
<path d="M214 486v22M686 486v22M300 486v16M600 486v16" stroke-width="7" stroke="#6f7073"/>
<path d="M362 262V404A88 24 0 0 0 538 404V262z" fill="url(#drum)"/>
<path d="M362 300A88 24 0 0 0 538 300M362 352A88 24 0 0 0 538 352" stroke="#7c4520" stroke-width="3" opacity=".7"/>
<ellipse cx="450" cy="262" rx="88" ry="24" fill="url(#cap)"/>
<ellipse cx="450" cy="256" rx="42" ry="11" fill="#d7d8d6"/>
<path d="M408 256C408 214 492 214 492 256" stroke-width="6" stroke="#8f9092"/>
<path d="${d([[268, 404], [320, 404], [330, 430], [262, 430]])}" fill="#f3f1ea"/>
<path d="${d([[262, 430], [330, 430], [330, 448], [262, 448]])}" fill="#b4b5b6"/>
<circle cx="600" cy="424" r="15" fill="#8f8d86"/><circle cx="600" cy="424" r="6" fill="#d9a441"/>
<path d="M560 400 628 150" stroke-width="8" stroke="#8f9092"/>
<g transform="translate(628 150) rotate(15)"><rect x="-15" y="-96" width="30" height="100" rx="12" fill="#e9e7df"/><path d="M-15 -70h30M-15 -46h30M-15 -22h30" stroke-width="2" opacity=".6"/></g>
</g>`;
  return svg(900, 540, defs, body);
}

/*
 * The laser mirror (Laser Ranging Retroreflector): a tilted tray holding a hundred glass corner
 * reflectors. Each one sends light straight back the way it came. With `beam`, a laser from Earth
 * comes down onto it and goes back up.
 */
function mirror(beam) {
  const defs =
    radial("glassA", 0.36, 0.32, 0.75, [[0, "#f4fdff"], [0.3, "#9fdcf5"], [0.7, "#3f8fd0"], [1, "#17386f"]]) +
    radial("glassB", 0.4, 0.36, 0.75, [[0, "#e6fbff"], [0.3, "#7fcbe9"], [0.7, "#2f73b8"], [1, "#122b5a"]]) +
    radial("glassC", 0.34, 0.3, 0.75, [[0, "#ffffff"], [0.35, "#bfe9f7"], [0.75, "#5aa6dc"], [1, "#1d427c"]]) +
    linear("tray", 0, 0, 1, 1, [[0, "#f4f2ec"], [1, "#c3c4c5"]]) +
    linear("edge", 0, 0, 0, 1, [[0, "#9a9b9d"], [1, "#6f7074"]]) +
    linear("ray", 0, 1, 0, 0, [[0, "#3fe08f", 0.98], [1, "#6ff0ad", 0.9]]) +
    radial("spark", 0.5, 0.5, 0.5, [[0, "#ffffff", 1], [0.3, "#b6ffd9", 0.9], [1, "#3fe08f", 0]]);
  const N = 10, STEP = 36, PAD = 30, SIDE = PAD * 2 + STEP * (N - 1);
  let glass = "";
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const cx = PAD + i * STEP, cy = PAD + j * STEP;
      // Three seams meet at the middle of each reflector, where its three mirror faces join.
      const seams = [90, 210, 330].map((a) => `M${cx} ${cy}L${r1(cx + 13 * Math.cos((a * Math.PI) / 180))} ${r1(cy - 13 * Math.sin((a * Math.PI) / 180))}`).join("");
      glass += `<circle cx="${cx}" cy="${cy}" r="14.500" fill="url(#glass${"ABC"[(i * 2 + j * 3) % 3]})" stroke="#2a2f3a" stroke-width="2.5"/><path d="${seams}" stroke="#ffffff" stroke-width="1.6" opacity=".7"/><circle cx="${cx - 5}" cy="${cy - 5.500}" r="2.800" fill="#ffffff" stroke="none"/>`;
    }
  const lift = beam ? 760 : 0;
  // The tray leans back to face the Earth: drawn square, then slanted.
  const slant = `translate(${150} ${lift + 70}) skewX(-17) scale(1 0.8)`;
  const hit = [150 + SIDE * 0.5 - Math.tan((17 * Math.PI) / 180) * SIDE * 0.4, lift + 70 + SIDE * 0.4];
  const rays = beam
    ? `<path d="${d([[hit[0] - 11, hit[1]], [hit[0] + 11, hit[1]], [hit[0] + 140, 0], [hit[0] + 122, 0]])}" fill="url(#ray)"/>
<circle cx="${r1(hit[0])}" cy="${r1(hit[1])}" r="120" fill="url(#spark)"/>`
    : "";
  const body = `
<g stroke="${INK}" stroke-width="2.5">
<path d="M196 ${lift + 96} 132 ${lift + 430}M560 ${lift + 96} 600 ${lift + 430}" stroke-width="10" stroke="#8f9092"/>
<path d="${d([[70, lift + 396], [520, lift + 396], [600, lift + 446], [40, lift + 446]])}" fill="url(#tray)"/>
<path d="${d([[40, lift + 446], [600, lift + 446], [600, lift + 474], [40, lift + 474]])}" fill="url(#edge)"/>
<g transform="${slant}">
<path d="M0 ${SIDE}h${SIDE}l22 24h-${SIDE}z" fill="url(#edge)"/>
<path d="M${SIDE} 0v${SIDE}l22 24v-${SIDE}z" fill="#85868a"/>
<rect width="${SIDE}" height="${SIDE}" rx="6" fill="url(#tray)"/>
<rect x="10" y="10" width="${SIDE - 20}" height="${SIDE - 20}" rx="4" fill="#d3d4d3" stroke-width="1.5"/>
${glass}
</g>
</g>
${rays}`;
  return svg(700, lift + 500, defs, body);
}

/* The rock box: an aluminium case, open, full of the Moon rocks that went home. */
function rockBox() {
  const defs =
    linear("front", 0, 0, 0, 1, [[0, "#eef0f1"], [1, "#b3b7bb"]]) +
    linear("flank", 0, 0, 1, 1, [[0, "#b9bdc1"], [1, "#84888d"]]) +
    linear("lid", 0, 0, 0, 1, [[0, "#d9dcde"], [1, "#f4f5f5"]]) +
    linear("rockA", 0, 0, 1, 1, [[0, "#b9b2a6"], [1, "#6f6a63"]]) +
    linear("rockB", 0, 0, 1, 1, [[0, "#9a948c"], [1, "#55514d"]]) +
    linear("rockC", 0, 0, 1, 1, [[0, "#cdc5b6"], [1, "#857d70"]]);
  // A rock: a lumpy outline with one lit face and one face in shadow.
  const rock = (x, y, s, fill) =>
    `<g transform="translate(${x} ${y}) scale(${s})"><path d="${d([[0, 40], [14, 8], [46, -6], [86, 4], [104, 34], [92, 62], [30, 66]])}" fill="url(#${fill})"/><path d="${d([[14, 8], [46, -6], [58, 26], [30, 34]])}" fill="#ffffff" opacity=".28" stroke="none"/><path d="${d([[58, 26], [104, 34], [92, 62], [52, 64]])}" fill="#22232a" opacity=".22" stroke="none"/><path d="M30 34 58 26 52 64" stroke-width="1.5" opacity=".6"/></g>`;
  const body = `
<g stroke="${INK}" stroke-width="2.5">
<path d="${d([[212, 214], [612, 214], [634, 46], [234, 46]])}" fill="url(#lid)"/>
<path d="M260 190 280 70M330 190 348 70M400 190 416 70M470 190 484 70M540 190 552 70" stroke-width="2" opacity=".35"/>
<path d="${d([[120, 268], [520, 268], [612, 214], [212, 214]])}" fill="#3b3d44"/>
${rock(250, 196, 1.15, "rockB")}${rock(390, 190, 1.3, "rockA")}${rock(176, 222, 1.05, "rockC")}${rock(318, 216, 1.25, "rockC")}${rock(430, 226, 0.95, "rockB")}
<path d="${d([[120, 268], [520, 268], [520, 410], [120, 410]])}" fill="url(#front)"/>
<path d="${d([[520, 268], [612, 214], [612, 352], [520, 410]])}" fill="url(#flank)"/>
<path d="M120 300H520M120 378H520" stroke-width="2" opacity=".4"/>
<rect x="176" y="286" width="46" height="62" rx="6" fill="#8f9398"/><rect x="418" y="286" width="46" height="62" rx="6" fill="#8f9398"/>
<path d="M270 330h100" stroke-width="12" stroke="#7b7f84"/><path d="M270 330h100" stroke-width="6" stroke="#d5d8da"/>
${rock(560, 390, 0.9, "rockA")}${rock(40, 384, 0.7, "rockB")}
</g>`;
  return svg(720, 470, defs, body);
}

/* Liftoff: the top half of the lander (the existing drawing) rising on the blast of its engine. */
function liftoff() {
  const ascent = readFileSync(join(out, "eagle-ascent.svg"), "utf8").replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").replace(/<defs>.*?<\/defs>/s, "").replace(/<ellipse[^>]*fill="url\(#s\)"\/>/, "");
  const defs = linear("blast", 0, 0, 0, 1, [[0, "#fff6c9", 0.95], [0.3, "#ffd27a", 0.8], [0.7, "#f2a65a", 0.4], [1, "#f2a65a", 0]]) + linear("core", 0, 0, 0, 1, [[0, "#ffffff", 1], [0.6, "#fff1b8", 0.6], [1, "#fff1b8", 0]]);
  const body = `<path d="${d([[262, 428], [338, 428], [430, 760], [170, 760]])}" fill="url(#blast)"/>
<path d="${d([[280, 428], [320, 428], [352, 660], [248, 660]])}" fill="url(#core)"/>
${ascent}`;
  return svg(600, 770, defs, body);
}

const drawings = { "flag-planted": flag(), "flag-fallen": flagFallen(), seismometer: seismometer(), "laser-mirror": mirror(false), "laser-mirror-beam": mirror(true), "rock-box": rockBox(), liftoff: liftoff() };
for (const [name, text] of Object.entries(drawings)) {
  writeFileSync(join(out, `${name}.svg`), text);
  console.log(`${name}.svg`);
}
