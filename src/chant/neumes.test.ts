import { HEAD_UNITS, neumeFor } from './neumes';

describe('neumeFor', () => {
  it('draws two rising notes as a podatus, one head wide, whatever the interval', () => {
    for (const second of [1, 2, 3, 4, 5]) {
      const n = neumeFor([2, 2 + second])!;
      expect(n.shape).toBe('pes');
      expect(n.glyph.advance).toBe(HEAD_UNITS);
      expect(n.heads).toEqual([0, 0]);
    }
  });

  it('draws two falling notes as a clivis, two heads wide', () => {
    const n = neumeFor([4, 3])!;
    expect(n.shape).toBe('flexus');
    expect(n.glyph.advance).toBeGreaterThan(300);
    expect(n.heads).toEqual([0, 1]);
  });

  it('tells the three-note shapes apart by which way the middle note goes', () => {
    expect(neumeFor([2, 3, 2])!.shape).toBe('torculus');
    expect(neumeFor([4, 3, 4])!.shape).toBe('porrectus');
    expect(neumeFor([2, 3, 4])!.shape).toBe('scandicus');
  });

  it('gives a different glyph where the height changes the drawing', () => {
    // GregorioTeX picks a long tail or another width by where the notes sit
    const glyphs = new Set([-3, -2, -1, 0, 1, 2, 3, 4].map((p) => neumeFor([p + 3, p + 2])!.glyph.char));
    expect(glyphs.size).toBeGreaterThan(1);
  });

  it('declines groups it cannot draw as one figure', () => {
    expect(neumeFor([2, 2])).toBeNull(); // the same note twice
    expect(neumeFor([4, 3, 2])).toBeNull(); // three falling notes
    expect(neumeFor([2, 3, 4, 5])).toBeNull(); // four notes
    expect(neumeFor([2, 9])).toBeNull(); // too wide a leap
    expect(neumeFor([12, 13])).toBeNull(); // off a four-line staff
  });
});
