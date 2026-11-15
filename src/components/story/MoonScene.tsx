"use client";

import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

/**
 * Phones and tablets get a lighter scene: a terrain with a quarter of the vertices (1 MB
 * instead of 2 MB, both quantised and meshopt-compressed), no brush, no multisampling and
 * fewer pixels.
 * This module only ever runs in the browser, but the guard keeps it safe to import anywhere.
 */
const IS_LITE = typeof window !== "undefined" && window.matchMedia("(max-width: 820px), (pointer: coarse)").matches;
const TERRAIN = IS_LITE ? "/assets/moon/3d/tranquility-base.lite.glb" : "/assets/moon/3d/tranquility-base.glb";
const MAX_PIXEL_RATIO = IS_LITE ? 1.25 : 1.75;
const HEIGHTS = "/assets/moon/3d/tranquility-base.heights.json";
const SOIL = "/assets/moon/apollo-11/real/regolith.jpg";

/** What the story tells the scene each frame. */
export interface StageState {
  /** Story progress, 0 to 1. */
  p: number;
  /** Which side the words are on, -1 left to 1 right. The subject is framed on the other side. */
  side: number;
}

/** A flat picture standing in the scene. Positions are metres; `at` is story progress 0 to 1. */
export interface Card {
  key: string;
  src: string;
  at: number;
  /** Distance from the camera lane, in metres (larger is farther away). */
  depth: number;
  height: number;
  /** Width divided by height of the picture. */
  aspect: number;
  /** Metres above the ground. Used for things in the sky. */
  lift?: number;
  /** Degrees the card leans back, for pictures of the ground itself. */
  lean?: number;
  /** Hangs in the sky and travels with the camera, like something very far away. */
  isInSky?: boolean;
  /** Where the first dab of paint lands, as fractions of the picture from its bottom left. */
  dab?: [number, number];
}

interface HeightMap {
  x0: number;
  z0: number;
  step: number;
  rows: number[][];
}

/** Where the camera lane starts and how far it runs, in metres. */
const TRAVEL_START = -70;
const TRAVEL = 140;
export const laneX = (at: number) => TRAVEL_START + at * TRAVEL;

/** How long a picture takes to paint itself in. Short: a hint of the brush, not a show. */
const CARD_PAINT_SECONDS = 1.8;
/** How many pictures can throw a shadow on the ground. */
const MAX_SHADOWS = 10;

const CAMERA_Z = 4;
const EYE_HEIGHT = 2.3;

/*
 * The Moon at night: one grey for the soil and a dark haze it fades into at the horizon. The haze
 * matches the bottom of the page's sky gradient (#333335), so the land meets the sky without a seam.
 */
const HAZE = new THREE.Vector3(0.2, 0.2, 0.208);
/** Lunar soil is a neutral, very slightly warm grey (Apollo 11 colour-chart photos). */
const SOIL_TINT = new THREE.Vector3(1.0, 0.98, 0.95);
/** The pictures sit a step below full brightness so they belong to the night rather than glow on it. */
const PAPER = new THREE.Vector3(0.8, 0.8, 0.82);

const STAR_COUNT = IS_LITE ? 2200 : 4500;
/** Extra faint stars crowded along one band across the sky, like the Milky Way. */
const BAND_COUNT = IS_LITE ? 1800 : 4200;
const STAR_RADIUS = 800;
/** How far the camera leans toward the pointer, in metres; barely there, a sense of depth only. */
const LOOK_SHIFT = 0.1;

/*
 * The pointer is a brush. Only on devices with a real hover pointer: on a phone a finger is
 * scrolling, and the paint simulation is the most expensive thing on the page.
 */
const HAS_BRUSH = typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches && !IS_LITE;
/** The strip of ground the model covers, in metres. The paint map is stretched over it. */
const LAND = { x0: -110, width: 220, z0: 6, depth: 64 };
const PAINT_WIDTH = 2048;
const PAINT_HEIGHT = Math.round((PAINT_WIDTH * LAND.depth) / LAND.width);
/** Half the width of the brush, in CSS pixels. */
const STROKE_RADIUS = 20;
/** How long a stroke lives: it holds for about half of this, then fades back. */
const STROKE_SECONDS = 6;
/** How long fresh paint stays wet and keeps creeping into the ground beside it. */
const WET_SECONDS = 1.2;
const MAX_DABS = 8;
/** How misty the land is where the brush has not been; it brings back full contrast. Kept small. */
const REST_MIST = 0.3;
/** Seconds for the camera to settle after the pointer stops; long, so a fast flick still glides. */
const LOOK_EASE = 1.4;
/** How far off centre the subject is framed on a wide screen, in metres. */
const FRAME_OFFSET = 3.2;
/*
 * The Earth hangs at a fixed place on screen, like anything infinitely far away: walking, the
 * camera swinging between chapters and the pointer never move it. Above the words and clear of
 * both text columns on a wide screen; tucked into the top right corner on a phone. Positions are
 * screen coordinates (-1 to 1); scale is of the card's 8 m.
 */
