"""Cuts one object out of a NASA photo with GrabCut. args: src out x y w h [dark]"""
import cv2, sys, numpy as np
src, out = sys.argv[1], sys.argv[2]
x, y, w, h = map(int, sys.argv[3:7]); dark = int(sys.argv[7]) if len(sys.argv) > 7 else 26
im = cv2.imread(src); H, W = im.shape[:2]
gray = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
mask = np.full((H, W), cv2.GC_BGD, np.uint8)
mask[y:y+h, x:x+w] = cv2.GC_PR_FGD
mask[(cv2.GaussianBlur(gray, (0, 0), 2) < dark)] = cv2.GC_BGD      # the black sky is never the object
bg, fg = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
cv2.grabCut(im, mask, None, bg, fg, 8, cv2.GC_INIT_WITH_MASK)
a = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
a = cv2.morphologyEx(a, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
n, lab, st, _ = cv2.connectedComponentsWithStats(a)
keep = np.zeros_like(a)
for i in range(1, n):
    if st[i, cv2.CC_STAT_AREA] > 0.004 * w * h: keep[lab == i] = 255
a = cv2.GaussianBlur(keep, (0, 0), 1.2)
ys, xs = np.where(a > 8)
x0, x1, y0, y1 = max(xs.min()-6, 0), min(xs.max()+6, W), max(ys.min()-6, 0), min(ys.max()+6, H)
rgba = np.dstack([im, a])[y0:y1, x0:x1]
cv2.imwrite(out, rgba)
# preview on a mid grey so the edge can be judged
p = rgba[:, :, :3].astype(np.float32); al = rgba[:, :, 3:4].astype(np.float32) / 255
prev = (p * al + np.array([150, 120, 90], np.float32) * (1 - al)).astype(np.uint8)
s = 600 / max(prev.shape[:2]); cv2.imwrite(out.replace(".png", "-prev.jpg"), cv2.resize(prev, None, fx=s, fy=s))
print(out, rgba.shape)
