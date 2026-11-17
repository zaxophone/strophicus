import { parseGabc, joinGabc, withoutText } from './gabc';

describe('parseGabc', () => {
  const plain = { bars: [], doubles: [], majors: [], ticks: [], moras: [], episemas: [], ictus: [], flats: [], flatLetters: [], liquescents: [], groups: [], breaks: [], words: undefined, clef: 'c' as const };

  it('reads the clef and one note per syllable', () => {
    expect(parseGabc('(c4) (f) (g) (h)')).toEqual({ ...plain, clefLine: 4, notes: 'fgh' });
  });

  it('reads a fa clef', () => {
    const p = parseGabc('(f3) (h) (g)');
    expect(p.clef).toBe('f');
    expect(p.clefLine).toBe(3);
    expect(() => parseGabc('(fb3) (h)')).toThrow();
  });

  it('needs a clef first, and only reads c1-c4 and f1-f4', () => {
    expect(() => parseGabc('(f) (g)')).toThrow(/clef/);
    expect(() => parseGabc('(c5) (g)')).toThrow(/clef/);
    expect(() => parseGabc('(cb4) (g)')).toThrow(/do clef/);
    expect(() => parseGabc('(c4) (g) (c3) (h)')).toThrow(/start/);
  });

  it('accepts a gabc header and comments', () => {
    const gabc = 'name: Test;\nmode: 1;\n%%\n(c3) % a comment\n(h) (g)';
    expect(parseGabc(gabc)).toEqual({ ...plain, clefLine: 3, notes: 'hg' });
  });

  it('turns a bar after a syllable into a bar before the next note', () => {
    expect(parseGabc('(c2) (c) (d) (e;) (e) (d) (c;) (c) (d) (d)')).toMatchObject({ notes: 'cdeedccdd', bars: [3, 6] });
    // inside the syllable's parentheses, or on its own
    expect(parseGabc('(c2) (c) (d;) (e)').bars).toEqual([2]);
    expect(parseGabc('(c2) (c) (d) (;) (e)').bars).toEqual([2]);
  });

  it('reads :: as a double bar, which is also a bar', () => {
    expect(parseGabc('(c2) (c) (d::) (e) (f;) (g) (h)')).toMatchObject({ bars: [2, 4], doubles: [2] });
  });

  it('reads a comma as a tick, which is not a bar', () => {
    expect(parseGabc('(c2) (c) (d,) (e) (f)')).toMatchObject({ ticks: [2], bars: [] });
  });

  it('ignores divisions before the first note or after the last', () => {
    expect(parseGabc('(c2) (;) (c) (d) (::)')).toEqual({ ...plain, clefLine: 2, notes: 'cd' });
    expect(parseGabc('(c2) (c) (d;)')).toEqual({ ...plain, clefLine: 2, notes: 'cd' });
  });

  it('reads . as a dot, _ as an episema, \' as an ictus, and a letter with x as a flat sign before the next note', () => {
    expect(parseGabc('(c3) (h.) (g_) (f._) (e\') (gxg)')).toMatchObject({
      moras: [0, 2],
      episemas: [1, 2],
      ictus: [3],
      flats: [4],
      flatLetters: ['g'],
    });
  });

  it('reads the flat sign as standing at its own height, not as a note', () => {
    const p = parseGabc("(c4) Ma(d)rí(ixdh'!iv)a,(h.)");
    expect(p.notes).toBe('ddhih');
    expect(p.flats).toEqual([1]);
    expect(p.flatLetters).toEqual(['i']);
    expect(() => parseGabc('(c4) (ix)')).toThrow(/followed by a note/);
    expect(() => parseGabc('(c4) (dixh)')).toThrow(/inside a figure/);
  });

  it('refuses a modifier that follows nothing, or is repeated', () => {
    for (const bad of ['(c2) (.)', '(c2) (c...)', '(c2) (c__)', "(c2) (c'')", '(c2) (cxx)', '(c2) (;.)']) {
      expect(() => parseGabc(bad)).toThrow();
    }
  });

  it('reads notes in one pair of parentheses as a group on one syllable', () => {
    const parsed = parseGabc('(c2) (c) (de) (f) (ghg)');
    expect(parsed.notes).toBe('cdefghg');
    expect(parsed.groups).toEqual([{ start: 1, length: 2 }, { start: 4, length: 3 }]);
  });

  it('puts a division before a group at its first note', () => {
    const parsed = parseGabc('(c2) (c;) (de,) (fg)');
    expect(parsed.bars).toEqual([1]);
    expect(parsed.ticks).toEqual([3]);
  });

  it('gives each note of a group its own dot or episema', () => {
    expect(parseGabc('(c2) (c) (de.)').moras).toEqual([2]);
    expect(parseGabc('(c2) (c) (d_e_)').episemas).toEqual([1, 2]);
    expect(parseGabc('(c2) (d_e_.)')).toMatchObject({ episemas: [0, 1], moras: [1] });
  });

 it('reads a forced line break as the note where the new line starts', () => {
    const p = parseGabc('(c4) De(h)us,(h) a(g;)(z) b(h) c(h)');
    expect(p.breaks).toEqual([3]);
    expect(p.notes).toBe('hhghh');
    expect(p.bars).toEqual([3]); // the bar before the break still belongs to the new line's first note
    expect(parseGabc('(c4) a(h) (z)').breaks).toEqual([]); // nothing follows it
    expect(() => parseGabc('(c4) a(h) x(z) b(h)')).toThrow();
  });

  it('reads a liquescent ending on a group', () => {
    const p = parseGabc('(c3) a(ghf~) b(f)');
    expect(p.liquescents).toEqual([{ note: 2, mark: '~' }]);
    expect(p.groups).toEqual([{ start: 0, length: 3 }]);
    expect(() => parseGabc('(c3) a(g~)')).toThrow(/last note of a group/);
    expect(() => parseGabc('(c3) a(g~h)')).toThrow(/last note of a group/);
  });

  it('reads a full bar (:) as a bar drawn across the whole staff', () => {
    const p = parseGabc('(c4) a(h:) b(h)');
    expect(p.bars).toEqual([1]);
    expect(p.majors).toEqual([1]);
    expect(p.doubles).toEqual([]);
  });

  it('refuses a division inside a group, or a note after one', () => {
    expect(() => parseGabc('(c2) (c) (d;e)')).toThrow();
    expect(() => parseGabc('(c2) (c) (d,e)')).toThrow();
  });

  it('refuses gabc it cannot draw instead of misreading it', () => {
    expect(() => parseGabc('(c2) (c) (d/)')).toThrow(/both sides/);
    expect(() => parseGabc('(c2) (c) (D)')).toThrow(/not read yet/);
    expect(() => parseGabc('(c2) (c) (d:::)')).toThrow(/one division/);
    expect(() => parseGabc('(c2) (c) (iy)')).toThrow(/not read yet/);
    expect(() => parseGabc('(c2) (c) (d&)')).toThrow(/not read yet/);
    expect(() => parseGabc('(c2) (n)')).toThrow();
    expect(() => parseGabc('(c2) (c')).toThrow(/never closed/);
    expect(() => parseGabc('(c2) (c) text')).toThrow();
  });

  describe('text', () => {
    it('has no words for a snippet without text', () => {
      expect(parseGabc('(c2) (c) (d)').words).toBeUndefined();
    });

    it('joins the syllables of a word, and splits words at a space', () => {
      const parsed = parseGabc('(c4) Pu(d)er(f) na(f)tus(e) in(f) Bét(g)le(f)hem,(e)');
      expect(parsed.words).toEqual(['Pu-', 'er', 'na-', 'tus', 'in', 'Bét-', 'le-', 'hem,']);
      expect(parsed.notes).toBe('dffefgfe');
    });

    it('keeps one word per syllable, a joined group counting as one', () => {
      const parsed = parseGabc('(c3) Ky(h)ri(f)e(fg) e(f)lé(f)i(e)son(f)');
      expect(parsed.words).toEqual(['Ky-', 'ri-', 'e', 'e-', 'lé-', 'i-', 'son']);
    });

    it('accepts a hyphen at the start of a syllable', () => {
      expect(parseGabc('(c2) Ky(f)-ri(g)-e(h)').words).toEqual(['Ky-', 'ri-', 'e']);
    });

    it('wants every syllable to have text, or none', () => {
      expect(() => parseGabc('(c2) Ky(f) (g) e(h)')).toThrow(/every syllable/);
    });

    it('does not allow a space inside one syllable\'s text', () => {
      expect(() => parseGabc('(c2) Ky ri(f)')).toThrow(/space/);
    });

    it('puts a bar after a word with its punctuation', () => {
      const parsed = parseGabc('(c4) Come,(h_;) let(h)');
      expect(parsed.words).toEqual(['Come,', 'let']);
      expect(parsed.bars).toEqual([1]);
      expect(parsed.episemas).toEqual([0]);
    });
  });
});

