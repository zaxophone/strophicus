import type { GlyphName } from './glyphs';

/**
 * Geometry of the Greciliae font, in font units (1000 to the em). The font is
 * drawn so that the staff has a fixed place relative to each glyph's origin:
 * the centre of the bottom line is LINE_1 units from it, and the lines are
 * LINE_PITCH apart. Everything here follows GregorioTeX's own placement rules.
 */
export const UNITS_PER_EM = 1000;
/** Distance between the centres of adjacent staff lines. */
export const LINE_PITCH = 315;
/** One step: from a line to the space beside it. */
export const STEP = LINE_PITCH / 2;
/** Height of the centre of the bottom staff line above the glyph origin. */
export const LINE_1 = -422.5;
/** How far the centre of a note head sits above its glyph's origin. */
export const HEAD_CENTRE = 66.5;
/** How far the centre of the mora dot sits above its glyph's origin. */
export const MORA_CENTRE = 83.5;
/** Thickness of a staff line. */
export const LINE_THICKNESS = 15;
/** Space between the two strokes of a divisio finalis. */
export const FINALIS_GAP = 182;

/**
 * Raise of a do or fa clef glyph above where it is drawn on the middle line:
 * the glyph is made for the third line, and moves up a line pitch per line.
 */
export function clefRaise(clefLine: number): number {
  return LINE_PITCH * (clefLine - 3);
}

type CustosGlyph = Extract<GlyphName, `Custos${string}`>;

/**
 * The custos for a note at staff position `p` on a four-line staff: its tail
 * points toward the middle of the staff, and is longer the further the note
 * is from the lines. This is GregorioTeX's table.
 */
const CUSTOS: Record<number, CustosGlyph> = {
  [-3]: 'CustosUpMedium',
  [-2]: 'CustosUpLong',
  [-1]: 'CustosUpShort',
  0: 'CustosUpLong',
  1: 'CustosUpShort',
  2: 'CustosUpLong',
  3: 'CustosUpShort',
  4: 'CustosUpLong',
  5: 'CustosUpShort',
  6: 'CustosDownLong',
  7: 'CustosDownShort',
  8: 'CustosDownLong',
  9: 'CustosDownMedium',
  10: 'CustosDownLong',
  11: 'CustosDownMedium',
};

export function custosGlyph(position: number): CustosGlyph {
  const clamped = Math.max(-3, Math.min(11, Math.round(position)));
  return CUSTOS[clamped];
}
