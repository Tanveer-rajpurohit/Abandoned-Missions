// Writes the Moon cutout SVGs and their contact sheet.
// Usage: node art/moon/apollo-11/scripts/moon-assets.mjs   (output: ../svg)
//
// The drawings are plain vector shapes with no filters, so they render the same in every
// viewer and at every size; paint and fade effects belong to the scene's shader.
// Hardware is drawn in front elevation at 80 px per metre from the NSSDCA figures for
// Apollo 11 (1969-059C): descent stage 4.2 m across and 1.7 m thick, standing 1.5 m off the
// ground, footpads 9.4 m apart, engine skirt 1 m long; ascent stage 2.8 m high and 4.3 m wide.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "svg");
mkdirSync(out, { recursive: true });

const INK = "#35343a", GOLD = "#cfa44a", GOLD_D = "#a8802f", AMBER = "#c47a35", FOIL = "#2d2d32";
const GREY = "#b9bab8", GREY_L = "#e2e2de", GREY_D = "#8c8e8f", DUST = "#a9a7a1";

const d = (pts) => "M" + pts.map((p) => p.join(" ")).join("L") + "z";
const flip = (pts, cx) => pts.map(([x, y]) => [2 * cx - x, y]);

/** One drawing: an optional soft ground shadow, outlined shapes, then fine details. */
function svg(w, h, { shadow, shapes, details = "" }) {
  const sh = shadow
    ? `<defs><radialGradient id="s"><stop offset="0" stop-color="#1d1d22" stop-opacity=".42"/><stop offset="1" stop-color="#1d1d22" stop-opacity="0"/></radialGradient></defs>
<ellipse cx="${shadow[0]}" cy="${shadow[1]}" rx="${shadow[2]}" ry="${shadow[3]}" fill="url(#s)"/>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" fill="none" stroke-linejoin="round" stroke-linecap="round">
${sh}
<g stroke="${INK}" stroke-width="2">${shapes}</g>
<g stroke="${INK}" stroke-width="1.5">${details}</g>
</svg>
`;
}

function descent() {
  // Ground at y 520, stage from y 400 up to y 264, centre line x 450.
  const left = [[282, 272], [380, 264], [380, 400], [282, 392]];
  const pad = (x, y, rx) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${rx * 0.28}" fill="#c4b27c"/><ellipse cx="${x}" cy="${y - 4}" rx="${rx * 0.72}" ry="${rx * 0.17}" fill="#a8975f"/>`;
  const sideLeg = (s) => {
    const X = (x) => 450 + s * (x - 450);
    return `<path d="M${X(282)} 300 ${X(120)} 506" stroke-width="13" stroke="#8f8c82"/><path d="M${X(282)} 300 ${X(206)} 396" stroke-width="17" stroke="${GOLD}"/>
<path d="M${X(282)} 388 ${X(186)} 424M${X(282)} 276 ${X(232)} 364" stroke-width="5" stroke="#a3a096"/>${pad(X(112), 512, 38)}`;
  };
  const rungs = Array.from({ length: 9 }, (_, i) => `M432 ${306 + i * 20}h36`).join("");
  return svg(900, 560, {
    shadow: [450, 522, 410, 26],
    shapes: `
${sideLeg(1)}${sideLeg(-1)}
<path d="${d([[414, 400], [486, 400], [516, 480], [384, 480]])}" fill="#56565c"/>
<path d="${d([[430, 440], [470, 440], [516, 480], [384, 480]])}" fill="#3a3a40" stroke="none"/>
<path d="${d(left)}" fill="${GOLD}"/>
<path d="${d(flip(left, 450))}" fill="${GOLD_D}"/>
<path d="${d([[380, 264], [520, 264], [520, 400], [380, 400]])}" fill="${FOIL}"/>
<path d="${d([[380, 264], [520, 264], [520, 306], [380, 306]])}" fill="${AMBER}"/>
<path d="${d([[282, 272], [380, 264], [380, 306], [282, 312]])}" fill="#e0bd66"/>
<path d="${d(flip([[282, 272], [380, 264], [380, 306], [282, 312]], 450))}" fill="#b98e3a"/>
<path d="${d([[270, 256], [380, 246], [520, 246], [630, 256], [618, 272], [520, 264], [380, 264], [282, 272]])}" fill="#d8d2bf"/>
<path d="${d([[296, 322], [366, 318], [366, 378], [296, 380]])}" fill="${GREY_L}"/>
<path d="M392 398 450 440 508 398" stroke-width="5" stroke="#a3a096"/>
<path d="M450 286V506" stroke-width="13" stroke="#8f8c82"/>
<path d="M450 286v96" stroke-width="17" stroke="${GOLD}"/>
${pad(450, 514, 52)}
<path d="${d([[410, 256], [490, 256], [498, 286], [402, 286]])}" fill="#c9c6bc"/>`,
    details: `
<path d="M432 290v186M468 290v186${rungs}" stroke-width="2.5" stroke="#d9d7d0"/>
<rect x="436" y="328" width="28" height="18" fill="#e4e5e3"/>
<path d="M441 334h18M441 340h18" stroke-width="1" opacity=".6"/>
<path d="M296 342h70M331 320v60M282 312l98-6M520 306l98 6" opacity=".55"/>`,
  });
}