describe('gabc helpers', () => {
  it('takes the text away, keeping the clef and the divisions', () => {
    expect(withoutText('(c4) Pu(d)er(f) na(f;)tus(e)')).toBe('(c4) (d) (f) (f;) (e)');
  });

  it('joins snippets under the first one\'s clef', () => {
    expect(joinGabc('(c4) Pu(d)er(f;)', '(c4) Un(d)de(f)')).toBe('(c4) Pu(d)er(f;) Un(d)de(f)');
  });
});

describe('several neumes on one syllable', () => {
  it('reads ! / and a space as breaks between neumes, the text staying with the first', () => {
    const p = parseGabc("(c4) A(f)ve(c') Ma(d)rí(ghh!jv)a,(h.) (,) ple(g_[uh:l]h)na,(h..)");
    expect(p.notes).toBe('fcdghhjhghh');
    expect(p.groups).toEqual([{ start: 3, length: 3 }, { start: 8, length: 2 }]);
    expect(p.words).toEqual(['A-', 've', 'Ma-', 'rí-', '', 'a,', 'ple-', 'na,']);
    expect(p.episemas).toEqual([8]);
    expect(p.moras).toEqual([7, 10]);
  });

  it('reads a double dot as one dot, and a virga only on a single note', () => {
    expect(parseGabc('(c4) (h..)').moras).toEqual([0]);
    expect(() => parseGabc('(c4) (hgv)')).toThrow(/virga/);
  });
});