const EARTH_WIDE = { at: [0.2, 0.7], scale: 0.75 } as const;
const EARTH_PHONE = { at: [0.62, 0.86], scale: 0.42 } as const;
/**
 * The Sun as seen from the Earth's disc. On 20 July 1969 the Moon was six days past new, so from
 * Tranquility Base the Earth was a waning gibbous, about three quarters lit, as in the Apollo 11
 * Earthrise photos. The Sun in this scene is low on the left, so the lit side faces left.
 */
const EARTH_LIGHT = new THREE.Vector3(-0.85, 0.15, 0.5).normalize();
/** Terrain sizes in bytes, for the loading bar when the server sends no Content-Length. */
const TERRAIN_BYTES = IS_LITE ? 983_804 : 1_994_180;

const NOISE = /* glsl */ `
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}
`;

/* How much of the haze colour covers the land at a distance, so the far ground pales into the sky. */
const HAZE_GLSL = /* glsl */ `
float hazeAt(float dist) {
  return 0.62 * smoothstep(10.0, 70.0, dist) + 0.26 * smoothstep(70.0, 400.0, dist);
}
`;

const QUAD_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

/*
 * The brush's paint, simulated on the GPU. Each texel holds how much paint is there (r, which
 * runs down over STROKE_SECONDS) and how wet it is (g, which runs out much sooner). Wet paint
 * creeps along a slowly turning current and bleeds a little into the ground beside it, so a stroke
 * keeps spreading for a moment after the pointer has passed. Dabs are laid along the pointer's
 * path, with bristles that carry different amounts of paint.
 */
const SIM_FRAG = /* glsl */ `
${NOISE}
uniform sampler2D uPrev;
uniform vec2 uSize;
uniform float uDt;
uniform float uTime;
uniform int uCount;
uniform vec4 uFrom[${MAX_DABS}];
uniform vec4 uBrush[${MAX_DABS}];
varying vec2 vUv;

// from.xy to from.zw is the dab's path in texels; brush is radius, stretch, bristles, seed.
float dab(vec2 p, vec4 from, vec4 brush) {
  vec2 a = vec2(from.x, from.y / brush.y);
  vec2 b = vec2(from.z, from.w / brush.y);
  vec2 s = vec2(p.x, p.y / brush.y);
  vec2 ab = b - a + vec2(1e-3, 0.0);
  float t = clamp(dot(s - a, ab) / dot(ab, ab), 0.0, 1.0);
  vec2 off = (s - a - ab * t) / brush.x;
  vec2 side = normalize(vec2(-ab.y, ab.x));
  float edge = length(off) + (fbm(p * 0.06 + brush.w) - 0.5) * 0.55;
  float body = 1.0 - smoothstep(0.62, 1.0, edge);
  float bristle = smoothstep(0.15, 0.75, noise(vec2(dot(off, side) * 6.5 + brush.w, brush.w * 3.1)));
  return body * mix(1.0, 0.68 + 0.32 * bristle, brush.z);
}

void main() {
  vec2 px = 1.0 / uSize;
  vec2 cell = vUv * uSize;
  vec2 paint = texture2D(uPrev, vUv).rg;
  vec2 current = vec2(fbm(cell * 0.012 + uTime * 0.18), fbm(cell * 0.012 + 7.3 - uTime * 0.15)) - 0.5;
  vec2 carried = texture2D(uPrev, vUv - current * px * 3.0).rg;
  paint = max(paint, carried * vec2(0.985, 0.9) * step(0.05, carried.g));

  vec2 n = max(max(texture2D(uPrev, vUv + vec2(px.x, 0.0)).rg, texture2D(uPrev, vUv - vec2(px.x, 0.0)).rg),
               max(texture2D(uPrev, vUv + vec2(0.0, px.y)).rg, texture2D(uPrev, vUv - vec2(0.0, px.y)).rg));
  float channel = smoothstep(0.3, 0.7, fbm(cell * 0.035 + 2.7));
  float chance = hash(cell + fract(uTime * 7.31) * 97.0);
  float bleeds = step(chance, n.g * channel * 0.22 * uDt * 60.0);
  paint = max(paint, bleeds * vec2(n.r * 0.975, n.g * 0.86));

  paint -= vec2(uDt / ${STROKE_SECONDS.toFixed(1)}, uDt / ${WET_SECONDS.toFixed(1)});
  for (int i = 0; i < ${MAX_DABS}; i++) {
    if (i >= uCount) break;
    paint = max(paint, vec2(dab(cell, uFrom[i], uBrush[i])));
  }
  gl_FragColor = vec4(max(paint, 0.0), 0.0, 1.0);
}`;

const GROUND_VERT = /* glsl */ `
varying vec3 vWorld;
varying vec3 vNormal;
varying vec3 vTone;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vNormal = normalize(mat3(modelMatrix) * normal);
  vTone = color.rgb;
  gl_Position = projectionMatrix * viewMatrix * world;
}`;

