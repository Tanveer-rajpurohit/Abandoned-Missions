"""Splits a cut-out that stands on a patch of ground into two pieces for the 3D scene: the thing
itself, which stands upright, and the patch of ground, which lies flat under it. Written for the
cut-outs photo-patch.py makes.

Usage: python split-layers.py     (reads ../real/eagle.png and flag.png, writes the pieces beside them)
Needs: opencv-python-headless, numpy.
"""
from pathlib import Path

import cv2
import numpy as np

REAL = Path(__file__).resolve().parent.parent / "real"


def crop_save(name, bgr, alpha):
    a = np.clip(alpha * 255, 0, 255).astype(np.uint8)
    ys, xs = np.where(a > 4)
    box = (slice(max(ys.min() - 4, 0), ys.max() + 5), slice(max(xs.min() - 4, 0), xs.max() + 5))
    out = np.dstack([bgr, a])[box]
    cv2.imwrite(str(REAL / f"{name}.png"), out, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    print(f"{name}: {out.shape[1]} x {out.shape[0]}, cut from x {box[1].start}, y {box[0].start}")


def eagle():
    src = cv2.imread(str(REAL / "eagle.png"), cv2.IMREAD_UNCHANGED)
    bgr, alpha = src[..., :3], src[..., 3].astype(np.float32) / 255
    h, w = alpha.shape
    horizon = 1035
    # Below the horizon the lander stands in front of the ground. This outline runs down the
    # outside of the two legs we see from the side and along the ground under the footpads; the
    # ground between the legs, in the lander's own shadow, stays with the lander.
    outline = np.array([[300, horizon], [110, 1310], [110, 1375], [300, 1388], [700, 1378], [900, 1390], [1300, 1382], [1480, 1388], [1712, 1372], [1702, 1300], [1440, horizon]], np.int32)
    under = np.zeros((h, w), np.uint8)
    cv2.fillPoly(under, [outline], 255)
    under[:horizon] = 0
    under_soft = cv2.GaussianBlur(under.astype(np.float32) / 255, (0, 0), 9)

    lander = alpha.copy()
    lander[horizon:] = 0
    lander = np.maximum(lander, np.minimum(under_soft, alpha * 4))
    crop_save("eagle-lander", bgr, lander)

    # The ground with the lander painted out: the hole is filled in from the soil around it.
    ground = alpha.copy()
    ground[:horizon] = 0
    # Everything above the horizon counts as hole too, so no lander colour is drawn down into it.
    gone = cv2.dilate(under, np.ones((25, 25), np.uint8))
    gone[: horizon + 12] = 255
    small = cv2.resize(bgr, None, fx=0.25, fy=0.25, interpolation=cv2.INTER_AREA)
    hole = cv2.resize(gone, (small.shape[1], small.shape[0]), interpolation=cv2.INTER_NEAREST)
    filled = cv2.inpaint(small, hole, 6, cv2.INPAINT_TELEA)
    filled = cv2.resize(filled, (w, h), interpolation=cv2.INTER_CUBIC)
    mix = cv2.GaussianBlur(gone.astype(np.float32) / 255, (0, 0), 6)[..., None]
    soil = (bgr * (1 - mix) + filled * mix).astype(np.uint8)
    # The horizon is a hard straight cut in the source; fade it so the patch has a soft far edge.
    ground *= np.clip((np.arange(h, dtype=np.float32)[:, None] - horizon) / 70, 0, 1)
    crop_save("eagle-ground", soil, ground)


def flag():
    src = cv2.imread(str(REAL / "flag.png"), cv2.IMREAD_UNCHANGED)
    bgr, alpha = src[..., :3], src[..., 3].astype(np.float32) / 255
    h, w = alpha.shape
    widths = (alpha > 0.5).sum(1)
    cloth_end = int(np.argmax((widths < 20) & (np.arange(h) > 30)))        # first row that is only pole
    patch_top = cloth_end + int(np.argmax(widths[cloth_end:] > 40))        # first row of ground after it
    pole_rows = alpha[cloth_end + 10 : patch_top - 10] > 0.5
    pole_x = int(np.median(np.where(pole_rows)[1]))
    foot = patch_top + (int(np.where(widths > 40)[0].max()) - patch_top) * 45 // 100

    # Below the cloth only the pole is kept, and it is carried on down to its foot in the ground.
    xx = np.arange(w, dtype=np.float32)[None, :]
    stick = np.clip(1.6 - np.abs(xx - pole_x) / 2.5, 0, 1) * np.ones((h, 1), np.float32)
    cloth = alpha.copy()
    cloth[cloth_end:] = np.minimum(cloth[cloth_end:], (np.abs(xx - pole_x) < 7).astype(np.float32))
    cloth[patch_top - 12 :] = 0
    stick[: patch_top - 14] = 0
    stick[foot:] = 0
    crop_save("flag-cloth", bgr, np.maximum(cloth, stick))

    ground = alpha.copy()
    ground[:patch_top] = 0
    crop_save("flag-ground", bgr, ground)
    print(f"flag: pole at x {pole_x}, ground from y {patch_top}, pole foot at y {foot}")


if __name__ == "__main__":
    eagle()
    flag()
