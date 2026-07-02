import numpy as np
from PIL import Image, ImageDraw, ImageFont

IMG = '../../portrait.jpg'
COLS = 64
img = np.asarray(Image.open(IMG).convert('RGB'), dtype=float) / 255.0
H, W, _ = img.shape          # 600 x 450
ROWS = round(COLS * H / W)   # square cells
CH = H / ROWS; CW = W / COLS

# --- HSV (vectorized) ---
mx = img.max(2); mn = img.min(2); d = np.maximum(mx - mn, 1e-9)
v = mx
s = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-9), 0)
r, g, b = img[..., 0], img[..., 1], img[..., 2]
h = np.zeros((H, W))
m = mx == r; h[m] = ((60 * (g - b) / d) % 360)[m]
m = mx == g; h[m] = (60 * (b - r) / d + 120)[m]
m = mx == b; h[m] = (60 * (r - g) / d + 240)[m]

yy, xx = np.mgrid[0:H, 0:W]

# --- pixel-level tests ---
dark   = v < 0.62                                   # structure against bright sky/sea
green  = (h > 55) & (h < 175) & (s > 0.22)          # foliage
navy   = (h > 195) & (h < 240) & (s > 0.42) & (v < 0.85)  # shirt
vdark  = v < 0.30                                   # pants / hair / glasses
skin   = ((h < 60) | (h > 320)) & (s > 0.1) & (v > 0.25) & (v < 0.8)

# --- scene geometry (hand-placed on the 450x600 photo) ---
# main tower incl. crossbeams
tower_main = (xx > 193) & (xx < 256) & (yy > 18) & (yy < 302)
# far (Marin-side) tower
tower_far = (xx > 391) & (xx < 419) & (yy > 200) & (yy < 265)
# deck band across the image
deck = (yy > 281) & (yy < 315)
# suspension cables: only dark thing in the sky above the hills line
near_cable = (yy < 228) & (v < 0.75) & (s < 0.55)
# person silhouette: head / torso / legs boxes
person_geo = ((xx > 352) & (xx < 400) & (yy > 300) & (yy < 352)) | \
             ((xx > 330) & (xx < 432) & (yy > 352) & (yy < 470)) | \
             ((xx > 322) & (xx < 405) & (yy > 470) & (yy < 600))
hills_band = (yy > 228) & (yy < 292)
hills_right = (xx > 300) & (yy > 240) & (yy < 330)

# --- pixel labels, priority high->low ---
# 0 sky 1 bridge 2 hills 3 sea 4 trees 5 person, -1 undecided
plab = np.full((H, W), -1, dtype=int)
bridge_px = ((tower_main | tower_far | deck) & dark & ~green) | near_cable
person_px = person_geo & (navy | vdark | skin) & ~green
tree_px   = green
plab[tree_px] = 4
plab[bridge_px] = 1
plab[person_px] = 5          # person wins over bridge/trees inside silhouette
# backgrounds
undec = plab == -1
sky_px  = undec & (v > 0.62) & (yy < 292) & ~(hills_band & (v < 0.97) & (s < 0.45)) & ~hills_right
plab[sky_px] = 0
undec = plab == -1
hill_px = undec & ((hills_band | hills_right) & (yy < 315))
plab[hill_px] = 2
undec = plab == -1
sea_px = undec & (yy >= 292) & (yy < 480)
plab[sea_px] = 3
undec = plab == -1
plab[undec & (yy < 240)] = 0
plab[undec & (yy >= 240) & (yy < 292)] = 2
plab[undec & (yy >= 292) & (yy < 470)] = 3
plab[undec] = 4

# --- aggregate to cells: coverage with priority for thin/foreground classes ---
lab = np.zeros((ROWS, COLS), dtype=int)
color = np.zeros((ROWS, COLS, 3))
for j in range(ROWS):
    for i in range(COLS):
        y0, y1 = int(j * CH), int((j + 1) * CH)
        x0, x1 = int(i * CW), int((i + 1) * CW)
        cl = plab[y0:y1, x0:x1]
        cimg = img[y0:y1, x0:x1].reshape(-1, 3)
        n = cl.size
        counts = np.bincount(cl.ravel(), minlength=6)
        if counts[5] / n > 0.32: L = 5
        elif counts[1] / n > 0.14: L = 1
        elif counts[4] / n > 0.38: L = 4
        else: L = int(np.argmax(counts * np.array([1, 0, 1, 1, 1, 0])))
        lab[j, i] = L
        sel = (cl == L).ravel()
        color[j, i] = cimg[sel].mean(0) if sel.any() else cimg.mean(0)

# despeckle: lone cells adopt neighborhood majority (protect person)
for _ in range(1):
    out = lab.copy()
    for j in range(1, ROWS - 1):
        for i in range(1, COLS - 1):
            if lab[j, i] == 5: continue
            nb = np.concatenate([lab[j-1, i-1:i+2], lab[j+1, i-1:i+2], [lab[j, i-1], lab[j, i+1]]])
            if (nb == lab[j, i]).sum() == 0:
                out[j, i] = np.bincount(nb, minlength=6).argmax()
    lab = out

# --- output colors: saturation boost + darken for white bg ---
def boost(c):
    mxc = c.max(-1, keepdims=True); mnc = c.min(-1, keepdims=True)
    mean = c.mean(-1, keepdims=True)
    c2 = np.clip(mean + (c - mean) * 1.45, 0, 1)      # more chroma
    return np.clip(c2 * 0.80, 0, 1)                   # darker for legibility
oc = boost(color)

CHARS = ['天', '桥', '山', '海', '树', '我']
cs = 16
pv = Image.new('RGB', (COLS * cs * 2 + 20, ROWS * cs), 'white')
d = ImageDraw.Draw(pv)
font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Songti.ttc', cs)
DBG = [(120, 170, 235), (200, 60, 40), (160, 130, 90), (40, 140, 170), (60, 140, 60), (30, 30, 30)]
for j in range(ROWS):
    for i in range(COLS):
        cc = tuple((oc[j, i] * 255).astype(int))
        d.text((i * cs, j * cs - cs * 0.12), CHARS[lab[j, i]], fill=cc, font=font)
        d.rectangle([COLS * cs + 20 + i * cs, j * cs, COLS * cs + 20 + (i + 1) * cs, (j + 1) * cs], fill=DBG[lab[j, i]])
pv.save('preview.png')

rows_s = [''.join(str(x) for x in lab[j]) for j in range(ROWS)]
hexs = ''.join('%01x%01x%01x' % tuple((oc[j, i] * 15.999).astype(int)) for j in range(ROWS) for i in range(COLS))
open('grid.txt', 'w').write('\n'.join(rows_s))
open('colors.txt', 'w').write(hexs)
print('grid', COLS, 'x', ROWS, dict(zip(CHARS, np.bincount(lab.ravel(), minlength=6))))
