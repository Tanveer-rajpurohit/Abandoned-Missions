import HL from "./kernel";

/**
 * Eagle: the Apollo 11 lunar module, in its two stages. The descent stage
 * stands on four legs and never moves: it is the part still on the Moon. The
 * pointer's height lifts the ascent stage off it on a spring, the way it left
 * on 21 July 1969; pointing at the descent stage sets the cabin back down.
 * The slider is how far the ascent stage climbs.
 *
 * The pattern: scrub and pick. One spring for the gap, the bright stroke on
 * the stage the pointer chose, and a hit test on a fixed screen line (the
 * descent stage's top), so the lifting cabin cannot flip the choice.
 */
const {
  Cam, circ, clamp, extremes, facing, fit, hull, lerp, open, poly, proj, prism, ringAt, rings, rrect, run, seg,
  spring, stepS, disposer, mk, pointer, put, register, solid,
} = HL;

// 1 m is 14 units. Descent stage: 4.2 m across, 1.7 m thick, 1.5 m off the ground; pads 9.4 m apart.
const DH = 30, DZ0 = 21, DZ1 = 45, PAD = 64, PR = 8;
const AH = 36, REST = 9, MIN = 6, SPAN = 120;

const shift = (ring, cx, cy) => ring.map((q) => ({ ...q, u: q.u + cx, v: q.v + cy }));

/** A strut between two screen points, as a thin closed plate, so it covers what is behind it. */
function strut(a, b, w) {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = (-dy / l) * w, ny = (dx / l) * w;
  return poly([[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]]);
}

/** One landing leg towards (dx, dy): a footpad, a main strut, two braces, and on one leg the ladder. */
function leg(P, front, parent, dx, dy, ladder) {
  const top = [DH * dx, DH * dy, DZ1 - 3], foot = [PAD * dx, PAD * dy, 3];
  const at = (t) => top.map((v, i) => lerp(v, foot[i], t));
  const knee = at(0.62);
  const pad = solid(parent);
  put(pad, prism(P, front, shift(circ(PR, 20), foot[0], foot[1]), shift(circ(PR - 1.8, 20), foot[0], foot[1]), 0, 3));
  // braces from the two lower corners of that side, meeting at the knee
  const side = 17;
  mk("path", {
    d: seg(P(DH * dx - side * dy, DH * dy - side * dx, DZ0 + 2), P(...knee)) + seg(P(DH * dx + side * dy, DH * dy + side * dx, DZ0 + 2), P(...knee)),
    class: "nf lo",
  }, parent);
  mk("path", { d: strut(P(...top), P(...foot), 1.7), class: "sil" }, parent);
  if (!ladder) return;
  // the ladder Armstrong came down: nine rungs across the main strut
  let d = "";
  for (let k = 1; k <= 7; k++) {
    const q = at(0.1 + k * 0.085);
    d += seg(P(q[0] - 5 * dy, q[1] - 5 * dx, q[2]), P(q[0] + 5 * dy, q[1] + 5 * dx, q[2]));
  }
  mk("path", { d, class: "nf" }, parent);
}

/** A small round dish on a stalk, facing along y. */
function dish(P, x, y, z0, h, r, lean) {
  const c = [x + lean, y, z0 + h];
  return { stalk: seg(P(x, y, z0), P(...c)), rim: poly(circ(r, 18).map((q) => P(c[0] + q.u * 0.3, c[1] + q.u, c[2] + q.v))) };
}