/*
 * The Moon's surface as it looks in the Apollo photographs. Real lunar soil (an Apollo 11
 * surface photo) is laid over the model from above and, on steep faces, from the side, with two
 * offset copies swapped by noise so the tile never shows, and a larger copy taking over in the
 * distance. Light follows the Lommel-Seeliger law that fits regolith: the ground looks evenly
 * lit whichever way you face it, slopes turned to the low Sun glow, slopes turned away fall into
 * shadow that is almost black, because there is no air to scatter light into it.
 *
 * Where the pointer has brushed, uPaint lifts a light mist off the land for a few seconds.
 */
const GROUND_FRAG = /* glsl */ `
#define MAX_SHADOWS ${MAX_SHADOWS}
${NOISE}
${HAZE_GLSL}
uniform sampler2D uSoil;
uniform sampler2D uPaint;
uniform vec4 uLand;
uniform float uTime;
uniform vec3 uHaze;
uniform vec3 uTint;
uniform vec3 uSun;
uniform vec4 uShadow[MAX_SHADOWS];
uniform float uShadowInk[MAX_SHADOWS];
varying vec3 vWorld;
varying vec3 vNormal;
varying vec3 vTone;
void main() {
  vec3 normal = normalize(vNormal);
  float dist = distance(vWorld, cameraPosition);
  vec3 toEye = normalize(cameraPosition - vWorld);

  vec3 w = pow(abs(normal), vec3(4.0));
  w /= w.x + w.y + w.z;
  vec3 at = vWorld * 0.29;
  float level = mix(texture2D(uSoil, at.xz).r, texture2D(uSoil, at.zx * 0.83 + vec2(0.37, 0.61)).r, smoothstep(0.35, 0.65, noise(vWorld.xz * 0.11)));
  float fine = level * w.y + texture2D(uSoil, at.xy).r * w.z + texture2D(uSoil, at.zy).r * w.x;
  float broad = texture2D(uSoil, mat2(0.8, -0.6, 0.6, 0.8) * vWorld.xz * 0.071 + 3.7).r;
  float grain = mix(fine * 0.7 + broad * 0.3, broad, smoothstep(6.0, 30.0, dist)) / 0.48;
  // Broad patches of brighter and darker soil, as fresh and old ground lie side by side.
  float patches = 0.84 + 0.32 * fbm(vWorld.xz * 0.025 + 9.1);

  float mu0 = max(dot(normal, uSun), 0.0);
  float mu = max(dot(normal, toEye), 0.05);
  float light = 2.0 * mu0 / (mu0 + mu);
  float tone = dot(vTone, vec3(0.299, 0.587, 0.114));
  vec3 col = uTint * tone * grain * patches * (0.03 + 0.6 * light);

  // Each standing picture throws a soft shadow away from the Sun: dark at its foot, thinning
  // out along its length. uShadow is the foot (x, z), half the picture's width and the length.
  vec2 away = normalize(-uSun.xz);
  float shade = 0.0;
  for (int i = 0; i < MAX_SHADOWS; i++) {
    vec2 d = vWorld.xz - uShadow[i].xy;
    float along = dot(d, away) / uShadow[i].w;
    float across = dot(d, vec2(-away.y, away.x)) / uShadow[i].z;
    float e = length(vec2(across, (along - 0.42) / 0.62));
    float soft = (1.0 - smoothstep(0.3, 1.0, e)) * (1.0 - 0.5 * clamp(along, 0.0, 1.0));
    shade = max(shade, soft * uShadowInk[i]);
  }
  col *= 1.0 - shade * 0.8;

  // The brush: paint arrives in blotches whose edges curl through a slow flow field, and fades
  // back through the same noise instead of simply dimming.
  vec2 g = vWorld.xz * 0.22;
  float n = fbm(g) * 0.75 + fbm(g * 3.1 + 4.7) * 0.25;
  vec2 flow = vec2(fbm(g * 1.7 + uTime * 0.07), fbm(g * 1.7 + 7.3 - uTime * 0.06)) - 0.5;
  vec2 uv = vec2((vWorld.x + flow.x * 0.7 - uLand.x) / uLand.y, (uLand.z - vWorld.z - flow.y * 0.7) / uLand.w);
  vec2 ink = texture2D(uPaint, uv).rg;
  float reveal = smoothstep(-0.03, 0.05, ink.r - 0.2 - (n - 0.3) * 0.5) * smoothstep(0.22, 0.55, ink.r);
  // At rest the contrast is pulled toward a mid grey, like a thin dust haze over the land.
  vec3 rest = mix(col, uHaze * 1.6, ${REST_MIST.toFixed(2)});
  col = mix(rest, col * vec3(1.05, 1.03, 1.0), reveal);

  gl_FragColor = vec4(mix(col, uHaze, hazeAt(dist)), 1.0);
}`;

