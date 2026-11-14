"use client";

import { useEffect, useRef, useState } from "react";
import { getImageProps } from "next/image";
import gsap from "gsap";

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

/*
 * uProgress 0 to 1 runs in two overlapping stages, like a painter working on paper. First the
 * shape appears as a blank paper cut-out, growing through a fine noise field. Then colour is
 * laid in as blotches from a coarser field. uPointer/uLag smear the pixels under the pointer
 * along its motion, like a finger dragged through wet paint.
 */
const FRAG = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform float uProgress;
uniform float uAspect;
uniform float uHover;
uniform vec2 uPointer;
uniform vec2 uLag;
uniform vec3 uBlank;

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

void main() {
  vec2 d = vUv - uPointer;
  d.x *= uAspect;
  float finger = exp(-dot(d, d) * 22.0) * uHover;
  vec2 uv = vUv - uLag * finger * 1.4;
  uv += 0.004 * finger * vec2(sin(vUv.y * 60.0), cos(vUv.x * 60.0));
  vec4 c = texture2D(uTex, clamp(uv, 0.0, 1.0));
  vec2 q = vUv * vec2(uAspect, 1.0);

  float shapeAt = uProgress * 2.4;
  float shape = 1.0 - smoothstep(shapeAt - 0.1, shapeAt, fbm(q * 5.0) * 0.7 + vUv.y * 0.3);

  // Two sizes of blotch, so the colour spreads like drops of water running into each other.
  float paintAt = max(uProgress - 0.3, 0.0) / 0.7 * 1.5;
  float wet = fbm(q * 2.6 + 7.3) * 0.72 + fbm(q * 7.0 + 2.1) * 0.2 + 0.06;
  float paint = 1.0 - smoothstep(paintAt - 0.05, paintAt, wet);
  // Pigment pools at the edge of a wet patch and dries darker there.
  float pool = smoothstep(paintAt - 0.16, paintAt - 0.04, wet) * paint;

  float a = c.a * shape;
  vec3 colour = mix(uBlank, c.rgb, paint) * (1.0 - pool * 0.2);
  gl_FragColor = vec4(colour * a, a);
}`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
}

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [0.9, 0.9, 0.89];
  const n = parseInt(m[1], 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/**
 * A cutout photo drawn through WebGL: it paints itself in as its data-p attribute goes from 0
 * to 1 (set by the scene that owns it) and smears under the pointer. Without WebGL, or with reduced motion, it is the plain image.
 */
export function DissolveImage({
  src,
  alt,
  width,
  height,
  sizes,
  className = "",
  priority = false,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlain, setIsPlain] = useState(false);
  const { props: imgProps } = getImageProps({ src, alt, width, height, sizes, priority });

  useEffect(() => {
    const wrap = wrapRef.current;
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !img || !canvas) return;

    const gl = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? null
      : canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false });
    const vs = gl && compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = gl && compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const program = gl && vs && fs ? gl.createProgram() : null;
    if (!gl || !vs || !fs || !program) {
      setIsPlain(true);
      return;
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const u = (name: string) => gl.getUniformLocation(program, name);
    const uni = { progress: u("uProgress"), aspect: u("uAspect"), hover: u("uHover"), pointer: u("uPointer"), lag: u("uLag"), blank: u("uBlank") };
    gl.uniform3fv(uni.blank, hexToRgb(getComputedStyle(wrap).getPropertyValue("--surface-raised")));

    const state = { progress: 0, drawn: -1, hover: 0, hoverTo: 0, x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, hasTexture: false };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(wrap.clientWidth * dpr));
      const h = Math.max(1, Math.round(wrap.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
        gl.uniform1f(uni.aspect, w / h);
        state.drawn = -1;
      }
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    let isDisposed = false;
    const upload = () => {
      if (isDisposed) return;
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      // Photos are not power-of-two sized, which WebGL 1 only samples with clamping and no mipmaps.
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      state.hasTexture = true;
      state.drawn = -1;
    };
    img.decode().then(upload, () => setIsPlain(true));

    const onMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      state.tx = (e.clientX - r.left) / r.width;
      state.ty = 1 - (e.clientY - r.top) / r.height;
      state.hoverTo = 1;
    };
    const onLeave = () => {
      state.hoverTo = 0;
    };
    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);

    // Draws only while something is changing, so a page of these costs nothing at rest.
    const render = () => {
      if (!state.hasTexture) return;
      const lagX = state.tx - state.x;
      const lagY = state.ty - state.y;
      state.x += lagX * 0.1;
      state.y += lagY * 0.1;
      state.hover += (state.hoverTo - state.hover) * 0.08;
      // The scene writes how far this picture has come into view to data-p; it is eased here so
      // the paint keeps flowing for a moment after the scroll stops.
      const target = Number.parseFloat(wrap.dataset.p ?? "1");
      state.progress += ((Number.isFinite(target) ? target : 1) - state.progress) * 0.07;
      const isMoving = state.hover > 0.002 || Math.abs(lagX) + Math.abs(lagY) > 0.0005;
      if (!isMoving && Math.abs(state.progress - state.drawn) < 0.0005) return;
      state.drawn = state.progress;
      gl.uniform1f(uni.progress, state.progress);
      gl.uniform1f(uni.hover, state.hover);
      gl.uniform2f(uni.pointer, state.x, state.y);
      gl.uniform2f(uni.lag, lagX, lagY);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    gsap.ticker.add(render);

    return () => {
      isDisposed = true;
      gsap.ticker.remove(render);
      ro.disconnect();
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return (
    <div ref={wrapRef} data-dissolve className={`relative ${className}`} style={{ aspectRatio: `${width} / ${height}` }}>
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- getImageProps supplies the optimised src, srcSet and alt; the element is also the WebGL texture source */}
      <img ref={imgRef} {...imgProps} className={`absolute inset-0 size-full ${isPlain ? "" : "opacity-0"}`} />
      {!isPlain && <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 size-full" />}
    </div>
  );
}
