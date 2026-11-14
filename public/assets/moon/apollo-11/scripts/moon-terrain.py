"""
Builds the lunar ground for the Apollo 11 story as a GLB.

Run with Blender in background mode:
    blender --background --python moon-terrain.py -- <out.glb> [preview.png]

The ground is a long strip, because the story camera travels sideways along it. X is the travel
direction, Y is depth away from the camera, Z is up, in metres. It is a height field built from
layered noise and a few hundred impact craters, with rounded hills at the far edge for a horizon
and loose rocks on top. Shading that a web page cannot afford to compute (how sunken or exposed
each point is, bright ejecta around young craters) is baked into vertex colours.
"""

import math
import sys

import bmesh
import bpy
import numpy as np

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
OUT = argv[0] if argv else "tranquility-base.glb"
PREVIEW = argv[1] if len(argv) > 1 else None

SEED = 1969
X_MIN, X_MAX = -110.0, 110.0
Y_MIN, Y_MAX = -6.0, 58.0
STEP_X = 0.22
# Rows are close together near the camera and spread out with distance, so the triangles go
# where the eye can see them: crater walls up close stay smooth without a huge file.
STEP_NEAR, STEP_FAR = 0.14, 0.75

rng = np.random.default_rng(SEED)


def value_noise(x, y, freq, table):
    """Smooth value noise sampled from a wrapping random table."""
    size = table.shape[0]
    gx, gy = x * freq, y * freq
    ix, iy = np.floor(gx).astype(int), np.floor(gy).astype(int)
    fx, fy = gx - ix, gy - iy
    fx, fy = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)
    a = table[ix % size, iy % size]
    b = table[(ix + 1) % size, iy % size]
    c = table[ix % size, (iy + 1) % size]
    d = table[(ix + 1) % size, (iy + 1) % size]
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy


def fbm(x, y, freq, octaves, gain=0.5):
    """Fractal noise in roughly -1..1."""
    total, amp, norm = 0.0, 1.0, 0.0
    for _ in range(octaves):
        table = rng.random((256, 256))
        total = total + amp * (value_noise(x, y, freq, table) * 2 - 1)
        norm += amp
        amp *= gain
        freq *= 2.07
    return total / norm