const CARD_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

/*
 * A watercolour on a piece of white paper (painted ahead of time by art/.../scripts/paint.py).
 * It is painted in as it arrives, driven by `uShown`, which only ever goes up: first a dim grey
 * ghost of the picture appears, then a dab of colour lands at `uDab` and spreads outward from it,
 * a grey wash running a little ahead of the full colour, the wet front a shade darker where it pools.
 */
const CARD_FRAG = /* glsl */ `
${NOISE}
uniform sampler2D uMap;
uniform float uShown;
uniform float uAspect;
uniform vec2 uDab;
uniform vec3 uPaper;
varying vec2 vUv;
void main() {
  vec4 c = texture2D(uMap, vUv);
  vec3 art = c.rgb / max(c.a, 0.004);
  vec2 q = vUv * vec2(uAspect, 1.0);

  // The paper comes in as a few soft blotches that join up.
  float sheet = smoothstep(0.0, 0.3, uShown);
  float a = c.a * smoothstep(0.0, 0.25, sheet * 1.25 - fbm(q * 2.2 + 3.0) * 0.5 + 0.02);
  if (a < 0.004) discard;

  // How late the paint reaches this point: farther from the dab is later, and the front is ragged.
  float reach = length(q - uDab * vec2(uAspect, 1.0)) / length(vec2(uAspect, 1.0));
  float late = reach * 0.8 + fbm(q * 3.4 + 7.3) * 0.34 + fbm(q * 11.0 + 2.1) * 0.08;
  float t = clamp((uShown - 0.22) / 0.78, 0.0, 1.0);
  float front = t * 1.3 - 0.03;
  float colour = (1.0 - smoothstep(front - 0.035, front, late)) * step(0.001, t);
  float under = (1.0 - smoothstep(front * 1.45 + 0.02, front * 1.45 + 0.1, late)) * step(0.001, t);
  float pool = smoothstep(front - 0.11, front - 0.03, late) * colour;

  float luma = dot(art, vec3(0.299, 0.587, 0.114));
  // Before the colour, a dim grey ghost of the picture: on the night ground bare white paper would glare.
  vec3 grey = mix(vec3(luma), art, 0.2);
  vec3 col = mix(grey * 0.45, grey * 0.85, under);
  col = mix(col, art * (1.0 - pool * 0.22), colour);
  // By day the paper is white; at night the whole picture dims with the scene's paper colour.
  gl_FragColor = vec4(col * sqrt(uPaper), a);
}`;

/*
 * The Earth photo (a full disc) lit as a gibbous: each point of the disc is treated as a point on
 * a sphere and shaded by the Sun, with a soft terminator, a night side close to black and a thin
 * blue edge of atmosphere where it is lit.
 */
const EARTH_FRAG = /* glsl */ `
uniform sampler2D uMap;
uniform vec3 uLight;
varying vec2 vUv;
void main() {
  vec4 c = texture2D(uMap, vUv);
  vec2 d = (vUv - 0.5) * 2.0;
  float r2 = dot(d, d);
  if (c.a < 0.01 || r2 > 1.0) discard;
  vec3 n = vec3(d, sqrt(1.0 - r2));
  float lit = smoothstep(-0.06, 0.2, dot(n, uLight));
  vec3 col = c.rgb * (0.025 + 0.975 * lit);
  col += vec3(0.3, 0.5, 0.95) * smoothstep(0.86, 1.0, sqrt(r2)) * lit * 0.22;
  gl_FragColor = vec4(col, c.a);
}`;

/* A few stars, fixed to the sky. They fade out toward the horizon, where the haze would hide them. */
const STAR_VERT = /* glsl */ `
attribute float aSize;
attribute float aBright;
uniform float uPixelRatio;
varying float vBright;
void main() {
  vBright = aBright * smoothstep(0.0, 0.14, normalize(position).y);
  gl_PointSize = aSize * uPixelRatio;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const STAR_FRAG = /* glsl */ `
