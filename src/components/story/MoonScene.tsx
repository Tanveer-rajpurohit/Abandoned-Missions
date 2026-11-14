"use client";

import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

const TERRAIN = "/assets/moon/apollo-11/3d/tranquility-base.glb";
const HEIGHTS = "/assets/moon/apollo-11/3d/tranquility-base.heights.json";
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

/** A DOM element kept glued to a spot in the scene, for content that is not a picture. */
export interface Follower {
  ref: RefObject<HTMLElement | null>;
  at: number;
  depth: number;
  height: number;
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
const PAINT_WIDTH = 1536;
const PAINT_HEIGHT = Math.round((PAINT_WIDTH * LAND.depth) / LAND.width);
/** Half the width of the stroke the pointer leaves, in CSS pixels (about 1 to 1.5 cm on a desktop screen). */
const STROKE_RADIUS = 34;
/** How long fresh ink keeps spreading outward after it is laid down. */
const BLEED_SECONDS = 1.3;

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
 * The ground is bare paper until it is painted. `uPaint` is a map laid over the land that
 * records where ink has been put down, by the pointer or around a picture as it arrives. It is
 * never erased. The map is read through a slowly turning flow field and a noise threshold, so
 * colour arrives in blotches whose edges curl like ink soaking into wet paper, and pigment
 * pools darker along the edge of each patch the way watercolour dries.
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
  // Bare paper still shows the shape of the land, as an embossed sheet would, with a little tooth.
  vec3 paper = uPaper * (0.7 + 0.32 * lit) * (1.0 + (noise(vWorld.xz * 26.0) - 0.5) * 0.05 * (1.0 - smoothstep(2.0, 12.0, dist)));

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
  vec3 soil = mix(vTone * uTint * grain * (0.4 + 1.0 * lit), paper, 0.06);

  vec2 g = vWorld.xz * 0.22;
  float n = fbm(g) * 0.75 + fbm(g * 3.1 + 4.7) * 0.25;
  vec2 flow = vec2(fbm(g * 1.7 + uTime * 0.07), fbm(g * 1.7 + 7.3 - uTime * 0.06)) - 0.5;
  vec2 uv = vec2((vWorld.x + flow.x * 1.6 - uLand.x) / uLand.y, (uLand.z - vWorld.z - flow.y * 1.6) / uLand.w);
  float d = texture2D(uPaint, uv).r * 1.8 - 0.36 - n * 0.7;
  float paint = smoothstep(-0.06, 0.06, d);
  float pool = paint * (1.0 - smoothstep(0.06, 0.3, d));

  vec3 col = mix(paper, soil, paint) * (1.0 - pool * 0.24);
  gl_FragColor = vec4(mix(col, uHaze, smoothstep(14.0, 60.0, dist)), 1.0);
}`;

const CARD_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

/*
 * A picture is first a blank paper cut-out that grows in, then colour is laid into it. Both
 * stages are driven by `uShown`, which only ever goes up. It holds still under the pointer.
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
  vec4 c = texture2D(uMap, vUv);

  float shapeAt = uShown * 2.4;
  float shape = 1.0 - smoothstep(shapeAt - 0.1, shapeAt, fbm(q * 5.0) * 0.7 + vUv.y * 0.3);
  float a = c.a * shape;
  if (a < 0.004) discard;

  float paintAt = max(uShown - 0.3, 0.0) / 0.7 * 1.5;
  float wet = fbm(q * 2.6 + 7.3) * 0.72 + fbm(q * 7.0 + 2.1) * 0.2 + 0.06;
  float paint = 1.0 - smoothstep(paintAt - 0.05, paintAt, wet);
  float pool = smoothstep(paintAt - 0.16, paintAt - 0.04, wet) * paint;

  // Unpainted, the cut-out is a sheet of paper a shade off the page behind it, lit from above,
  // so its outline can be read before any colour arrives.
  vec3 sheet = uPaper * (0.86 + 0.1 * vUv.y) * (0.98 + 0.04 * noise(q * 90.0));
  vec3 col = mix(sheet, c.rgb, paint) * (1.0 - pool * 0.2);
  gl_FragColor = vec4(col, a);
}`;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** A stroke segment or a blot that is still spreading. `k` stretches it away from the camera. */
interface Ink {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  radius: number;
  k: number;
  born: number;
  life: number;
}

/**
 * The Moon as a real 3D scene: a modelled strip of lunar ground, with the photos standing on it
 * as paper cut-outs at different depths. The camera walks sideways with the story. It only draws
 * while something is changing.
 */