def smoothstep(lo, hi, v):
    t = np.clip((v - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)


xs = np.arange(X_MIN, X_MAX + STEP_X / 2, STEP_X)
rows = [Y_MIN]
while rows[-1] < Y_MAX:
    rows.append(rows[-1] + STEP_NEAR + (STEP_FAR - STEP_NEAR) * ((rows[-1] - Y_MIN) / (Y_MAX - Y_MIN)) ** 1.3)
ys = np.array(rows)
X, Y = np.meshgrid(xs, ys, indexing="ij")

# The plain: long swells, then knee-high lumps, then the roughness of the soil itself.
height = fbm(X, Y, 0.012, 4) * 1.6 + fbm(X, Y, 0.09, 4) * 0.22 + fbm(X, Y, 0.7, 3) * 0.035

# Rounded hills at the back. Lunar hills are old and worn smooth, so no sharp ridges.
far = smoothstep(26, 54, Y)
hills = 0.5 + 0.5 * fbm(X, Y, 0.022, 5)
height += far * (2.0 + 13.0 * hills * hills)

# Impact craters. Small ones vastly outnumber large ones, as on the real surface. `age` wears
# a crater down: old ones are shallow with a soft rim, young ones are sharp and bright.
ejecta = np.zeros_like(height)
CRATER_SETS = [(7, 5.0, 10.0), (45, 1.8, 5.0), (380, 0.6, 1.8)]
for count, r_lo, r_hi in CRATER_SETS:
    for _ in range(count):
        radius = r_lo * (r_hi / r_lo) ** (rng.random() ** 2.2)
        cx = rng.uniform(X_MIN, X_MAX)
        # Keep the largest craters back from the camera lane, where the lander and crew stand.
        cy = rng.uniform(14 if radius > 3 else Y_MIN, 46)
        age = rng.random()
        reach = radius * 2.6
        i0, i1 = np.searchsorted(xs, [cx - reach, cx + reach])
        j0, j1 = np.searchsorted(ys, [cy - reach, cy + reach])
        if i1 <= i0 or j1 <= j0:
            continue
        # A slightly wobbly outline, so craters are not perfect circles.
        dx, dy = X[i0:i1, j0:j1] - cx, Y[i0:i1, j0:j1] - cy
        wobble = 1 + 0.07 * np.sin(np.arctan2(dy, dx) * 3 + rng.uniform(0, 6.28)) + 0.04 * np.sin(np.arctan2(dy, dx) * 7 + rng.uniform(0, 6.28))
        t = np.hypot(dx, dy) / (radius * wobble)
        depth = radius * 0.38 * (1 - 0.75 * age)
        rim = radius * 0.075 * (1 - 0.8 * age)
        bowl = np.where(t < 1, depth * (t**2.4 - 1), 0.0)
        lip = rim * np.where(t < 1, np.exp(-(((t - 1) / 0.24) ** 2)), np.clip(t, 1, None) ** -3.2)
        fade = 1 - smoothstep(2.0, 2.6, t)
        height[i0:i1, j0:j1] += (bowl + lip) * fade
        ejecta[i0:i1, j0:j1] += (1 - age) ** 2 * np.exp(-np.clip(t - 1, 0, None) * 1.6) * fade * (t > 0.85)


def box_blur(a, k):
    """Mean over a (2k+1) square of samples, via summed-area sums."""
    p = np.pad(a, k, mode="edge")
    s = np.cumsum(np.cumsum(p, axis=0), axis=1)
    s = np.pad(s, ((1, 0), (1, 0)))
    n = 2 * k + 1
    return (s[n:, n:] - s[:-n, n:] - s[n:, :-n] + s[:-n, :-n]) / (n * n)


# Baked shading: points lower than their surroundings sit in shadow, points higher catch light.
cavity = np.clip((height - box_blur(height, 7)) * 2.2, -1, 1) * 0.5 + np.clip((height - box_blur(height, 28)) * 0.5, -1, 1) * 0.5
tone = 0.58 + 0.2 * cavity + 0.16 * np.clip(ejecta, 0, 1) + 0.07 * fbm(X, Y, 0.03, 3) + 0.03 * fbm(X, Y, 1.1, 2)
tone = np.clip(tone, 0.12, 1.0)
# Lunar soil is a faintly warm grey.
ground_colour = np.stack([tone, tone * 0.975, tone * 0.93, np.ones_like(tone)], axis=-1)


def sample_height(x, y):
    i = int(np.clip(round((x - X_MIN) / STEP_X), 0, len(xs) - 1))
    j = int(np.clip(np.searchsorted(ys, y), 0, len(ys) - 1))
    return float(height[i, j])


def add_mesh(name, verts, faces, colours):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts.tolist(), [], faces.tolist())
    mesh.update()
    attr = mesh.color_attributes.new("Col", "FLOAT_COLOR", "POINT")
    attr.data.foreach_set("color", colours.astype(np.float32).ravel())
    mesh.color_attributes.active_color = attr
    for poly in mesh.polygons:
        poly.use_smooth = True
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    return obj


bpy.ops.wm.read_factory_settings(use_empty=True)

# Ground: one grid, two triangles per cell (split by hand so the exporter does not have to guess).
nx, ny = len(xs), len(ys)
verts = np.stack([X, Y, height], axis=-1).reshape(-1, 3)
idx = np.arange(nx * ny).reshape(nx, ny)
a, b, c, d = idx[:-1, :-1].ravel(), idx[1:, :-1].ravel(), idx[1:, 1:].ravel(), idx[:-1, 1:].ravel()
faces = np.concatenate([np.stack([a, b, c], axis=-1), np.stack([a, c, d], axis=-1)])
ground = add_mesh("Ground", verts, faces, ground_colour.reshape(-1, 4))

