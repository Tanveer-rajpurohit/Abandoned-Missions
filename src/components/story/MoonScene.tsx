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

/** How long a picture takes to paint itself in, from bare paper to full colour. */
const PAINT_SECONDS = 3.4;
/** How many pictures can throw a shadow on the ground. */
const MAX_SHADOWS = 10;

const CAMERA_Z = 4;
const EYE_HEIGHT = 2.3;

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
const HAZE = /* glsl */ `
float hazeAt(float dist) {
  return 0.62 * smoothstep(10.0, 70.0, dist) + 0.26 * smoothstep(70.0, 400.0, dist);
}
`;

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
 * The Moon's surface, painted the way the pictures standing on it are. The shape of the land and
 * the low Sun give each point a tone; the tones are laid as five flat washes, from a slate blue
 * in the shadows up to nearly bare paper in the light. The edge of each wash is ragged and dries
 * a shade darker, real lunar soil (an Apollo 11 surface photo, blurred) mottles the washes so
 * they are not flat, and close to the viewer the grain of the paper shows through.
 */
const GROUND_FRAG = /* glsl */ `
#define MAX_SHADOWS ${MAX_SHADOWS}
${NOISE}
${HAZE}
uniform sampler2D uSoil;
uniform vec3 uHaze;
uniform vec3 uTint;
uniform vec3 uSun;
uniform vec4 uShadow[MAX_SHADOWS];
uniform float uShadowInk[MAX_SHADOWS];
varying vec3 vWorld;
varying vec3 vNormal;
varying vec3 vTone;
const vec3 PAPER = vec3(0.985, 0.98, 0.965);
void main() {
  vec3 normal = normalize(vNormal);
  float dist = distance(vWorld, cameraPosition);
  vec2 g = vWorld.xz;
  float near = 1.0 - smoothstep(8.0, 45.0, dist);
  // The Sun is low, so level ground is half lit and every slope reads clearly.
  float lit = smoothstep(-0.2, 0.6, dot(normal, uSun));

  // Soil mottling: a blurred copy of the photo up close, a much larger one far away.
  float fine = texture2D(uSoil, mat2(0.8, -0.6, 0.6, 0.8) * g * 0.17, 1.5).r;
  float broad = texture2D(uSoil, g * 0.061 + 3.7, 1.0).r;
  float mottle = mix(broad, fine, near) / 0.48;
  float tone = dot(vTone, vec3(0.299, 0.587, 0.114)) * (0.42 + 0.95 * lit) * mix(1.0, mottle, 0.6);

  // Five washes. Noise moves the boundaries about, so they wander like a brushed edge.
  float ragged = (fbm(g * 0.42) - 0.5) * 0.9 + (noise(g * 2.3) - 0.5) * 0.3 * near;
  float layer = clamp(tone, 0.0, 1.15) * 5.0 + ragged;
  float within = fract(layer);
  float wash = clamp((floor(layer) + smoothstep(0.8, 1.0, within)) / 5.0, 0.0, 1.0);
  vec3 dark = vec3(0.34, 0.36, 0.48), mid = vec3(0.68, 0.67, 0.68), light = vec3(0.94, 0.93, 0.9);
  vec3 col = wash < 0.5 ? mix(dark, mid, wash * 2.0) : mix(mid, light, wash * 2.0 - 1.0);
  col *= uTint;

  // Pigment gathers at the edge of a wash, pools unevenly across it and settles into the paper's grain.
  col *= 1.0 - (1.0 - smoothstep(0.0, 0.16, within)) * 0.13;
  col *= 0.93 + 0.14 * fbm(g * 0.13 + 5.0);
  col *= 1.0 - (noise(g * 36.0) - 0.5) * 0.14 * near;
  // In the lightest washes the brush skips and leaves the paper bare.
  float bare = smoothstep(0.6, 0.68, fbm(g * 0.9 + 11.0)) * smoothstep(0.55, 0.85, wash);
  col = mix(col, PAPER, bare * 0.8);

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
  col *= mix(vec3(1.0), vec3(0.34, 0.36, 0.46), shade);
  gl_FragColor = vec4(mix(col, uHaze, hazeAt(dist)), 1.0);
}`;

const CARD_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

/*
 * A watercolour on a piece of white paper (painted ahead of time by scripts/paint.py). It is
 * painted in as it arrives, driven by `uShown`, which only ever goes up: first the bare paper
 * appears, then a dab of paint lands at `uDab` and spreads outward from it, a pale grey wash
 * running a little ahead of the full colour, with the wet front a shade darker where pigment pools.
 */
const CARD_FRAG = /* glsl */ `
${NOISE}
uniform sampler2D uMap;
uniform float uShown;
uniform float uAspect;
uniform vec2 uDab;
uniform vec3 uPaper;
varying vec2 vUv;
const vec3 PAPER = vec3(0.985, 0.98, 0.965);
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
  vec3 grey = mix(mix(vec3(luma), art, 0.2), PAPER, 0.45);
  vec3 col = mix(PAPER, grey, under);
  col = mix(col, art * (1.0 - pool * 0.22), colour);
  // By day the paper is white; at night the whole picture dims with the scene's paper colour.
  gl_FragColor = vec4(col * sqrt(uPaper), a);
}`;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

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
    const camera = new THREE.PerspectiveCamera(32, 1, 0.3, 1500);

    const paper = { value: new THREE.Vector3(1, 1, 1) };
    const groundMaterial = new THREE.ShaderMaterial({
      vertexShader: GROUND_VERT,
      fragmentShader: GROUND_FRAG,
      vertexColors: true,
      uniforms: {
        uSoil: { value: null as THREE.Texture | null },
        uHaze: { value: new THREE.Vector3(1, 1, 1) },
        uTint: { value: new THREE.Vector3(1, 1, 1) },
        uSun: { value: new THREE.Vector3(-0.82, 0.2, 0.5).normalize() },
        uShadow: { value: Array.from({ length: MAX_SHADOWS }, () => new THREE.Vector4(0, 0, 1, 1)) },
        uShadowInk: { value: new Array<number>(MAX_SHADOWS).fill(0) },
      },
    });

    const disposables: Array<{ dispose: () => void }> = [groundMaterial];
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

      for (const item of cardMeshes) {
        const uniforms = item.material.uniforms;
        if (item.card.isInSky) {
          // Far enough away that walking does not move it: it only drifts a little with the story.
          item.mesh.position.set(camX + (isNarrow ? 5 : 21) - state.p * (isNarrow ? 2 : 8), item.baseY - (isNarrow ? 8 : 0), -item.card.depth);
          item.peak = 1;
        } else {
          project.set(item.mesh.position.x, item.baseY, item.mesh.position.z).project(camera);
          // Painting starts once the scroll has brought it in from the right, and is never undone.
          if (project.x * 0.5 + 0.5 < 0.94) item.peak = 1;
        }
        // It then paints itself in at its own pace, however fast or slowly the reader scrolls.
        if (item.mesh.visible && item.shown < item.peak) {
          item.shown = Math.min(item.peak, item.shown + dt / PAINT_SECONDS);
          wake();
        }
        uniforms.uShown.value = item.shown;
        item.mesh.position.y = item.baseY;
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
    };
    frame = requestAnimationFrame(render);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frame);
      ro.disconnect();
      for (const item of disposables) item.dispose();
      renderer.dispose();
    };
    // The card list is fixed for the life of the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 size-full" />;
}