/** The ascent stage with its base at height z: a cabin narrower at the top, hatch, windows, two dishes, two thruster blocks. */
function cabin(P, front, S, z) {
  const t = z + AH, lerpY = (k) => lerp(20, 14, k);
  // the front face slopes, so its marks are placed between the foot and the top
  const w = (u, k) => P(u * lerp(1, 0.72, k), lerpY(k), z + k * AH);
  const a = dish(P, -8, -6, t, 14, 6, -3), b = dish(P, 9, -9, t, 9, 4.5, 4);
  const quad = (sx) => prism(P, front, shift(S.q, sx * 27, 0), shift(S.qi, sx * 27, 0), z + 15, z + 22);
  return {
    sil: poly(hull(ringAt(P, S.foot, z).concat(ringAt(P, S.top, t)))),
    crease: open(ringAt(P, run(S.inner, front), t)),
    hatch: poly(ringAt(P, shift(circ(5.5, 18), 2, 0), t)),
    windows: poly([w(-13, 0.78), w(-4, 0.78), w(-9, 0.5)]) + poly([w(4, 0.78), w(13, 0.78), w(9, 0.5)]),
    door: poly([w(-4.5, 0.36), w(4.5, 0.36), w(4.5, 0.1), w(-4.5, 0.1)]),
    stalks: a.stalk + b.stalk,
    dishes: a.rim + b.rim,
    far: quad(-1), near: quad(1),
    arms: seg(P(-20, 0, z + 18), P(-25, 0, z + 18)) + seg(P(20, 0, z + 18), P(25, 0, z + 18)),
  };
}

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let reach = value;

  // Fitted to the highest climb the slider allows, so the cabin never leaves the frame.
  const C = Cam(45, 0.5, 1.66);
  const TOP = DZ1 + 50 + AH + 22;
  fit(C, [[-PAD - PR, 0, 0], [0, -PAD - PR, 0], [PAD + PR, 0, 0], [0, PAD + PR, 0], [0, 0, TOP]], 200, 166);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  leg(P, front, g, -1, 0, false);
  leg(P, front, g, 0, -1, false);
  // the descent engine's skirt, wider at its mouth
  mk("path", { d: poly(hull(ringAt(P, circ(10, 20), 5).concat(ringAt(P, circ(5, 20), DZ0)))), class: "sil" }, g);
  mk("path", { d: poly(ringAt(P, circ(10, 20), 5)), class: "nf lo" }, g);
  // the descent stage: an octagon, so the corners are cut wide
  const [dRing, dInner] = rings(-DH, -DH, DH, DH, 15, 2);
  const descent = solid(g);
  put(descent, prism(P, front, dRing, dInner, DZ0, DZ1));
  leg(P, front, g, 1, 0, false);
  leg(P, front, g, 0, 1, true);

  // dashed drops from the cabin to where it stood, painted behind the cabin
  const S = {
    foot: rrect(-22, -20, 22, 20, 11, 6), top: rrect(-15, -14, 15, 14, 8, 6), inner: rrect(-13.2, -12.2, 13.2, 12.2, 6.2, 6),
    q: rrect(-3.5, -3.5, 3.5, 3.5, 1.6, 4), qi: rrect(-2.4, -2.4, 2.4, 2.4, 0.8, 4),
  };
  const drops = mk("path", { class: "nf dash" }, g);
  const ex = extremes(P, S.foot);
  const far = solid(g);
  const arms = mk("path", { class: "nf lo" }, g);
  const ascent = solid(g);
  const hatch = mk("path", { class: "nf lo" }, ascent.g), windows = mk("path", { class: "lo" }, ascent.g), door = mk("path", { class: "nf lo" }, ascent.g);
  const stalks = mk("path", { class: "nf" }, ascent.g), dishes = mk("path", {}, ascent.g);
  const near = solid(g);

  let drawn = NaN;
  function draw(gap) {
    if (Math.abs(gap - drawn) < 0.02) return;
    drawn = gap;
    const q = cabin(P, front, S, DZ1 + gap);
    put(ascent, q); put(far, q.far); put(near, q.near);
    arms.setAttribute("d", q.arms); hatch.setAttribute("d", q.hatch);
    windows.setAttribute("d", q.windows); door.setAttribute("d", q.door);
    stalks.setAttribute("d", q.stalks); dishes.setAttribute("d", q.dishes);
    drops.setAttribute("d", ex.map((s) => seg(P(s.u, s.v, DZ1), P(s.u, s.v, DZ1 + gap))).join(""));
  }

  const gap = spring(REST);
  const B = register(stage, (dt) => { const moving = stepS(gap, dt); draw(gap.x); return moving; });
  bag.add(B.unregister);

  // The line the pointer is read against: the descent stage's top, which never moves.
  const deck = P(0, 0, DZ1)[1] - 8;
  let last = null;
  /** part: "ascent", "descent" or null for rest. */
  function choose(part, y) {
    gap.t = part === "ascent" ? lerp(MIN, reach, clamp((deck - y) / SPAN, 0, 1)) : part === "descent" ? 0 : REST;
    ascent.sil.classList.toggle("hi", part === "ascent");
    descent.sil.classList.toggle("hi", part !== "ascent");
    read.textContent = part || "rest";
    B.wake();
  }

  bag.add(pointer(stage, {
    move: (p) => { last = p; choose(p[1] < deck ? "ascent" : "descent", p[1]); },
    leave: () => { last = null; choose(null, 0); },
  }));
  bag.add(() => svg.replaceChildren());
  choose(null, 0);
  draw(REST);

  return {
    set: (v) => { reach = v; if (last) choose(last[1] < deck ? "ascent" : "descent", last[1]); },
    destroy: bag.dispose,
  };
}

export const eagle = {
  name: "eagle",
  means: "Apollo 11's lunar module: lift the pointer and the ascent stage leaves; the descent stage is the part still on the Moon.",
  rules: [1, 3, 5, 8],
  range: [16, 34, 50],
  tour: [[200, 215], [200, 130], [205, 45], null],
  mount,
};
