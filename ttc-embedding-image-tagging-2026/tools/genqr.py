#!/usr/bin/env python3
"""Generate a QR code in the deck's house style and verify it scans.

Style: solid blue finder patterns (#0B64DD), black gapped/dotted data modules
(#1C1E23, ~16% gap), white background. Matches every QR in the deck so they read
as one set.

Usage:
    uv run tools/genqr.py "https://x.com/hxiao" img/qr-x.png
    uv run tools/genqr.py "https://hanxiao.io/aie-sf-2026" img/qr.png

Deps: qrcode, Pillow (and opencv-python-headless + numpy for the scan check).
    uv pip install qrcode Pillow opencv-python-headless numpy
"""
import sys
from qrcode import QRCode
from qrcode.constants import ERROR_CORRECT_M
from PIL import Image, ImageDraw

BLUE = (11, 100, 221)   # --accent
INK = (28, 30, 35)      # --ink


def make_qr(url, out, target=540, border=4, gap_ratio=0.16):
    qr = QRCode(error_correction=ERROR_CORRECT_M, border=0)
    qr.add_data(url)
    qr.make(fit=True)
    m = qr.get_matrix()
    n = len(m)
    total = n + 2 * border
    scale = max(12, target // total)
    size = total * scale
    img = Image.new("RGB", (size, size), "white")
    d = ImageDraw.Draw(img)
    in_finder = lambda r, c: (r < 7 and c < 7) or (r < 7 and c >= n - 7) or (r >= n - 7 and c < 7)
    gap = int(scale * gap_ratio)
    for r in range(n):
        for c in range(n):
            if not m[r][c]:
                continue
            x0, y0 = (c + border) * scale, (r + border) * scale
            if in_finder(r, c):                         # solid blue eyes, no gap
                d.rectangle([x0, y0, x0 + scale - 1, y0 + scale - 1], fill=BLUE)
            else:                                       # gapped black data modules
                d.rectangle([x0 + gap // 2, y0 + gap // 2,
                             x0 + scale - 1 - gap // 2, y0 + scale - 1 - gap // 2], fill=INK)
    img.save(out)
    return qr.version, n, size


def verify(url, out):
    import cv2
    data, _, _ = cv2.QRCodeDetector().detectAndDecode(cv2.imread(out))
    ok = data == url
    print(("OK   " if ok else "FAIL ") + out + "  v" + " decoded=" + (data or "<none>"))
    return ok


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)
    url, out = sys.argv[1], sys.argv[2]
    ver, n, size = make_qr(url, out)
    print("wrote %s  version=%d  modules=%d  px=%d" % (out, ver, n, size))
    try:
        if not verify(url, out):
            sys.exit(2)
    except ImportError:
        print("(install opencv-python-headless to auto-verify the scan)")