varying float vBright;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.05, d) * vBright;
  if (a < 0.01) discard;
  gl_FragColor = vec4(vec3(0.9, 0.93, 1.0) * a, a);
}`;

/** A random direction in the upper sky, as a unit vector. */
const skyDirection = (): THREE.Vector3 => {
  // Uniform over the upper hemisphere: on a sphere, height is uniformly distributed.
  const y = 0.02 + Math.random() * 0.98;
  const angle = Math.random() * Math.PI * 2;
  const ring = Math.sqrt(1 - y * y);
  return new THREE.Vector3(Math.cos(angle) * ring, y, Math.sin(angle) * ring);
};

/** A direction near a great circle tilted across the sky, scattered more thickly at its centre. */
const BAND_POLE = new THREE.Vector3(0.35, 0.55, -0.76).normalize();
const bandDirection = (): THREE.Vector3 => {
  for (;;) {
    const spread = (Math.random() + Math.random() + Math.random() - 1.5) * 0.22;
    const onCircle = new THREE.Vector3().randomDirection().projectOnPlane(BAND_POLE).normalize();
    const direction = onCircle.addScaledVector(BAND_POLE, spread).normalize();
    if (direction.y > 0.02) return direction;
  }
};

/** Points spread over the upper sky; most are faint, a handful are bright, and a band of dim ones crosses it. */
function makeStars() {
  const total = STAR_COUNT + BAND_COUNT;
  const positions = new Float32Array(total * 3);
  const sizes = new Float32Array(total);
  const brightness = new Float32Array(total);
  for (let i = 0; i < total; i++) {
    const isBand = i >= STAR_COUNT;
    const direction = isBand ? bandDirection() : skyDirection();
    positions.set([direction.x * STAR_RADIUS, direction.y * STAR_RADIUS, direction.z * STAR_RADIUS], i * 3);
    const isBright = !isBand && Math.random() < 0.035;
    sizes[i] = isBright ? 2.2 + Math.random() * 1.4 : isBand ? 0.8 + Math.random() * 0.7 : 0.9 + Math.random() * 1.1;
    brightness[i] = isBright ? 0.95 : isBand ? 0.12 + Math.random() * 0.22 : 0.18 + Math.random() * 0.45;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aBright", new THREE.BufferAttribute(brightness, 1));
  const material = new THREE.ShaderMaterial({
    vertexShader: STAR_VERT,
    fragmentShader: STAR_FRAG,
    uniforms: { uPixelRatio: { value: 1 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  // Drawn first, so the land and the Earth cover them.
  points.renderOrder = -10;
  return { points, geometry, material };
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** One brush dab for the paint simulation, in paint-map texels. `k` stretches it away from the camera. */
interface Dab {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  radius: number;
  k: number;
  seed: number;
}

/**
 * The Moon as a real 3D scene: a modelled strip of lunar ground, with the photos standing on it
 * as paper cut-outs at different depths. The camera walks sideways with the story. It only draws
 * while something is changing.
 */
export function MoonScene({ stage, cards, onProgress }: { stage: RefObject<StageState>; cards: Card[]; onProgress?: (fraction: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Read through a ref so a new callback from the parent never restarts the scene.
  const progressRef = useRef(onProgress);
  useEffect(() => {
    progressRef.current = onProgress;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: !IS_LITE, alpha: true, powerPreference: "high-performance" });
    } catch (error: unknown) {
      console.error("Moon scene could not start WebGL", error);
      // Without WebGL the words still work; never leave the page waiting on a scene that cannot come.
      progressRef.current?.(1);
      return;
    }
    renderer.setClearColor(0x000000, 0);
    // The shaders work in display colours throughout, so nothing is converted on the way out.
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.3, 1500);

    // The brush's paint: two render targets, each frame read from one and written to the other.
    // A device without a hover pointer gets a single blank 1x1 map instead.
    const paintTargets = [0, 1].map(
      () =>
        new THREE.WebGLRenderTarget(HAS_BRUSH ? PAINT_WIDTH : 1, HAS_BRUSH ? PAINT_HEIGHT : 1, {
          type: THREE.HalfFloatType,
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          depthBuffer: false,
          stencilBuffer: false,
        }),
    );
    let paintRead = 0;
    for (const target of paintTargets) {
      renderer.setRenderTarget(target);
      renderer.clear();
    }
    renderer.setRenderTarget(null);
    const simMaterial = new THREE.ShaderMaterial({
      vertexShader: QUAD_VERT,
      fragmentShader: SIM_FRAG,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uPrev: { value: paintTargets[0].texture },
        uSize: { value: new THREE.Vector2(PAINT_WIDTH, PAINT_HEIGHT) },
        uDt: { value: 0 },
        uTime: { value: 0 },
        uCount: { value: 0 },
        uFrom: { value: Array.from({ length: MAX_DABS }, () => new THREE.Vector4()) },
        uBrush: { value: Array.from({ length: MAX_DABS }, () => new THREE.Vector4(1, 1, 0, 0)) },
      },
    });
    const simGeometry = new THREE.PlaneGeometry(2, 2);
    const simScene = new THREE.Scene();
    simScene.add(new THREE.Mesh(simGeometry, simMaterial));
    const simCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const dabs: Dab[] = [];
    /** Until when the simulation still has work: paint fading or dabs queued. */
    let paintUntil = 0;
    let strokeSeed = Math.random() * 100;
    const toMap = (x: number, z: number): [number, number] => [((x - LAND.x0) / LAND.width) * PAINT_WIDTH, ((LAND.z0 - z) / LAND.depth) * PAINT_HEIGHT];
    const metre = PAINT_WIDTH / LAND.width;
    const time = { value: 0 };

    const paper = { value: PAPER };
    const groundMaterial = new THREE.ShaderMaterial({
      vertexShader: GROUND_VERT,
      fragmentShader: GROUND_FRAG,
      vertexColors: true,
      uniforms: {
        uSoil: { value: null as THREE.Texture | null },
        uPaint: { value: paintTargets[0].texture },
        uLand: { value: new THREE.Vector4(LAND.x0, LAND.width, LAND.z0, LAND.depth) },
        uTime: time,
        uHaze: { value: HAZE },
        uTint: { value: SOIL_TINT },
        uSun: { value: new THREE.Vector3(-0.82, 0.2, 0.5).normalize() },
        uShadow: { value: Array.from({ length: MAX_SHADOWS }, () => new THREE.Vector4(0, 0, 1, 1)) },
        uShadowInk: { value: new Array<number>(MAX_SHADOWS).fill(0) },
      },
    });

    const stars = makeStars();
    scene.add(stars.points);
    const disposables: Array<{ dispose: () => void }> = [...paintTargets, simMaterial, simGeometry, groundMaterial, stars.geometry, stars.material];
    let isDisposed = false;
    // Loading: the terrain is most of the bytes, so it counts for most of the bar. A file that
    // fails still counts as done, so an error can never leave the loading screen up.
    const loading = { terrain: 0, done: 0, total: 2 + cards.length, isReady: false };
    const report = () => progressRef.current?.(Math.min(0.99, loading.terrain * 0.65 + (loading.done / loading.total) * 0.35));
    const settle = () => {
      loading.done += 1;
      report();
    };
    let lastActivity = performance.now();
    const wake = () => {
      lastActivity = performance.now();
    };

    let heights: HeightMap | null = null;
    const groundAt = (x: number, z: number) => {
      if (!heights) return 0;
      const cols = heights.rows[0].length;
      const fx = Math.min(cols - 1.001, Math.max(0, (x - heights.x0) / heights.step));
      const fz = Math.min(heights.rows.length - 1.001, Math.max(0, (heights.z0 - z) / heights.step));
      const ix = Math.floor(fx);
      const iz = Math.floor(fz);
      const tx = fx - ix;
      const tz = fz - iz;
      const near = heights.rows[iz][ix] * (1 - tx) + heights.rows[iz][ix + 1] * tx;
      const far = heights.rows[iz + 1][ix] * (1 - tx) + heights.rows[iz + 1][ix + 1] * tx;
      return near * (1 - tz) + far * tz;
    };

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      SOIL,
      (texture) => {
        if (isDisposed) return texture.dispose();
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        groundMaterial.uniforms.uSoil.value = texture;
        disposables.push(texture);
        settle();
        wake();
      },
      undefined,
      (error: unknown) => {
        console.error("Moon scene could not load the soil texture", error);
        settle();
      },
    );

    // Pictures: planes with their origin at the foot, so they stand on the ground.
    const cardMeshes = cards.map((card) => {
      const geometry = new THREE.PlaneGeometry(card.height * card.aspect, card.height);
      geometry.translate(0, card.height / 2, 0);
      // The Earth is a photo hanging in the night sky: it is simply there, never painted in.
      const material = card.isInSky
        ? new THREE.ShaderMaterial({
            vertexShader: CARD_VERT,
            fragmentShader: EARTH_FRAG,
            transparent: true,
            depthWrite: false,
            uniforms: { uMap: { value: null as THREE.Texture | null }, uLight: { value: EARTH_LIGHT } },
          })
        : new THREE.ShaderMaterial({
        vertexShader: CARD_VERT,
        fragmentShader: CARD_FRAG,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: {
          uMap: { value: null as THREE.Texture | null },
          uShown: { value: 0 },
          uAspect: { value: card.aspect },
          uPaper: paper,
          uDab: { value: new THREE.Vector2(card.dab?.[0] ?? 0.5, card.dab?.[1] ?? 0.55) },
        },
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.visible = false;
      textureLoader.load(
        card.src,
        (texture) => {
          if (isDisposed) return texture.dispose();
          texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
          // Premultiplied, so the blurred mip levels the shader paints from do not pick up
          // whatever colour hides under the transparent pixels around the cut-out.
          if (!card.isInSky) texture.premultiplyAlpha = true;
          material.uniforms.uMap.value = texture;
          mesh.visible = true;
          disposables.push(texture);
          settle();
          wake();
        },
        undefined,
        (error: unknown) => {
          console.error(`Moon scene could not load ${card.src}`, error);
          settle();
        },
      );
      mesh.position.set(laneX(card.at), card.lift ?? 0, -card.depth);
      if (card.lean) mesh.rotation.x = -THREE.MathUtils.degToRad(card.lean);
      // Farther cards draw first so nearer ones blend over them. A picture lying on the ground
      // draws before anything standing on it.
      mesh.renderOrder = 1000 - card.depth - (card.lean ? 6 : 0);
      scene.add(mesh);
      disposables.push(geometry, material);
      return { card, mesh, material, shown: 0, peak: 0, baseY: card.lift ?? 0 };
    });

    fetch(HEIGHTS)
      .then((response) => {
        if (!response.ok) throw new Error(`height map: HTTP ${response.status}`);
        return response.json() as Promise<HeightMap>;
      })
      .then((map) => {
        heights = map;
        for (const item of cardMeshes) {
          if (item.card.lift === undefined) item.baseY = groundAt(item.mesh.position.x, item.mesh.position.z) - item.card.height * 0.02;
        }
        settle();
        wake();
      })
      .catch((error: unknown) => {
        console.error("Moon scene could not load the height map", error);
        settle();
      });

    new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).load(
      TERRAIN,
      (gltf) => {
        if (isDisposed) return;
        gltf.scene.traverse((node) => {
          if (node instanceof THREE.Mesh) {
            node.material = groundMaterial;
            disposables.push(node.geometry);
          }
        });
        scene.add(gltf.scene);
        loading.terrain = 1;
        report();
        wake();
      },
      (event) => {
        loading.terrain = Math.min(0.98, event.loaded / (event.total || TERRAIN_BYTES));
        report();
      },
      (error: unknown) => {
        console.error("Moon scene could not load the terrain", error);
        loading.terrain = 1;
        report();
      },
    );

    const size = { w: 1, h: 1 };
    const resize = () => {
      size.w = Math.max(1, host.clientWidth);
      size.h = Math.max(1, host.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
      renderer.setSize(size.w, size.h, false);
      stars.material.uniforms.uPixelRatio.value = renderer.getPixelRatio();
      camera.aspect = size.w / size.h;
      camera.updateProjectionMatrix();
      wake();
    };
    // Where the pointer is, -1 to 1 across the window, and where the camera has eased to so far.
    const look = { x: 0, y: 0, easedX: 0, easedY: 0 };
    const brush = { isOver: false, moved: false };
    const ndc = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    let lastHit: { x: number; z: number; at: number } | null = null;
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      look.x = (event.clientX / window.innerWidth) * 2 - 1;
      look.y = (event.clientY / window.innerHeight) * 2 - 1;
      const box = host.getBoundingClientRect();
      // Only while the scene is on screen under the pointer; not over the closing section.
      brush.isOver = HAS_BRUSH && event.clientY >= box.top && event.clientY <= box.bottom && (event.target as Element | null)?.closest("[data-closing]") == null;
      ndc.set(((event.clientX - box.left) / box.width) * 2 - 1, -(((event.clientY - box.top) / box.height) * 2 - 1));
      brush.moved = true;
      wake();
    };
    const onLeave = () => {
      brush.isOver = false;
      lastHit = null;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    /** Walks the pointer's ray forward until it goes under the ground. */
    const hitGround = () => {
      const { origin, direction } = raycaster.ray;
      if (direction.y >= -0.005) return null;
      for (let t = 1; t < 70; t += 0.4) {
        const x = origin.x + direction.x * t;
        const y = origin.y + direction.y * t;
        const z = origin.z + direction.z * t;
        if (y <= groundAt(x, z)) return { x, z, t, grazing: -direction.y };
      }
      return null;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    const project = new THREE.Vector3();
    const shadows = groundMaterial.uniforms.uShadow.value as THREE.Vector4[];
    const shadowInk = groundMaterial.uniforms.uShadowInk.value as number[];
    let lastP = -1;
    let lastFrame = performance.now();
    let frame = 0;

    const render = (now: number) => {
      frame = requestAnimationFrame(render);
      const state = stage.current;
      if (!state) return;
      if (state.p !== lastP) {
        lastP = state.p;
        wake();
      }
      // Nothing has changed for a while: leave the last frame up.
      if (now - lastActivity > 3000) {
        lastFrame = now;
        return;
      }
      // Easing is by elapsed time, so a slow machine reveals things just as soon as a fast one.
      const dt = Math.min(0.1, (now - lastFrame) / 1000);
      lastFrame = now;
      time.value = now / 1000;

      // The camera leans a little toward the pointer, eased so it glides rather than tracks.
      const ease = 1 - Math.exp(-dt / (LOOK_EASE / 4));
      look.easedX += (look.x - look.easedX) * ease;
      look.easedY += (look.y - look.easedY) * ease;
      if (Math.abs(look.x - look.easedX) + Math.abs(look.y - look.easedY) > 0.001) wake();

      // On a wide screen the subject is framed on the side away from the words.
      const isNarrow = size.w < 768;
      const lane = laneX(state.p);
      const camX = lane + (isNarrow ? -0.4 : FRAME_OFFSET * state.side) + look.easedX * LOOK_SHIFT;
      const eye = groundAt(camX, CAMERA_Z) + EYE_HEIGHT - look.easedY * 0.03;
      camera.position.set(camX, eye, CAMERA_Z);
      // Nearly level, so the horizon sits mid-screen with open sky above it, as a person would see it.
      camera.lookAt(camX + look.easedX * LOOK_SHIFT, eye + (isNarrow ? 1.4 : 0.5) - look.easedY * 0.05, -14);
      camera.updateMatrixWorld();
      // The sky is infinitely far away: it moves with the camera, so only turning shifts the stars.
      stars.points.position.copy(camera.position);

      for (const item of cardMeshes) {
        const uniforms = item.material.uniforms;
        if (item.card.isInSky) {
          const earth = isNarrow ? EARTH_PHONE : EARTH_WIDE;
          item.mesh.scale.setScalar(earth.scale);
          project.set(earth.at[0], earth.at[1], 0.5).unproject(camera).sub(camera.position).normalize();
          item.mesh.position.copy(camera.position).addScaledVector(project, item.card.depth);
          item.mesh.position.y -= (item.card.height * earth.scale) / 2;
          // Face the camera squarely, so the disc stays round wherever it sits on screen.
          item.mesh.quaternion.copy(camera.quaternion);
          item.peak = 1;
        } else {
          project.set(item.mesh.position.x, item.baseY, item.mesh.position.z).project(camera);
          // Painting starts once the scroll has brought it in from the right, and is never undone.
          if (project.x * 0.5 + 0.5 < 0.94) item.peak = 1;
        }
        // It then paints itself in at its own pace, however fast or slowly the reader scrolls.
        if (item.mesh.visible && item.shown < item.peak) {
          item.shown = Math.min(item.peak, item.shown + dt / CARD_PAINT_SECONDS);
          wake();
        }
        if (!item.card.isInSky) uniforms.uShown.value = item.shown;
        if (!item.card.isInSky) item.mesh.position.y = item.baseY;
      }
      // Over open ground the pointer lays down a stroke, joined to the last one if it was recent.
      if (brush.isOver && brush.moved) {
        raycaster.setFromCamera(ndc, camera);
        const ground = hitGround();
        if (ground) {
          const perPixel = (2 * ground.t * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / size.h;
          const radius = STROKE_RADIUS * perPixel;
          const isStroke = lastHit !== null && now - lastHit.at < 400 && Math.hypot(ground.x - lastHit.x, ground.z - lastHit.z) < radius * 14;
          if (!isStroke) strokeSeed = Math.random() * 100;
          const from = isStroke && lastHit ? lastHit : ground;
          const [x0, y0] = toMap(from.x, from.z);
          const [x1, y1] = toMap(ground.x, ground.z);
          // Seen at a low angle a round dab looks like a sliver; stretching it away from the
          // camera keeps the stroke evenly thick on screen.
          dabs.push({ x0, y0, x1, y1, radius: radius * metre, k: Math.min(7, 1 / Math.max(ground.grazing, 0.05)), seed: strokeSeed });
          lastHit = { x: ground.x, z: ground.z, at: now };
        }
      }
      brush.moved = false;

      // Step the paint only while there is any: lay queued dabs, let wet paint run, let it fade.
      if (dabs.length) paintUntil = now + (STROKE_SECONDS + 0.5) * 1000;
      if (now < paintUntil) {
        const uniforms = simMaterial.uniforms;
        const batch = dabs.splice(0, MAX_DABS);
        batch.forEach((dab, i) => {
          (uniforms.uFrom.value[i] as THREE.Vector4).set(dab.x0, dab.y0, dab.x1, dab.y1);
          (uniforms.uBrush.value[i] as THREE.Vector4).set(dab.radius, dab.k, 1, dab.seed);
        });
        uniforms.uCount.value = batch.length;
        uniforms.uDt.value = dt;
        uniforms.uTime.value = time.value;
        uniforms.uPrev.value = paintTargets[paintRead].texture;
        paintRead = 1 - paintRead;
        renderer.setRenderTarget(paintTargets[paintRead]);
        renderer.render(simScene, simCamera);
        renderer.setRenderTarget(null);
        groundMaterial.uniforms.uPaint.value = paintTargets[paintRead].texture;
        wake();
      }

      // Upright pictures throw a shadow, which arrives with the paper.
      let slot = 0;
      for (const item of cardMeshes) {
        if (item.card.isInSky || item.card.lean || item.card.lift !== undefined || slot >= MAX_SHADOWS) continue;
        const width = item.card.height * item.card.aspect;
        // Seen from eye height the ground is squeezed thin, so the shadow is wider than the picture.
        shadows[slot].set(item.mesh.position.x, item.mesh.position.z, width * 0.6 + 0.5, item.card.height * 1.1 + width * 0.4);
        shadowInk[slot] = clamp01(item.shown / 0.3);
        slot += 1;
      }

      renderer.render(scene, camera);
      // Everything has arrived and been drawn once: the page can lift its loading screen.
      if (!loading.isReady && loading.terrain === 1 && loading.done === loading.total) {
        loading.isReady = true;
        progressRef.current?.(1);
      }
    };
    frame = requestAnimationFrame(render);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      for (const item of disposables) item.dispose();
      renderer.dispose();
    };
    // The card list is fixed for the life of the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 size-full" />;
}
