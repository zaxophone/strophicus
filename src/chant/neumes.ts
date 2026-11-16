import { GLYPHS } from './glyphs';
import { NEUME_GLYPHS, NEUME_TABLE, NeumeGlyph } from './neumeTable';

/**
 * How a group ends, when its last note is a liquescent (gabc `~`, `>`, `<`: a note sung as a
 * half-voiced consonant, drawn small and with a tail), or '' for an ordinary last note.
 */
export type Liquescent = '' | '~' | '>' | '<';

/** The groups of two or three notes that are written as one joined figure. */
export type NeumeShape = 'pes' | 'flexus' | 'torculus' | 'porrectus' | 'scandicus' | 'repeat';

/** Width of one note head in font units; a glyph is as many heads wide as it has notes side by side. */
export const HEAD_UNITS = 166;

/**
 * Which head of the glyph (counting from the left, 0 first) each note of a shape
 * sits in. A podatus stacks its two notes in one head's width; a scandicus is a
 * single note and then a podatus.
 */
const HEADS: Record<NeumeShape, number[]> = {
  pes: [0, 0],
  flexus: [0, 1],
  torculus: [0, 1, 2],
  porrectus: [0, 1, 2],
  scandicus: [0, 1, 1],
  repeat: [],
};

export interface Neume {
  shape: NeumeShape;
  glyph: NeumeGlyph;
  /** The head each note sits in, from the left, as in `HEADS`. */
  heads: number[];
}

/** The shape of a group from the staff positions of its notes, and its steps between notes, if it is one we can draw. */
function classify(positions: number[]): { shape: NeumeShape; steps: number[] } | null {
  const steps = positions.slice(1).map((p, i) => p - positions[i]);
  if (steps.length === 1) {
    if (steps[0] > 0) return { shape: 'pes', steps };
    if (steps[0] < 0) return { shape: 'flexus', steps: [-steps[0]] };
  }
  if (steps.length === 2) {
    const [a, b] = steps;
    if (a > 0 && b < 0) return { shape: 'torculus', steps: [a, -b] };
    if (a < 0 && b > 0) return { shape: 'porrectus', steps: [-a, b] };
    if (a > 0 && b > 0) return { shape: 'scandicus', steps };
  }
  return null;
}

/**
 * The figure for notes sung on one syllable, given their staff positions (the
 * bottom line is 0, each step is 1), or null if there is no single glyph for them.
 */
export function neumeFor(positions: number[], liquescent: Liquescent = ''): Neume | null {
  // the same note two or three times on one syllable: separate puncta side by side (gabc `(gg)`)
  if (positions.length > 1 && positions.length <= 3 && positions.every((p) => p === positions[0])) {
    const count = positions.length;
    return {
      shape: 'repeat',
      glyph: { char: GLYPHS.Punctum.char.repeat(count), advance: GLYPHS.Punctum.advance * count },
      heads: positions.map((_, i) => i),
    };
  }
  const found = classify(positions);
  if (!found) return null;
  const index = NEUME_TABLE[`${found.shape}:${positions[0]}:${found.steps.join('-')}${liquescent}`];
  if (index === undefined) return null;
  return { shape: found.shape, glyph: NEUME_GLYPHS[index], heads: HEADS[found.shape] };
}
