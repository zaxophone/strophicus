#!/usr/bin/env python3
"""Reads the note heads of one printed staff from a scan, as gabc letters.

  python3 tools/read_staff.py crop.png [--clef 4]

The crop should hold a single four-line staff (clef included). Prints the heads
left to right as gabc letters (the bottom line is `d`), with `|` where two heads
are close enough to belong to one neume. A reading aid for transcribing the
instructor edition, not part of the app: check the result against the scan.
"""
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi


def pick_four(smooth, floor):
    """The evenly spaced four ridges of a row histogram, or None."""
    from itertools import combinations
    peaks = [y for y in range(1, len(smooth) - 1) if smooth[y] >= smooth[y - 1] and smooth[y] > smooth[y + 1] and smooth[y] > floor]
    peaks = sorted(peaks, key=lambda y: -smooth[y])[:9]
    best = None
    for combo in combinations(sorted(peaks), 4):
        gaps = np.diff(combo)
        if gaps.min() < 30 or gaps.max() > 1.2 * gaps.min() + 6:
            continue
        strength = sum(smooth[y] for y in combo)
        if best is None or strength > best[0]:
            best = (strength, combo)
    return list(best[1]) if best else None


def staff_lines(dark):
    """Four lines as functions of x. Pages are often bent, so each stretch of the staff is read on its own."""
    h, w = dark.shape
    win = 150
    xs, rows = [], []
    for x0 in range(0, w - win + 1, win // 3):
        band = dark[:, x0:x0 + win].mean(axis=1)
        smooth = ndi.uniform_filter1d(band, 5)
        found = pick_four(smooth, 0.55)
        if found:
            xs.append(x0 + win / 2)
            rows.append(found)
    if len(xs) < 3:
        sys.exit('could not find four staff lines')
    rows = np.array(rows, dtype=float)
    return [lambda x, i=i: float(np.interp(x, xs, rows[:, i])) for i in range(4)]


def main():
    path = sys.argv[1]
    img = np.array(Image.open(path).convert('L'))
    dark = img < int(os.environ.get('THRESH', '120'))
    lines = staff_lines(dark)
    # only look around the staff: titles and words above and below are not notes
    mid = int(np.mean([lines[0](img.shape[1] / 2), lines[3](img.shape[1] / 2)]))
    span = int(lines[3](img.shape[1] / 2) - lines[0](img.shape[1] / 2))
    keep = np.zeros_like(dark)
    keep[max(0, mid - span): mid + span, :] = True
    dark = dark & keep
    # the staff starts where its lines do; the clef sits just inside that
    on_lines = np.zeros(dark.shape[1])
    for f in lines:
        for x in range(dark.shape[1]):
            y = int(round(f(x)))
            on_lines[x] += dark[max(0, y - 3): y + 4, x].any()
    left = int(np.argmax(on_lines >= 3))
    # note heads are the blobs left after removing thin things (lines, stems, text strokes)
    opened = ndi.binary_opening(dark, structure=np.ones((13, 13)))
    dist = ndi.distance_transform_edt(opened)
    peaks = (dist == ndi.maximum_filter(dist, size=21)) & (dist > 8)
    labels, count = ndi.label(peaks)
    heads = []
    for i in range(1, count + 1):
        ys, xs = np.nonzero(labels == i)
        heads.append((float(xs.mean()), float(ys.mean())))
    heads = [hd for hd in heads if hd[0] > left + 1.4 * span / 3]  # past the clef
    heads.sort()
    out = []
    previous = None
    clef_x = None
    for x, y in heads:
        top, bottom = lines[0](x), lines[3](x)
        space = (bottom - top) / 3
        pos = (bottom - y) / (space / 2)
        step = int(round(pos))
        out.append((x, step, pos))
    # heads close together belong to one neume; heads stacked in one column read bottom to top
    groups, current = [], []
    for k, (x, step, pos) in enumerate(out):
        if current and x - out[k - 1][0] < 60:
            current.append((x, step))
        else:
            if current:
                groups.append(current)
            current = [(x, step)]
    if current:
        groups.append(current)
    words = []
    for g in groups:
        ordered, k = [], 0
        while k < len(g):
            column = [g[k]]
            while k + 1 < len(g) and g[k + 1][0] - column[0][0] < 18:
                k += 1
                column.append(g[k])
            ordered += sorted(c[1] for c in column)
            k += 1
        words.append('(' + ''.join(chr(ord('d') + st) for st in ordered) + ')')
    print(' '.join(words))
    if len(sys.argv) > 2 and sys.argv[2] == '--overlay':
        from PIL import ImageDraw
        pic = Image.open(path).convert('RGB')
        d = ImageDraw.Draw(pic)
        for f in lines:
            d.line([(0, f(0)), (pic.width, f(pic.width))], fill=(255, 0, 0), width=2)
        for x, step, pos in out:
            d.ellipse([x - 12, (lines[3](x) - step * (lines[3](x) - lines[0](x)) / 6) - 12, x + 12, (lines[3](x) - step * (lines[3](x) - lines[0](x)) / 6) + 12], outline=(0, 160, 0), width=3)
            d.text((x - 6, 5), chr(ord('d') + step), fill=(0, 0, 255))
        pic.save(path.replace('.png', '.overlay.png'))


main()
