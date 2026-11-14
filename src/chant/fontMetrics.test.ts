import {
  clefRaise,
  custosGlyph,
  HEAD_CENTRE,
  LINE_1,
  LINE_PITCH,
  STEP,
} from './fontMetrics';
import { GLYPHS } from './glyphs';

describe('font metrics', () => {
  it('has steps half a line pitch apart', () => {
    expect(STEP * 2).toBe(LINE_PITCH);
  });

  it('keeps the bottom line below the glyph origin and the top line above it', () => {
    const top = LINE_1 + 3 * LINE_PITCH;
    expect(LINE_1).toBeLessThan(0);
    expect(top).toBeGreaterThan(0);
    // the third line is the one the glyphs are drawn around
    expect(LINE_1 + 2 * LINE_PITCH).toBeCloseTo(207.5);
  });

  it('centres a note head within a step or so of the third line', () => {
    expect(Math.abs(HEAD_CENTRE - (LINE_1 + 2 * LINE_PITCH))).toBeLessThan(STEP);
  });
});

describe('clefRaise', () => {
  it('moves a clef up a line pitch per line above the third', () => {
    expect(clefRaise(3)).toBe(0);
    expect(clefRaise(4)).toBe(LINE_PITCH);
    expect(clefRaise(2)).toBe(-LINE_PITCH);
  });
});

describe('custosGlyph', () => {
  it('points the tail up from low notes and down from high ones', () => {
    for (const p of [-3, -1, 0, 3, 5]) expect(custosGlyph(p)).toMatch(/^CustosUp/);
    for (const p of [6, 7, 9, 11]) expect(custosGlyph(p)).toMatch(/^CustosDown/);
  });

  it('follows GregorioTeX for the notes of a four-line staff', () => {
    expect(custosGlyph(0)).toBe('CustosUpLong'); // on the bottom line
    expect(custosGlyph(1)).toBe('CustosUpShort');
    expect(custosGlyph(6)).toBe('CustosDownLong'); // on the top line
    expect(custosGlyph(7)).toBe('CustosDownShort');
  });

  it('clamps notes far outside the table', () => {
    expect(custosGlyph(-10)).toBe(custosGlyph(-3));
    expect(custosGlyph(20)).toBe(custosGlyph(11));
  });

  it('always names a glyph the font table has', () => {
    for (let p = -4; p <= 12; p++) expect(GLYPHS[custosGlyph(p)]).toBeDefined();
  });
});
