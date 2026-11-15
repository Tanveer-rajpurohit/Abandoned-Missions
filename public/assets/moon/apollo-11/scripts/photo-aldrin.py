"""Cuts Buzz Aldrin out of AS11-40-5903. args: src out"""
import sys
import cv2
import numpy as np

src, out = sys.argv[1], sys.argv[2]
full = cv2.imread(src)
x0, x1, y0, y1 = 1900, 3640, 0, 3000
crop = cv2.resize(full[y0:y1, x0:x1], None, fx=0.5, fy=0.5, interpolation=cv2.INTER_AREA)
h, w = crop.shape[:2]
hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
val = cv2.GaussianBlur(hsv[..., 2], (0, 0), 2)

mask = np.full((h, w), cv2.GC_PR_BGD, np.uint8)
m = 70
mask[:, :m] = cv2.GC_BGD
mask[:, w - m :] = cv2.GC_BGD
mask[h - 40 :, :] = cv2.GC_BGD
# The suit is the brightest large thing in the frame.
bright = (val > 205).astype(np.uint8)
bright = cv2.morphologyEx(bright, cv2.MORPH_OPEN, np.ones((9, 9), np.uint8))
n, lab, st, _ = cv2.connectedComponentsWithStats(bright)
big = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
mask[lab == big] = cv2.GC_PR_FGD
mask[cv2.erode((lab == big).astype(np.uint8), np.ones((25, 25), np.uint8)) > 0] = cv2.GC_FGD
# A body-shaped guess for what the brightness misses (visor, gloves, boots, chest pack).
guess = np.zeros((h, w), np.uint8)
for (cx, cy, rx, ry) in [(0.47, 0.11, 0.2, 0.1), (0.47, 0.36, 0.3, 0.2), (0.36, 0.66, 0.13, 0.2), (0.62, 0.66, 0.13, 0.2), (0.34, 0.86, 0.1, 0.06), (0.76, 0.84, 0.1, 0.06)]:
    cv2.ellipse(guess, (int(cx * w), int(cy * h)), (int(rx * w), int(ry * h)), 0, 0, 360, 1, -1)
mask[(guess > 0) & (mask == cv2.GC_PR_BGD)] = cv2.GC_PR_FGD
# Glove and boots are the grey of the ground, so they are pointed out by hand (x, y, rx, ry).
for (cx, cy, rx, ry) in [(137, 929, 62, 72), (284, 1371, 85, 48), (722, 1351, 88, 52)]:
    part = np.zeros((h, w), np.uint8)
    cv2.ellipse(part, (cx, cy), (rx, ry), 0, 0, 360, 1, -1)
    mask[(part > 0) & (mask != cv2.GC_FGD)] = cv2.GC_PR_FGD
    core = np.zeros((h, w), np.uint8)
    cv2.ellipse(core, (cx, cy), (rx // 2, ry // 2), 0, 0, 360, 1, -1)
    mask[core > 0] = cv2.GC_FGD
# Above the horizon there is only black sky, so anything lit up there is the astronaut.
dark = (val < 48).astype(np.uint8)
n, lab = cv2.connectedComponents(dark)
sky = np.isin(lab, np.unique(lab[0, :][dark[0, :] > 0]))
left = int(np.argmin(sky[:, 20])), int(np.argmin(sky[:, w - 20]))
line = np.linspace(left[0], left[1], w)[None, :] - 14
above = np.arange(h)[:, None] < line
mask[above & sky] = cv2.GC_BGD
mask[above & ~sky & (np.arange(w)[None, :] > m) & (np.arange(w)[None, :] < w - m)] = cv2.GC_FGD
print("horizon", left)
bg, fg = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
cv2.grabCut(crop, mask, None, bg, fg, 8, cv2.GC_INIT_WITH_MASK)
a = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
a = cv2.morphologyEx(a, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
a = cv2.morphologyEx(a, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
n, lab, st, _ = cv2.connectedComponentsWithStats(a)
a = np.where(lab == 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA])), 255, 0).astype(np.uint8)
# holes inside the figure are part of it
inv = cv2.bitwise_not(a)
n, lab, st, _ = cv2.connectedComponentsWithStats(inv)
for i in range(1, n):
    x, y, ww, hh = st[i, :4]
    if x > 0 and y > 0 and x + ww < w and y + hh < h:
        a[lab == i] = 255
a = cv2.GaussianBlur(a, (0, 0), 1.2)
ys, xs = np.where(a > 8)
rgba = np.dstack([crop, a])[max(ys.min() - 6, 0) : ys.max() + 7, max(xs.min() - 6, 0) : xs.max() + 7]
cv2.imwrite(out, rgba, [cv2.IMWRITE_PNG_COMPRESSION, 9])
al = rgba[..., 3:].astype(np.float32) / 255
prev = (rgba[..., :3] * al + np.array([200, 140, 90], np.float32) * (1 - al)).astype(np.uint8)
s = 900 / max(prev.shape[:2])
cv2.imwrite(out.replace(".png", "-prev.jpg"), cv2.resize(prev, None, fx=s, fy=s))
print(out, rgba.shape)
