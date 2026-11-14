export interface WavePoint {
  x: number;
  /** Height of the note the line passes by. */
  y: number;
  /**
   * Where the line goes at this note: above it (a note without an ictus), below
   * it (the ictus of a thesis), in a C that starts under it and wraps round its left
   * side (the ictus of an arsis), or in a loop all the way round it (the second of two
   * arses in a row).
   */
  at: 'above' | 'below' | 'c' | 'loop';
}

interface Knot {
  x: number;
  y: number;
  /** The line turns sharply here instead of passing through smoothly. */
  corner?: boolean;
}

/**
 * The line a hand draws in the air, as the workbook draws it over the staff: a
 * smooth curve that passes above every note except the ictus notes. It goes
 * under a thesis ictus. At an arsis ictus it makes a C: the line goes under the
 * note only as far as the ictus mark (halfway across), turns back sharply, goes
 * up the near side of the note and over the top, and the top of the C joins the
 * rest of the curve. A second arsis straight after one loops all the way round
 * its note. Apart from that loop the line never crosses itself. `reach` is how far above or
 * below a note the line goes, and `lead` how far it runs in before the first
 * note and out past the last. Returns an SVG path (y grows downward).
 */
export function wavePath(points: WavePoint[], reach: number, lead: number): string {
  if (points.length === 0) return '';
  const knots: Knot[] = [];
  // the height of the top of the last C or loop, which the line over the next plain note must not dip below
  let lastTop: number | null = null;
  let lastTopX = 0;
  points.forEach((p, i) => {
    const r = reach * 0.95;
    if (p.at === 'loop' && i > 0) {
      // The second arsis in a row, as the workbook draws it: an arch comes over from the left, down
      // the right of the note, round under it and up its left side, crossing the arch near the top,
      // and on over the top. A tall round loop with the note low in it; it crosses itself once.
      knots.push(
        { x: p.x - r * 1.5, y: p.y - r * 1.55 },
        { x: p.x - r * 0.4, y: p.y - r * 1.7 },
        { x: p.x + r * 0.55, y: p.y - r * 1.55 },
        { x: p.x + r * 1.05, y: p.y - r * 0.85 },
        { x: p.x + r * 1.0, y: p.y + r * 0.05 },
        { x: p.x + r * 0.5, y: p.y + r * 0.85 },
        { x: p.x - r * 0.15, y: p.y + r * 1.1 },
        { x: p.x - r * 0.95, y: p.y + r * 0.5 },
        { x: p.x - r * 1.05, y: p.y - r * 0.55 },
        { x: p.x - r * 0.6, y: p.y - r * 1.5 },
        { x: p.x + r * 0.2, y: p.y - r * 2.1 },
      );
      lastTop = p.y - r * 2.1;
      lastTopX = p.x + r * 0.2;
    } else if (p.at === 'c' || p.at === 'loop') {
      // The C open to the right. Its left side and bottom (R2, R1) are shared by the line coming in:
      // the incoming line runs just outside them (a hair away, `g`, so the two touch) down the left of
      // the note and in under it as far as its centre, where it turns back sharply into the C.
      const R1 = { x: p.x - r * 0.5, y: p.y + r * 0.82 };
      const R2 = { x: p.x - r * 0.96, y: p.y - r * 0.05 };
      const g = r * 0.16;
      if (i > 0) {
        // coming down the left side of the C almost vertically, then under it
        knots.push(
          { x: R2.x - r * 0.75, y: R2.y - r * 0.95 },
          { x: R2.x - g, y: R2.y - r * 0.05 },
          { x: R1.x - g * 0.7, y: R1.y + g },
        );
      }
      // the sharp turn under the ictus mark, then back out and up round the note; the top of
      // the C carries straight on into the rest of the curve
      knots.push(
        { x: p.x, y: p.y + r * 0.9, corner: true },
        R1,
        R2,
        { x: p.x - r * 0.05, y: p.y - r * 1.1 },
      );
      lastTop = p.y - r * 1.1;
      lastTopX = p.x - r * 0.05;
    } else if (p.at === 'above') {
      // over a plain note the line is a crest, never a dip: not lower than the top of a C before it,
      // and on the way into a loop it simply rises along the line from that top to the loop's arch
      const crest = p.y - reach;
      const afterArsis = i > 0 && (points[i - 1].at === 'c' || points[i - 1].at === 'loop') && lastTop !== null;
      const next = points[i + 1];
      if (afterArsis && next && next.at === 'loop') {
        const archX = next.x - r * 1.5;
        const archY = next.y - r * 1.55;
        const t = Math.min(1, Math.max(0, (p.x - lastTopX) / (archX - lastTopX)));
        knots.push({ x: p.x, y: Math.min(crest, lastTop! + (archY - lastTop!) * t) });
      } else {
        knots.push({ x: p.x, y: afterArsis ? Math.min(crest, lastTop! - reach * 0.3) : crest });
      }
    } else {
      knots.push({ x: p.x, y: p.y + reach });
      lastTop = null;
    }
  });
  const first = points[0];
  const last = points[points.length - 1];
  // The line runs in from below a first note it goes over (a C begins under its note, so it
  // needs no run-in), and out downward after any last note but a thesis.
  if (first.at !== 'c' && first.at !== 'loop') knots.unshift({ x: first.x - lead, y: first.y + (first.at === 'below' ? -reach : reach) * 0.6 });
  knots.push({ x: last.x + lead, y: last.y + (last.at === 'below' ? -reach : reach) * 0.6 });

  // Split at the corners, and run a Catmull-Rom curve through each stretch, written as cubic segments.
  const runs: Knot[][] = [[]];
  for (const k of knots) {
    runs[runs.length - 1].push(k);
    if (k.corner) runs.push([k]);
  }
  const f = (n: number) => n.toFixed(1);
  let d = `M ${f(knots[0].x)} ${f(knots[0].y)}`;
  // A control point further than about half the chord from its end makes a hook behind the point, so
  // each tangent is limited to that.
  const tangent = (from: Knot, to: Knot, dx: number, dy: number): [number, number] => {
    const chord = Math.hypot(to.x - from.x, to.y - from.y);
    const length = Math.hypot(dx, dy);
    const k = length > chord * 0.5 ? (chord * 0.5) / length : 1;
    return [dx * k, dy * k];
  };
  for (const run of runs) {
    for (let i = 0; i < run.length - 1; i++) {
      const p0 = run[Math.max(0, i - 1)];
      const p1 = run[i];
      const p2 = run[i + 1];
      const p3 = run[Math.min(run.length - 1, i + 2)];
      const [ax, ay] = tangent(p1, p2, (p2.x - p0.x) / 6, (p2.y - p0.y) / 6);
      const [bx, by] = tangent(p1, p2, (p3.x - p1.x) / 6, (p3.y - p1.y) / 6);
      d += ` C ${f(p1.x + ax)} ${f(p1.y + ay)} ${f(p2.x - bx)} ${f(p2.y - by)} ${f(p2.x)} ${f(p2.y)}`;
    }
  }
  return d;
}