export function MoonScene({ stage, cards, follower }: { stage: RefObject<StageState>; cards: Card[]; follower?: Follower }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch (error: unknown) {
      console.error("Moon scene could not start WebGL", error);
      return;
    }
    renderer.setClearColor(0x000000, 0);
    // The shaders work in display colours throughout, so nothing is converted on the way out.
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.3, 400);

    // Where ink has been laid on the land. Only ever added to.
    const paintCanvas = document.createElement("canvas");
    paintCanvas.width = PAINT_WIDTH;
    paintCanvas.height = PAINT_HEIGHT;
    const paintCtx = paintCanvas.getContext("2d");
    if (paintCtx) {
      paintCtx.fillStyle = "#000";
      paintCtx.fillRect(0, 0, PAINT_WIDTH, PAINT_HEIGHT);
      paintCtx.lineCap = "round";
      paintCtx.strokeStyle = "#fff";
    }
    const paintMap = new THREE.CanvasTexture(paintCanvas);
    paintMap.flipY = false;
    paintMap.minFilter = paintMap.magFilter = THREE.LinearFilter;
    paintMap.generateMipmaps = false;
    const wetInk: Ink[] = [];
    const toMap = (x: number, z: number): [number, number] => [((x - LAND.x0) / LAND.width) * PAINT_WIDTH, ((LAND.z0 - z) / LAND.depth) * PAINT_HEIGHT];
    const metre = PAINT_WIDTH / LAND.width;

    const time = { value: 0 };
    const paper = { value: new THREE.Vector3(1, 1, 1) };
    const groundMaterial = new THREE.ShaderMaterial({
      vertexShader: GROUND_VERT,
      fragmentShader: GROUND_FRAG,
      vertexColors: true,
      uniforms: {
        uPaint: { value: paintMap },
        uSoil: { value: null as THREE.Texture | null },
        uLand: { value: new THREE.Vector4(LAND.x0, LAND.width, LAND.z0, LAND.depth) },
        uTime: time,
        uPaper: paper,
        uHaze: { value: new THREE.Vector3(1, 1, 1) },
        uTint: { value: new THREE.Vector3(1, 1, 1) },
        uSun: { value: new THREE.Vector3(-0.82, 0.2, 0.5).normalize() },
      },
    });

    const disposables: Array<{ dispose: () => void }> = [paintMap, groundMaterial];
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
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
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

      // The pointer: over open ground it lays ink down. A picture holds still under it; touching
      // one that is still bare paper is enough to set it painting.
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
            const from = isStroke && lastHit ? lastHit : ground;
            const [x0, y0] = toMap(from.x, from.z);
            const [x1, y1] = toMap(ground.x, ground.z);
            // Seen at a low angle, a round blot on the ground looks like a thin sliver. Stretching
            // it away from the camera makes the stroke look evenly thick on screen.
            wetInk.push({ x0, y0, x1, y1, radius: radius * metre, k: Math.min(7, 1 / Math.max(ground.grazing, 0.05)), born: now, life: BLEED_SECONDS });
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
            wetInk.push({ x0: x, y0: y, x1: x, y1: y, radius, k: 2.2, born: now, life: 3.2 });
          }
        }
      }

      // Fresh ink is redrawn a little wider each frame until it has finished spreading.
      if (paintCtx && wetInk.length) {
        paintCtx.globalCompositeOperation = "lighter";
        for (let i = wetInk.length - 1; i >= 0; i--) {
          const ink = wetInk[i];
          const age = (now - ink.born) / 1000 / ink.life;
          if (age >= 1) {
            wetInk.splice(i, 1);
            continue;
          }
          const spread = 0.35 + 0.65 * (1 - (1 - age) ** 2);
          paintCtx.filter = `blur(${Math.max(1, ink.radius * 0.4).toFixed(1)}px)`;
          paintCtx.globalAlpha = 0.14;
          paintCtx.lineWidth = ink.radius * 2 * spread;
          paintCtx.setTransform(1, 0, 0, ink.k, 0, 0);
          paintCtx.beginPath();
          paintCtx.moveTo(ink.x0, ink.y0 / ink.k);
          paintCtx.lineTo(ink.x1, ink.y1 / ink.k + 0.01);
          paintCtx.stroke();
        }
        paintCtx.setTransform(1, 0, 0, 1, 0, 0);
        paintCtx.filter = "none";
        paintMap.needsUpdate = true;
        wake();
      }

      if (follower?.ref.current) {
        const el = follower.ref.current;
        const x = laneX(follower.at);
        const y = groundAt(x, -follower.depth);
        project.set(x, y, -follower.depth).project(camera);
        const footX = (project.x * 0.5 + 0.5) * size.w;
        const footY = (1 - (project.y * 0.5 + 0.5)) * size.h;
        project.set(x, y + follower.height, -follower.depth).project(camera);
        const px = footY - (1 - (project.y * 0.5 + 0.5)) * size.h;
        const scale = px / el.offsetHeight;
        el.style.transform = `translate3d(${footX - (el.offsetWidth * scale) / 2}px, ${footY - px}px, 0) scale(${scale})`;
        el.style.opacity = String(clamp01((0.96 - footX / size.w) / 0.3) * clamp01((footX / size.w + 0.3) / 0.3));
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
    // The card list and follower are fixed for the life of the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 size-full" />;
}
