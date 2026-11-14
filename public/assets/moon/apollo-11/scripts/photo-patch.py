"""Cuts an object standing on the Moon: a sharp edge against the black sky above the horizon,
and a soft-edged patch of the real ground below it.
args: src out horizon x0 x1 cx cy rx ry [poleX]   (horizon < 0: ground patch only)"""
import cv2, sys, numpy as np
src, out = sys.argv[1], sys.argv[2]
hz, x0, x1, cx, cy, rx, ry = map(int, sys.argv[3:10]); pole = int(sys.argv[10]) if len(sys.argv) > 10 else None
im = cv2.imread(src); H, W = im.shape[:2]
alpha = np.zeros((H, W), np.float32)
if hz > 0:
    gray = cv2.GaussianBlur(cv2.cvtColor(im, cv2.COLOR_BGR2GRAY), (0, 0), 1.5)
    dark = (gray < 34).astype(np.uint8)
    dark[hz:, :] = 0
    # the sky is the dark region that reaches the top edge; dark foil inside the object stays
    n, lab = cv2.connectedComponents(dark)
    sky = np.isin(lab, np.unique(lab[0, :][dark[0, :] > 0]))
    obj = ~sky; obj[hz:, :] = False; obj[:, :x0] = False; obj[:, x1:] = False
    alpha = np.maximum(alpha, cv2.GaussianBlur(obj.astype(np.float32), (0, 0), 1.0))
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
r = np.sqrt(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2)
t = np.clip((1.0 - r) / 0.42, 0, 1); ground = t * t * (3 - 2 * t)
if hz > 0: ground[:hz, :] = 0
alpha = np.maximum(alpha, ground)
if pole is not None:
    band = np.clip(1 - np.abs(xx - pole) / 7, 0, 1); band[:hz, :] = 0; band[cy:, :] = 0
    alpha = np.maximum(alpha, band)
a = (alpha * 255).astype(np.uint8)
ys, xs = np.where(a > 4)
X0, X1, Y0, Y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
rgba = np.dstack([im, a])[Y0:Y1, X0:X1]
cv2.imwrite(out, rgba, [cv2.IMWRITE_PNG_COMPRESSION, 9])
print(out, rgba.shape)
