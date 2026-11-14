"use client";

import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

/**
 * Phones and tablets get a lighter scene: a terrain with under half the triangles (2.6 MB
 * instead of 6 MB), a paint map a quarter of the size, no multisampling and fewer pixels.
 * This module only ever runs in the browser, but the guard keeps it safe to import anywhere.
 */
const IS_LITE = typeof window !== "undefined" && window.matchMedia("(max-width: 820px), (pointer: coarse)").matches;
const TERRAIN = IS_LITE ? "/assets/moon/3d/tranquility-base.lite.glb" : "/assets/moon/3d/tranquility-base.glb";
const MAX_PIXEL_RATIO = IS_LITE ? 1.25 : 1.75;
const HEIGHTS = "/assets/moon/3d/tranquility-base.heights.json";
const SOIL = "/assets/moon/apollo-11/real/regolith.jpg";

export type Rgb = [number, number, number];

/** What the story tells the scene each frame: how far along it is and the current light. */
export interface StageState {
  p: number;
  haze: Rgb;
  ground: Rgb;
  paper: Rgb;
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

const CAMERA_Z = 4;
const EYE_HEIGHT = 2.3;

/** The strip of ground the model covers, in metres. The paint map is stretched over it. */
const LAND = { x0: -110, width: 220, z0: 6, depth: 64 };
const PAINT_WIDTH = IS_LITE ? 1024 : 2048;
const PAINT_HEIGHT = Math.round((PAINT_WIDTH * LAND.depth) / LAND.width);
/** Half the width of the brush the pointer drags, in CSS pixels. */
const STROKE_RADIUS = 44;
/** How long a stroke lives: it holds its colour for about half of this, then dries back. */
const PAINT_SECONDS = 7;
/** How long fresh paint stays wet and keeps running into the paper around it. */
const WET_SECONDS = 1.4;
/** Brush dabs sent to the paint simulation per frame. */
const MAX_DABS = 8;

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

const QUAD_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

/*
 * The paint on the land, simulated on the GPU. Each texel holds two numbers: how much colour is
 * there (r, which runs down to nothing over PAINT_SECONDS) and how wet it still is (g, which runs
 * out much sooner). While wet, paint creeps along a slowly turning current and bleeds into the dry
 * paper beside it along channels in the paper's grain, so a stroke keeps flowing for a moment
 * after the brush has passed. The brush itself is drawn as dabs along the pointer's path, with
 * separate bristles that carry different amounts of paint.
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
  // Across the stroke the bristles leave streaks: some full, some nearly dry.
  float bristle = smoothstep(0.15, 0.75, noise(vec2(dot(off, side) * 6.5 + brush.w, brush.w * 3.1)));
  return body * mix(1.0, 0.68 + 0.32 * bristle, brush.z);
}

void main() {
  vec2 px = 1.0 / uSize;
  vec2 cell = vUv * uSize;
  vec2 paint = texture2D(uPrev, vUv).rg;
  // Wet paint is carried downstream; it only ever adds, so resampling never blurs the stroke away.
  vec2 current = vec2(fbm(cell * 0.012 + uTime * 0.18), fbm(cell * 0.012 + 7.3 - uTime * 0.15)) - 0.5;
  vec2 carried = texture2D(uPrev, vUv - current * px * 3.0).rg;
  paint = max(paint, carried * vec2(0.985, 0.9) * step(0.05, carried.g));

  vec2 n = max(max(texture2D(uPrev, vUv + vec2(px.x, 0.0)).rg, texture2D(uPrev, vUv - vec2(px.x, 0.0)).rg),
               max(texture2D(uPrev, vUv + vec2(0.0, px.y)).rg, texture2D(uPrev, vUv - vec2(0.0, px.y)).rg));
  float channel = smoothstep(0.3, 0.7, fbm(cell * 0.035 + 2.7));
  float chance = hash(cell + fract(uTime * 7.31) * 97.0);
  float bleeds = step(chance, n.g * channel * 0.22 * uDt * 60.0);
  paint = max(paint, bleeds * vec2(n.r * 0.975, n.g * 0.86));

  paint -= vec2(uDt / ${PAINT_SECONDS.toFixed(1)}, uDt / ${WET_SECONDS.toFixed(1)});
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
 * The ground is always there, but faded: a pale, washed-out print of the land. Where the brush
 * has been, `uPaint` brings it back to full colour and contrast for a few seconds. The paint map
 * is read through a slowly turning flow field and a noise threshold, so colour arrives in
 * blotches whose edges curl like ink soaking into wet paper, pigment pools darker along the edge
 * of each patch, and as the paint dries back the patch shrinks away through the same noise
 * instead of simply fading out.
 */
const GROUND_FRAG = /* glsl */ `
${NOISE}
uniform sampler2D uPaint;
uniform sampler2D uSoil;
uniform vec4 uLand;
uniform float uTime;
uniform vec3 uPaper;
uniform vec3 uHaze;
uniform vec3 uTint;
uniform vec3 uSun;
varying vec3 vWorld;
varying vec3 vNormal;
varying vec3 vTone;
void main() {
  vec3 normal = normalize(vNormal);
  float dist = distance(vWorld, cameraPosition);
  // The Sun is low, so level ground is half lit and every slope reads clearly.
  float lit = smoothstep(-0.2, 0.6, dot(normal, uSun));

  // Real lunar soil (an Apollo 11 surface photo) laid over the model. Two offset copies are
  // swapped by a noise field so the tile never visibly repeats, and a much larger copy takes
  // over with distance, where the fine one would only shimmer. On steep faces (boulders, crater
  // walls) the photo is laid on from the side, so it wraps the shape rather than smearing down it.
  vec3 w = pow(abs(normal), vec3(4.0));
  w /= w.x + w.y + w.z;
  vec3 at = vWorld * 0.29;
  float level = mix(texture2D(uSoil, at.xz).r, texture2D(uSoil, at.zx * 0.83 + vec2(0.37, 0.61)).r, smoothstep(0.35, 0.65, noise(vWorld.xz * 0.11)));
  float fine = level * w.y + texture2D(uSoil, at.xy).r * w.z + texture2D(uSoil, at.zy).r * w.x;
  float broad = texture2D(uSoil, mat2(0.8, -0.6, 0.6, 0.8) * vWorld.xz * 0.071 + 3.7).r;
  float grain = mix(fine * 0.72 + broad * 0.28, broad, smoothstep(5.0, 28.0, dist)) / 0.48;
  vec3 soil = vTone * uTint * grain * (0.4 + 1.0 * lit);

  // At rest most of the colour is drained out and the tones are lifted toward the paper, like a
  // light first wash. The shape of the land still reads clearly.
  float luma = dot(soil, vec3(0.299, 0.587, 0.114));
  vec3 rest = mix(mix(vec3(luma), soil, 0.35), uPaper * (0.72 + 0.3 * lit), 0.42);

  vec2 g = vWorld.xz * 0.22;
  float n = fbm(g) * 0.75 + fbm(g * 3.1 + 4.7) * 0.25;
  vec2 flow = vec2(fbm(g * 1.7 + uTime * 0.07), fbm(g * 1.7 + 7.3 - uTime * 0.06)) - 0.5;
  vec2 uv = vec2((vWorld.x + flow.x * 0.7 - uLand.x) / uLand.y, (uLand.z - vWorld.z - flow.y * 0.7) / uLand.w);
  vec2 ink = texture2D(uPaint, uv).rg;
  // Fresh paint holds its colour; once it has dried below about half, the patch shrinks back
  // through the noise and what is left pales out with it.
  float d = ink.r - 0.2 - (n - 0.3) * 0.5;
  float paint = smoothstep(-0.03, 0.05, d) * smoothstep(0.22, 0.55, ink.r);
  float pool = paint * (1.0 - smoothstep(0.03, 0.2, d));
  // Wet paint sits a touch darker and richer than dry.
  vec3 vivid = mix(vec3(luma), soil, 1.15) * (1.0 - ink.g * 0.1);

  vec3 col = mix(rest, vivid, paint) * (1.0 - pool * 0.22);
  gl_FragColor = vec4(mix(col, uHaze, smoothstep(14.0, 60.0, dist)), 1.0);
}`;

const CARD_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

/*
 * A picture painted in watercolour. It arrives in two washes driven by `uShown`, which only ever
 * goes up: first a grey wash in which the darkest tones settle before the light ones, then colour
 * laid in as blotches that pool darker at their edges. The finished picture keeps the look: soft
 * detail, tones lifted a little toward the paper, a granulated grain, and a frayed outline where
 * the paint ran out before the edge of the shape. It holds still under the pointer.
 */
const CARD_FRAG = /* glsl */ `
${NOISE}
uniform sampler2D uMap;
uniform float uShown;
uniform float uAspect;
uniform vec3 uPaper;
varying vec2 vUv;
void main() {
  vec2 q = vUv * vec2(uAspect, 1.0);
  vec2 wobble = (vec2(fbm(q * 7.0), fbm(q * 7.0 + 3.1)) - 0.5) * vec2(0.012 / uAspect, 0.012);
  vec2 uv = clamp(vUv + wobble, 0.0, 1.0);
  vec4 c = texture2D(uMap, uv);

  // How much of the shape surrounds this point: low near the outline, where the edge frays.
  vec2 o = vec2(0.02 / uAspect, 0.02);
  float around = (texture2D(uMap, uv + vec2(o.x, 0.0)).a + texture2D(uMap, uv - vec2(o.x, 0.0)).a
    + texture2D(uMap, uv + vec2(0.0, o.y)).a + texture2D(uMap, uv - vec2(0.0, o.y)).a) * 0.25;
  float fray = fbm(q * 15.0 + 1.7);
  float a = c.a * smoothstep(0.2, 0.42, around + (fray - 0.5) * 0.5);

  // Pigment, built the way a watercolour is: a few flat washes of tone laid one over another,
  // each with a ragged edge that dries a shade darker; colour taken from a much blurrier copy so
  // it runs a little past the lines; then some of the photo's detail brushed back on top.
  vec3 sharp = c.rgb / max(c.a, 0.004);
  vec4 softTap = texture2D(uMap, uv, 2.0);
  vec4 runTap = texture2D(uMap, uv, 4.5);
  vec3 run = runTap.rgb / max(runTap.a, 0.004);
  float tone = dot(softTap.rgb / max(softTap.a, 0.004), vec3(0.299, 0.587, 0.114));
  vec3 hue = run / max(dot(run, vec3(0.299, 0.587, 0.114)), 0.04);
  float layer = tone * 5.0 + (fbm(q * 6.0 + 5.0) - 0.5) * 0.9;
  float edgeOfWash = fract(layer);
  float flat_ = (floor(layer) + smoothstep(0.72, 1.0, edgeOfWash)) / 5.0;
  vec3 washes = clamp(hue * flat_, 0.0, 1.0) * (1.0 - (1.0 - smoothstep(0.0, 0.16, edgeOfWash)) * 0.1);
  vec3 pigment = mix(washes, sharp, 0.38);
  float luma = dot(pigment, vec3(0.299, 0.587, 0.114));
  pigment = mix(pigment, uPaper, 0.08) * (0.94 + 0.1 * noise(q * 110.0));
  // In the lightest passages the paper is left bare in places, as in a real watercolour.
  float bare = smoothstep(0.6, 0.68, fbm(q * 8.0 + 11.0)) * smoothstep(0.5, 0.85, luma);
  pigment = mix(pigment, uPaper, bare * 0.85);
  // Paint collects where a wash stops, so the outline is a shade darker.
  pigment *= 1.0 - (1.0 - smoothstep(0.55, 0.9, around)) * 0.14;

  // First wash: grey, darkest tones first, spreading up from the ground through the paper.
  float washAt = uShown * 2.6;
  float washField = luma * 0.45 + fbm(q * 4.0) * 0.5 + vUv.y * 0.12;
  float wash = 1.0 - smoothstep(washAt - 0.14, washAt, washField + 0.08);
  vec3 grey = mix(mix(vec3(luma), pigment, 0.18), uPaper, 0.3);

  // Second wash: colour in blotches of two sizes, running into each other.
  float paintAt = max(uShown - 0.3, 0.0) / 0.7 * 1.5;
  float wet = fbm(q * 2.6 + 7.3) * 0.72 + fbm(q * 7.0 + 2.1) * 0.2 + 0.06;
  float paint = 1.0 - smoothstep(paintAt - 0.05, paintAt, wet);
  float pool = smoothstep(paintAt - 0.16, paintAt - 0.04, wet) * paint;

  a *= wash;
  if (a < 0.004) discard;
  vec3 col = mix(grey, pigment, paint) * (1.0 - pool * 0.2);
  gl_FragColor = vec4(col, a);
}`;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** One brush dab for the paint simulation, in paint-map texels. `k` stretches it away from the camera. */
interface Dab {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  radius: number;
  k: number;
  /** 1 for a brush with visible bristles, 0 for a soft round blot. */
  bristles: number;
  seed: number;
}

/**
 * The Moon as a real 3D scene: a modelled strip of lunar ground, with the photos standing on it
 * as paper cut-outs at different depths. The camera walks sideways with the story. It only draws
 * while something is changing.
 */
export function MoonScene({ stage, cards }: { stage: RefObject<StageState>; cards: Card[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: !IS_LITE, alpha: true, powerPreference: "high-performance" });
    } catch (error: unknown) {
      console.error("Moon scene could not start WebGL", error);
      return;
    }
    renderer.setClearColor(0x000000, 0);
    // The shaders work in display colours throughout, so nothing is converted on the way out.
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.3, 400);

    // The paint on the land: two render targets, each frame read from one and written to the other.
    const paintTargets = [0, 1].map(
      () =>
        new THREE.WebGLRenderTarget(PAINT_WIDTH, PAINT_HEIGHT, {
          type: THREE.HalfFloatType,
          format: THREE.RGBAFormat,
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
    /** Until when the paint simulation still has something to do: paint drying or dabs queued. */
    let paintUntil = 0;
    let strokeSeed = Math.random() * 100;
    const toMap = (x: number, z: number): [number, number] => [((x - LAND.x0) / LAND.width) * PAINT_WIDTH, ((LAND.z0 - z) / LAND.depth) * PAINT_HEIGHT];
    const metre = PAINT_WIDTH / LAND.width;

    const time = { value: 0 };
    const paper = { value: new THREE.Vector3(1, 1, 1) };
    const groundMaterial = new THREE.ShaderMaterial({
      vertexShader: GROUND_VERT,
      fragmentShader: GROUND_FRAG,
      vertexColors: true,
      uniforms: {
        uPaint: { value: paintTargets[0].texture },
        uSoil: { value: null as THREE.Texture | null },
        uLand: { value: new THREE.Vector4(LAND.x0, LAND.width, LAND.z0, LAND.depth) },
        uTime: time,
        uPaper: paper,
        uHaze: { value: new THREE.Vector3(1, 1, 1) },
        uTint: { value: new THREE.Vector3(1, 1, 1) },
        uSun: { value: new THREE.Vector3(-0.82, 0.2, 0.5).normalize() },
      },
    });

    const disposables: Array<{ dispose: () => void }> = [...paintTargets, simMaterial, simGeometry, groundMaterial];
    let isDisposed = false;
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
        wake();
      },
      undefined,
      (error: unknown) => console.error("Moon scene could not load the soil texture", error),
    );

    // Pictures: planes with their origin at the foot, so they stand on the ground.
    const cardMeshes = cards.map((card) => {
      const geometry = new THREE.PlaneGeometry(card.height * card.aspect, card.height);
      geometry.translate(0, card.height / 2, 0);
      const material = new THREE.ShaderMaterial({
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
          texture.premultiplyAlpha = true;
          material.uniforms.uMap.value = texture;
          mesh.visible = true;
          disposables.push(texture);
          wake();
        },
        undefined,
        (error: unknown) => console.error(`Moon scene could not load ${card.src}`, error),
      );
      mesh.position.set(laneX(card.at), card.lift ?? 0, -card.depth);
      if (card.lean) mesh.rotation.x = -THREE.MathUtils.degToRad(card.lean);
      // Farther cards draw first so nearer ones blend over them.
      mesh.renderOrder = 1000 - card.depth;
      scene.add(mesh);
      disposables.push(geometry, material);
      return { card, mesh, material, shown: 0, peak: 0, baseY: card.lift ?? 0, hasBlot: false };
    });
    const cardByMesh = new Map(cardMeshes.map((item) => [item.mesh as THREE.Object3D, item]));

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
        wake();
      })
      .catch((error: unknown) => console.error("Moon scene could not load the height map", error));

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
        wake();
      },
      undefined,
      (error: unknown) => console.error("Moon scene could not load the terrain", error),
    );

    const size = { w: 1, h: 1 };
    const resize = () => {
      size.w = Math.max(1, host.clientWidth);
      size.h = Math.max(1, host.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
      renderer.setSize(size.w, size.h, false);
      camera.aspect = size.w / size.h;
      camera.updateProjectionMatrix();
      wake();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const pointer = { isInside: false, moved: false };
    let lastHit: { x: number; z: number; at: number } | null = null;

    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
      pointer.isInside = true;
      pointer.moved = true;
      wake();
    };
    const onLeave = () => {
      pointer.isInside = false;
      lastHit = null;
      wake();
    };
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);

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

    const project = new THREE.Vector3();
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

      // On a wide screen the subject sits right of centre, leaving the left for the poem.
      const isNarrow = size.w < 768;
      const camX = laneX(state.p) - (isNarrow ? 0.4 : 3.2);
      const eye = groundAt(camX, CAMERA_Z) + EYE_HEIGHT;
      camera.position.set(camX, eye, CAMERA_Z);
      // Nearly level, so the horizon sits mid-screen with open sky above it, as a person would see it.
      camera.lookAt(camX, eye + (isNarrow ? 1.4 : 0.5), -14);
      camera.updateMatrixWorld();

      paper.value.fromArray(state.paper).divideScalar(255);
      groundMaterial.uniforms.uHaze.value.fromArray(state.haze).divideScalar(255);
      // The chapter's light tints the soil: its ground colour, normalised so it only shifts hue.
      groundMaterial.uniforms.uTint.value.fromArray(state.ground).divideScalar(Math.max(...state.ground, 1));

      // The pointer is a brush: over open ground it lays paint down. A picture holds still under
      // it; touching one that has not arrived yet is enough to set it painting.
      if (pointer.isInside) {
        raycaster.setFromCamera(ndc, camera);
        const hit = raycaster.intersectObjects(cardMeshes.filter((item) => item.mesh.visible && item.shown > 0.2).map((item) => item.mesh), false)[0];
        const hovered = hit ? cardByMesh.get(hit.object) : undefined;
        if (hovered) {
          hovered.peak = 1;
          lastHit = null;
        } else if (pointer.moved) {
          const ground = hitGround();
          if (ground) {
            const perPixel = (2 * ground.t * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / size.h;
            const radius = STROKE_RADIUS * perPixel;
            const isStroke = lastHit !== null && now - lastHit.at < 400 && Math.hypot(ground.x - lastHit.x, ground.z - lastHit.z) < radius * 14;
            if (!isStroke) strokeSeed = Math.random() * 100;
            const from = isStroke && lastHit ? lastHit : ground;
            const [x0, y0] = toMap(from.x, from.z);
            const [x1, y1] = toMap(ground.x, ground.z);
            // Seen at a low angle, a round dab on the ground looks like a thin sliver. Stretching
            // it away from the camera makes the stroke look evenly thick on screen.
            dabs.push({ x0, y0, x1, y1, radius: radius * metre, k: Math.min(7, 1 / Math.max(ground.grazing, 0.05)), bristles: 1, seed: strokeSeed });
            lastHit = { x: ground.x, z: ground.z, at: now };
          }
        }
      }
      pointer.moved = false;

      for (const item of cardMeshes) {
        const uniforms = item.material.uniforms;
        if (item.card.isInSky) {
          // Far enough away that walking does not move it: it only drifts a little with the story.
          item.mesh.position.set(camX + (isNarrow ? 5 : 21) - state.p * (isNarrow ? 2 : 8), item.baseY - (isNarrow ? 8 : 0), -item.card.depth);
          item.peak = 1;
        } else {
          project.set(item.mesh.position.x, item.baseY, item.mesh.position.z).project(camera);
          // Arrives as the scroll brings it in from the right, and never goes back to paper.
          item.peak = Math.max(item.peak, clamp01((0.98 - (project.x * 0.5 + 0.5)) / 0.38));
        }
        if (Math.abs(item.peak - item.shown) > 0.002) wake();
        item.shown += (item.peak - item.shown) * (1 - Math.exp(-dt * 2.6));
        uniforms.uShown.value = item.shown;
        if (!item.card.isInSky) {
          // Comes up out of the ground.
          const risen = 1 - (1 - clamp01(item.shown * 1.6)) ** 3;
          item.mesh.position.y = item.baseY - (1 - risen) * item.card.height * 0.9;
          // As its colour arrives, colour soaks into the ground around its feet too.
          if (!item.hasBlot && item.shown > 0.4 && heights) {
            item.hasBlot = true;
            const [x, y] = toMap(item.mesh.position.x, item.mesh.position.z);
            const radius = (item.card.height * item.card.aspect * 0.6 + 1.2) * metre;
            dabs.push({ x0: x, y0: y, x1: x, y1: y, radius, k: 2.2, bristles: 0, seed: Math.random() * 100 });
          }
        }
      }

      // Step the paint: lay down queued dabs, let wet paint run, let everything dry back a little.
      if (dabs.length) paintUntil = now + (PAINT_SECONDS + 0.5) * 1000;
      if (now < paintUntil) {
        const uniforms = simMaterial.uniforms;
        const batch = dabs.splice(0, MAX_DABS);
        batch.forEach((dab, i) => {
          (uniforms.uFrom.value[i] as THREE.Vector4).set(dab.x0, dab.y0, dab.x1, dab.y1);
          (uniforms.uBrush.value[i] as THREE.Vector4).set(dab.radius, dab.k, dab.bristles, dab.seed);
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

      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(render);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frame);
      ro.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      for (const item of disposables) item.dispose();
      renderer.dispose();
    };
    // The card list is fixed for the life of the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 size-full" />;
}