function ascent() {
  // Base at y 410, body top at y 186, centre line x 300.
  const bulge = [[200, 292], [142, 304], [128, 356], [148, 398], [212, 404]];
  const facet = [[200, 290], [226, 214], [258, 230], [250, 300]];
  const win = [[228, 242], [270, 234], [254, 278]];
  const quad = (s) => {
    const X = (x) => 300 + s * (x - 300);
    return `<path d="M${X(200)} 300H${X(108)}" stroke-width="6" stroke="${GREY_D}"/>
<path d="${d([[X(78), 281], [X(108), 281], [X(108), 311], [X(78), 311]])}" fill="#6d6e72"/>
<path d="${d([[X(93), 281], [X(85), 264], [X(101), 264]])}${d([[X(93), 311], [X(85), 328], [X(101), 328]])}${d([[X(78), 296], [X(61), 288], [X(61), 304]])}" fill="#4a4b4f"/>`;
  };
  return svg(600, 440, {
    shapes: `
${quad(1)}${quad(-1)}
<path d="${d(bulge)}" fill="#a9abab"/>
<path d="${d(flip(bulge, 300))}" fill="#868889"/>
<path d="${d([[212, 404], [200, 290], [226, 214], [300, 190], [374, 214], [400, 290], [388, 404]])}" fill="${GREY}"/>
<path d="${d(facet)}" fill="${GREY_L}"/>
<path d="${d(flip(facet, 300))}" fill="${GREY_D}"/>
<path d="${d([[226, 214], [300, 190], [374, 214], [342, 230], [258, 230]])}" fill="#d3d4d1"/>
<path d="${d([[212, 372], [388, 372], [388, 404], [212, 404]])}" fill="${AMBER}"/>
<path d="M264 172h72v20h-72z" fill="${GREY_D}"/><ellipse cx="300" cy="172" rx="36" ry="8" fill="#cfd0cd"/>
<path d="M262 208 244 152M392 224 446 152M322 176l6-64M350 182l10-58" stroke-width="5" stroke="#77787b"/>
<ellipse cx="238" cy="136" rx="26" ry="22" fill="${GREY_L}" transform="rotate(-16 238 136)"/>
<ellipse cx="458" cy="132" rx="30" ry="25" fill="${GREY_L}" transform="rotate(22 458 132)"/>
<path d="${d(win)}${d(flip(win, 300))}" fill="#23262c"/>
<rect x="268" y="304" width="64" height="64" rx="6" fill="#939595"/>
<path d="${d([[268, 404], [332, 404], [340, 428], [260, 428]])}" fill="#4b4b50"/>`,
    details: `
<ellipse cx="241" cy="137" rx="11" ry="9" transform="rotate(-16 241 137)"/>
<ellipse cx="455" cy="133" rx="13" ry="11" transform="rotate(22 455 133)"/>
<path d="M286 336h28" stroke-width="3"/>
<path d="M250 300h100M142 304l58 40M458 304l-58 40" opacity=".55"/>
<path d="M318 112h20M354 124h12" stroke-width="3"/>`,
  });
}

function flag() {
  // The flag as flown: 13 stripes, a canton seven stripes deep, 50 stars in nine staggered rows,
  // held out by a horizontal rod because there is no wind on the Moon.
  const X0 = 62, Y0 = 30, W = 196, SH = 10, CW = 78;
  const stripes = Array.from({ length: 13 }, (_, i) => `<path d="M${i < 7 ? X0 + CW : X0} ${Y0 + i * SH}H${X0 + W}v${SH}H${i < 7 ? X0 + CW : X0}z" fill="${i % 2 ? "#f0ece3" : "#b8453d"}" stroke="none"/>`).join("");
  const stars = Array.from({ length: 9 }, (_, r) => Array.from({ length: r % 2 ? 5 : 6 }, (_, c) =>
    `<circle cx="${X0 + (r % 2 ? 13 : 6.5) + c * 13}" cy="${Y0 + 7 + r * 7}" r="1.8"/>`).join("")).join("");
  return svg(300, 420, {
    shadow: [64, 406, 56, 8],
    shapes: `<path d="M60 404V24h200" stroke-width="5" stroke="#bfbdb6"/>
${stripes}<path d="M${X0} ${Y0}h${CW}v${SH * 7}h-${CW}z" fill="#31507f" stroke="none"/>
<path d="M${X0} ${Y0}h${W}v${SH * 13}h-${W}z"/>`,
    details: `<g fill="#f0ece3" stroke="none">${stars}</g>`,
  });
}