# Rocks: lumpy, flattened, half-buried icospheres. Many pebbles, few boulders.
rock_verts, rock_faces, rock_colours, offset = [], [], [], 0
for n in range(130):
    size = 0.12 * (1.6 / 0.12) ** (rng.random() ** 3.0)
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=5 if size > 0.6 else 4 if size > 0.25 else 3, radius=1.0)
    p = np.array([v.co[:] for v in bm.verts])
    f = np.array([[v.index for v in face.verts] for face in bm.faces])
    bm.free()
    o = rng.uniform(0, 50, 3)
    # Broad lumps, then creased faces (the folded noise), then grit: a broken stone, not a ball.
    q = p[:, 1] + p[:, 2] * 1.7
    crease = np.abs(fbm(p[:, 0] * 1.2 + o[2], q + o[0], 1.3, 2))
    lump = 1 + 0.3 * fbm(p[:, 0] + o[0], q + o[1], 0.8, 3) - 0.34 * crease + 0.035 * fbm(p[:, 0] + o[1], q + o[2], 5.5, 2)
    p = p * lump[:, None] * np.array([rng.uniform(0.8, 1.4), rng.uniform(0.7, 1.2), rng.uniform(0.45, 0.8)]) * size
    spin = rng.uniform(0, 6.28)
    rot = np.array([[math.cos(spin), -math.sin(spin), 0], [math.sin(spin), math.cos(spin), 0], [0, 0, 1]])
    p = p @ rot.T
    # Boulders stay back from the camera, where one would fill the screen and hide the page controls.
    x, y = rng.uniform(X_MIN + 2, X_MAX - 2), rng.uniform(9 if size > 0.35 else 0.5, 34)
    p += np.array([x, y, sample_height(x, y) + size * 0.12])
    shade = rng.uniform(0.42, 0.7) + 0.16 * (p[:, 2] - p[:, 2].min()) / max(float(np.ptp(p[:, 2])), 1e-6)
    rock_verts.append(p)
    rock_faces.append(f + offset)
    rock_colours.append(np.stack([shade, shade * 0.97, shade * 0.92, np.ones_like(shade)], axis=-1))
    offset += len(p)
rocks = add_mesh("Rocks", np.concatenate(rock_verts), np.concatenate(rock_faces), np.concatenate(rock_colours))

# One matte material that shows the baked colours.
mat = bpy.data.materials.new("Regolith")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Roughness"].default_value = 1.0
col = mat.node_tree.nodes.new("ShaderNodeAttribute")
col.attribute_name = "Col"
mat.node_tree.links.new(col.outputs["Color"], bsdf.inputs["Base Color"])
for obj in (ground, rocks):
    obj.data.materials.append(mat)

# Smooth normals go in the file so it looks right in any viewer; meshopt keeps it small.
bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format="GLB",
    export_normals=True,
    export_meshopt_compression_enable=True,
    export_texcoords=False,
    export_materials="NONE",
    export_vertex_color="ACTIVE",
    export_active_vertex_color_when_no_material=True,
    export_yup=True,
)
# A coarse height map of the lane the story happens in, so the page can stand pictures and the
# camera on the ground without tracing rays through half a million triangles. Depth is written
# as the page's z axis (glTF is Y up, so Blender's +Y becomes -Z).
import json

lane_x = np.arange(X_MIN, X_MAX + 0.5, 1.0)
lane_depth = np.arange(-6.0, 30.5, 1.0)
lane = [[round(sample_height(float(x), float(y)), 2) for x in lane_x] for y in lane_depth]
with open(OUT.rsplit(".", 1)[0] + ".heights.json", "w") as fh:
    json.dump({"x0": float(lane_x[0]), "z0": 6.0, "step": 1.0, "rows": lane}, fh, separators=(",", ":"))

tris = len(ground.data.polygons) + len(rocks.data.polygons)
print(f"MOON_TERRAIN triangles={tris} out={OUT}")

if PREVIEW:
    scene = bpy.context.scene
    cam_data = bpy.data.cameras.new("Cam")
    cam_data.lens = 30
    cam = bpy.data.objects.new("Cam", cam_data)
    scene.collection.objects.link(cam)
    cam.location = (-20, -5.0, sample_height(-20, -5) + 2.4)
    cam.rotation_euler = (math.radians(86), 0, math.radians(-8))
    scene.camera = cam
    # The Apollo 11 landing was soon after local sunrise: the Sun stood about 11 degrees up.
    sun_data = bpy.data.lights.new("Sun", "SUN")
    sun_data.energy = 5
    sun_data.angle = math.radians(0.5)
    sun = bpy.data.objects.new("Sun", sun_data)
    sun.rotation_euler = (math.radians(79), 0, math.radians(-62))
    scene.collection.objects.link(sun)
    scene.world = bpy.data.worlds.new("Space")
    scene.world.use_nodes = True
    scene.world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.01, 0.01, 0.012, 1)
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 48
    scene.render.resolution_x, scene.render.resolution_y = 1600, 760
    scene.render.filepath = PREVIEW
    bpy.ops.render.render(write_still=True)
