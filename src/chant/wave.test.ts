import { WavePoint, wavePath } from './wave';

/** The path as a polyline: each cubic segment sampled. */
function polyline(d: string, steps = 24): [number, number][] {
  const nums = d.replace(/[MC]/g, ' ').trim().split(/\s+/).map(Number);
  const out: [number, number][] = [[nums[0], nums[1]]];
  let [x0, y0] = out[0];
  for (let i = 2; i < nums.length; i += 6) {
    const [x1, y1, x2, y2, x3, y3] = nums.slice(i, i + 6);
    for (let t = 1; t <= steps; t++) {
      const u = t / steps;
      const a = (1 - u) ** 3;
      const b = 3 * (1 - u) ** 2 * u;
      const c = 3 * (1 - u) * u ** 2;
      const e = u ** 3;
      out.push([a * x0 + b * x1 + c * x2 + e * x3, a * y0 + b * y1 + c * y2 + e * y3]);
    }
    [x0, y0] = [x3, y3];
  }
  return out;
}

function crosses(p: [number, number][]): boolean {
  const cross = (a: number[], b: number[], c: number[]) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  for (let i = 0; i < p.length - 1; i++) {
    for (let j = i + 3; j < p.length - 1; j++) {
      const [a, b, c, e] = [p[i], p[i + 1], p[j], p[j + 1]];
      if (cross(a, b, c) * cross(a, b, e) < 0 && cross(c, e, a) * cross(c, e, b) < 0) return true;
    }
  }
  return false;
}

describe('wavePath', () => {
  it('is empty without notes', () => {
    expect(wavePath([], 10, 5)).toBe('');
  });

  it('passes above a note, and below a thesis note', () => {
    const d = wavePath(
      [
        { x: 40, y: 100, at: 'above' },
        { x: 120, y: 100, at: 'below' },
      ],
      12,
      20,
    );
    expect(d.startsWith('M 20.0')).toBe(true);
    expect(d).toContain('40.0 88.0'); // above (y grows downward)
    expect(d).toContain('120.0 112.0'); // below
    // lead-in, two notes, run-out: three cubic segments
    expect(d.match(/ C /g)).toHaveLength(3);
  });

  it('starts a first arsis as a C under the note, at its centre', () => {
    const d = wavePath([{ x: 100, y: 100, at: 'c' }], 10, 20);
    // the C begins under the note, at the ictus mark halfway across, with no run-in
    expect(d.startsWith('M 100.0 108.')).toBe(true);
    // four points make the C, then a run-out
    expect(d.match(/ C /g)).toHaveLength(4);
    // and goes up round the left side of the note
    expect(d).toMatch(/ 9[01]\.\d 99\.\d/);
  });

  it('goes under a later arsis only as far as its centre, then turns sharply back', () => {
    const d = wavePath(
      [
        { x: 40, y: 100, at: 'above' },
        { x: 120, y: 100, at: 'c' },
      ],
      10,
      20,
    );
    // the sharp turn is under the note's centre, and nothing of the line goes under it further right
    expect(d).toContain('120.0 108.');
    const under = polyline(d).filter(([x, y]) => y > 100 + 6 && x > 120.5);
    expect(under).toEqual([]);
  });

  it('never crosses itself', () => {
    const cases: WavePoint[][] = [
      [{ x: 100, y: 100, at: 'loop' }],
      [
        { x: 40, y: 100, at: 'above' },
        { x: 120, y: 100, at: 'c' },
        { x: 200, y: 100, at: 'above' },
        { x: 280, y: 100, at: 'below' },
      ],
      [
        { x: 40, y: 100, at: 'c' },
        { x: 120, y: 100, at: 'above' },
        { x: 200, y: 100, at: 'c' },
      ],
      [
        { x: 40, y: 100, at: 'below' },
        { x: 120, y: 90, at: 'c' },
        { x: 200, y: 110, at: 'below' },
        { x: 280, y: 110, at: 'c' },
      ],
      [
        { x: 40, y: 100, at: 'c' },
        { x: 100, y: 100, at: 'c' },
      ],
    ];
    cases.forEach((points, i) => expect([i, crosses(polyline(wavePath(points, 11, 20)))]).toEqual([i, false]));
  });

  it('loops all the way round a second arsis in a row, crossing itself once', () => {
    const d = wavePath(
      [
        { x: 40, y: 100, at: 'c' },
        { x: 120, y: 100, at: 'loop' },
      ],
      10,
      20,
    );
    const line = polyline(d);
    expect(crosses(line)).toBe(true);
    // the loop goes round the note: points above it, to its right, under it and to its left
    const near = line.filter(([x]) => Math.abs(x - 120) < 14);
    expect(near.some(([, y]) => y < 100 - 8)).toBe(true);
    expect(near.some(([, y]) => y > 100 + 8)).toBe(true);
    expect(line.some(([x, y]) => x > 127 && Math.abs(y - 100) < 6)).toBe(true);
    expect(line.some(([x, y]) => x < 112 && Math.abs(y - 100) < 6 && x > 105)).toBe(true);
  });
});