function easep() {
  // Passive seismometer package: square base, two canted solar panels facing east and west, antenna mast.
  const panel = [[40, 150], [170, 90], [180, 186], [50, 246]];
  const cells = (s) => { const X = (x) => 260 + s * (x - 260); return [1, 2, 3].map((i) => `M${X(40 + i * 32.5)} ${150 - i * 15}L${X(50 + i * 32.5)} ${246 - i * 15}`).join("") + `M${X(45)} 198L${X(175)} 138`; };
  return svg(520, 320, {
    shadow: [260, 292, 230, 14],
    shapes: `
<path d="M180 150 216 200M340 150 304 200" stroke-width="6" stroke="${GREY_D}"/>
<path d="${d(panel)}" fill="#33558c"/>
<path d="${d(flip(panel, 260))}" fill="#27436f"/>
<path d="${d([[170, 212], [350, 212], [376, 290], [144, 290]])}" fill="#d6d5d0"/>
<path d="${d([[170, 212], [350, 212], [358, 236], [162, 236]])}" fill="#ecebe6"/>
<rect x="196" y="168" width="92" height="56" rx="6" fill="#f0ece3"/>
<circle cx="324" cy="250" r="14" fill="#8f8d86"/>
<path d="M260 168V60" stroke-width="6" stroke="#77787b"/>
<rect x="249" y="18" width="22" height="62" rx="7" fill="#c4c2ba"/>`,
    details: `<path d="${cells(1)}${cells(-1)}" stroke="#b9c9e6" stroke-width="1.5"/>`,
  });
}

function lrrr() {
  // Laser ranging retroreflector: 100 fused-silica corner cubes in a 10 x 10 grid, tilted to face Earth.
  const cubes = Array.from({ length: 100 }, (_, i) => `<circle cx="${128 + (i % 10) * 20.5 - Math.floor(i / 10) * 4}" cy="${60 + Math.floor(i / 10) * 18}" r="6"/>`).join("");
  return svg(400, 300, {
    shadow: [200, 278, 190, 12],
    shapes: `<path d="${d([[60, 250], [340, 250], [324, 276], [76, 276]])}" fill="#8f8d86"/>
<path d="${d([[70, 242], [110, 40], [338, 40], [308, 242]])}" fill="#dddcd7"/>
<path d="${d([[338, 40], [360, 66], [330, 256], [308, 242]])}" fill="${GREY_D}"/>`,
    details: `<g fill="#23262b" stroke="#86b6cf">${cubes}</g>`,
  });
}

/** A rock in three planes: lit top, mid face, shadow face. `top` and `split` are indexes into the outline. */
function rock(pts, ridge) {
  return svg(320, 220, {
    shadow: [166, 192, 160, 14],
    shapes: `<path d="${d(pts)}" fill="${DUST}"/>
<path d="${d([pts[0], pts[1], ...ridge.slice(0, 2)])}" fill="#6f6d6b" stroke="none"/>
<path d="${d([...pts.slice(1, -2), ...ridge.slice().reverse()])}" fill="#dcdad3" stroke="none"/>
<path d="${d(pts)}"/>`,
    details: `<path d="M${ridge.map((p) => p.join(" ")).join("L")}" opacity=".5"/>`,
  });
}

/** A crater from straight above; it is laid flat on the ground in the scene. Sunlight comes from the top. */
function crater(size) {
  const c = size / 2, R = c * 0.9, r = R * 0.78;
  return svg(size, size, {
    shapes: `<circle cx="${c}" cy="${c}" r="${R}" fill="#d9d7d0"/>
<circle cx="${c}" cy="${c}" r="${r}" fill="#a3a19b"/>
<path d="M${c - r} ${c}a${r} ${r} 0 0 1 ${r * 2} 0q-${r} -${r * 0.8} -${r * 2} 0z" fill="#5c5c61" stroke="none"/>
<path d="M${c - r} ${c}a${r} ${r} 0 0 0 ${r * 2} 0q-${r} ${r * 0.62} -${r * 2} 0z" fill="#c2c0b9" stroke="none"/>
<circle cx="${c}" cy="${c}" r="${r}"/>`,
  });
}

