#!/usr/bin/env python3
"""Finds every four-line staff on a scanned page and reads each with read_staff.py.

  python3 tools/read_page.py page.png outdir

Writes outdir/staff-N.png (the crop, with its overlay as staff-N.overlay.png) and
prints each staff's heads. Check the overlays against the scan before trusting them.
"""
import os
import subprocess
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi


def main():
    page, outdir = sys.argv[1], sys.argv[2]
    os.makedirs(outdir, exist_ok=True)
    img = Image.open(page).convert('L')
    dark = np.array(img) < 120
    h, w = dark.shape
    # longest dark run in each row, from a horizontal closing so bent lines still count
    closed = ndi.binary_closing(dark, structure=np.ones((1, 9)))
    longest = np.zeros(h)
    for y in range(h):
        row = closed[y]
        if row.any():
            edges = np.diff(np.concatenate(([0], row.astype(int), [0])))
            starts, ends = np.nonzero(edges == 1)[0], np.nonzero(edges == -1)[0]
            longest[y] = (ends - starts).max()
    rows = np.nonzero(longest > float(os.environ.get('RUNFRAC', '0.12')) * w)[0]
    ridges = []
    for y in rows:
        if ridges and y - ridges[-1][-1] <= 3:
            ridges[-1].append(y)
        else:
            ridges.append([y])
    centres = [float(np.mean(r)) for r in ridges]
    staves, i = [], 0
    while i + 3 < len(centres):
        gaps = np.diff(centres[i:i + 4])
        if gaps.min() > 25 and gaps.max() < 1.25 * gaps.min() + 8:
            staves.append((centres[i], centres[i + 3], gaps.mean()))
            i += 4
        else:
            i += 1
    for n, (top, bottom, space) in enumerate(staves, 1):
        crop = img.crop((0, int(max(0, top - 2.2 * space)), w, int(min(h, bottom + 2.2 * space))))
        path = os.path.join(outdir, f'staff-{n}.png')
        crop.save(path)
        done = subprocess.run([sys.executable, os.path.join(os.path.dirname(__file__), 'read_staff.py'), path, '--overlay'],
                              capture_output=True, text=True)
        print(f'staff {n} (y {int(top)}-{int(bottom)}):', done.stdout.strip() or done.stderr.strip())


main()