function bootprints() {
  // A trail walking up the picture, from above. An Apollo boot sole was about 33 cm long with straight treads.
  const step = (i) => `translate(${i % 2 ? 118 : 42} ${500 - i * 86}) rotate(${i % 2 ? 6 : -6})`;
  const idx = [0, 1, 2, 3, 4, 5];
  return svg(200, 600, {
    shapes: idx.map((i) => `<rect transform="${step(i)}" width="40" height="78" rx="18" fill="#7b7973"/>`).join(""),
    details: idx.map((i) => `<path transform="${step(i)}" d="${[12, 21, 30, 39, 48, 57, 66].map((t) => `M7 ${t}h26`).join("")}" stroke="#d6d4cd" stroke-width="3.4"/>`).join(""),
  });
}

function mountains() {
  // Lunar hills are old and worn round: three ridges, paler with distance.
  const ridge = (y, amp, n, phase) => {
    let p = `M0 420V${y}`;
    for (let i = 0; i < n; i++) { const w = 2400 / n, x = i * w, a = amp * (0.55 + 0.45 * Math.sin(i * 1.7 + phase)); p += `Q${x + w / 2} ${y - a * 2} ${x + w} ${y}`; }
    return p + "V420z";
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2400 420" width="2400" height="420">
<path d="${ridge(200, 62, 5, 0.4)}" fill="#d3d2cd"/>
<path d="${ridge(262, 50, 7, 2.1)}" fill="#bcbbb5"/>
<path d="${ridge(326, 40, 9, 4.0)}" fill="#a5a39d"/>
</svg>
`;
}

function earth() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300" fill="none" stroke-linecap="round">
<clipPath id="disc"><circle cx="150" cy="150" r="118"/></clipPath>
<g clip-path="url(#disc)"><circle cx="150" cy="150" r="118" fill="#2f5f96"/>
<path d="M70 80c30-20 70-10 80 20s-10 50-30 70-10 50-40 40-50-60-40-90 10-30 30-40zM190 150c20-10 50 0 60 30s-20 60-40 50-40-60-20-80z" fill="#6f9160"/>
<path d="M30 120c60-20 120 10 240-20M40 200c80-30 150 20 230-10M90 50c40 10 90-10 130 10" stroke="#f3f1ea" stroke-width="15" opacity=".9"/>
<path d="M150 32a118 118 0 0 1 0 236a166 166 0 0 0 0-236z" fill="#0c0e14" opacity=".62"/></g>
<circle cx="150" cy="150" r="118" stroke="${INK}" stroke-width="2"/>
</svg>
`;
}

const files = {
  "eagle-descent.svg": descent(),
  "eagle-ascent.svg": ascent(),
  "flag.svg": flag(),
  "easep-seismometer.svg": easep(),
  "lrrr-retroreflector.svg": lrrr(),
  "rock-1.svg": rock([[26, 190], [46, 104], [108, 44], [204, 34], [270, 96], [292, 190]], [[120, 190], [132, 112], [270, 96]]),
  "rock-2.svg": rock([[40, 190], [34, 130], [90, 78], [170, 92], [250, 60], [296, 130], [284, 190]], [[110, 190], [118, 136], [296, 130]]),
  "rock-3.svg": rock([[70, 190], [84, 138], [140, 108], [214, 118], [250, 160], [256, 190]], [[130, 190], [140, 150], [250, 160]]),
  "crater-large.svg": crater(700),
  "crater-small.svg": crater(360),
  "bootprints.svg": bootprints(),
  "mountains.svg": mountains(),
  "earth.svg": earth(),
};
for (const [name, text] of Object.entries(files)) writeFileSync(join(out, name), text);

// A plain contact sheet: each drawing on the paper tone and on the night tone.
const cards = Object.keys(files).map((n) => `<figure><div><img src="${n}" alt=""><img class="night" src="${n}" alt=""></div><figcaption>${n}</figcaption></figure>`).join("\n");
writeFileSync(join(out, "index.html"), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Moon assets</title>
<style>
body{margin:0;padding:32px 16px;background:#e6e5e0;color:#1c1c1e;font:14px/1.4 ui-monospace,Consolas,monospace}
nav{max-width:1400px;margin:0 auto 24px}
main{max-width:1400px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:24px}
figure{margin:0;padding:16px;background:#f1f0ec;border:1px solid #c9c7c2}
figure div{display:grid;grid-template-columns:1fr 1fr;gap:8px}
img{display:block;width:100%;height:240px;object-fit:contain;padding:8px;box-sizing:border-box}
img.night{background:#262a33}
figcaption{margin-top:12px}
a{color:inherit}
</style></head><body>
<main>
${cards}
</main></body></html>
`);
console.log(Object.keys(files).length + " svgs + index.html written to " + out);
