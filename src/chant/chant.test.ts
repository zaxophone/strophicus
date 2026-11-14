import {
  BAR_UNITS,
  degree,
  layoutBreaks,
  makeChant,
  parsePhrases,
  separators,
  systemUnits,
  ledgerLines,
  semitonesAboveDo,
  solfegeName,
  splitSystems,
  staffPosition,
  unitIndexOf,
  unitLabels,
  units,
} from './chant';

describe('chant pitches', () => {
  it('puts the staff lines at d, f, h and j', () => {
    expect(['d', 'f', 'h', 'j'].map(staffPosition)).toEqual([0, 2, 4, 6]);
  });

  it('reads an ascending scale from a do clef on the second line', () => {
    const scale = 'fghijklm';
    expect([...scale].map((n) => solfegeName(n, 2))).toEqual([
      'do', 're', 'mi', 'fa', 'sol', 'la', 'ti', 'do',
    ]);
    expect([...scale].map((n) => semitonesAboveDo(n, 2))).toEqual([0, 2, 4, 5, 7, 9, 11, 12]);
  });

  it('moves with the clef', () => {
    // the same written note is do on line 3 and sol on line 1
    expect(solfegeName('h', 3)).toBe('do');
    expect(solfegeName('h', 1)).toBe('sol');
    expect(degree('d', 4)).toBe(-6);
  });

  it('counts notes below do', () => {
    expect(solfegeName('e', 2)).toBe('ti');
    expect(semitonesAboveDo('e', 2)).toBe(-1);
    expect(semitonesAboveDo('d', 2)).toBe(-3);
  });
});

describe('ledgerLines', () => {
  it('needs none inside the staff', () => {
    expect(ledgerLines(0)).toEqual([]);
    expect(ledgerLines(5)).toEqual([]);
    expect(ledgerLines(6)).toEqual([]);
  });

  it('draws one line for a note on it and for the space above it', () => {
    expect(ledgerLines(8)).toEqual([8]);
    expect(ledgerLines(9)).toEqual([8]);
    expect(ledgerLines(10)).toEqual([8, 10]);
  });

  it('works below the staff', () => {
    expect(ledgerLines(-1)).toEqual([]);
    expect(ledgerLines(-2)).toEqual([-2]);
    expect(ledgerLines(-3)).toEqual([-2]);
    expect(ledgerLines(-4)).toEqual([-2, -4]);
  });
});

describe('splitSystems', () => {
  it('breaks lines at the given indexes', () => {
    expect(splitSystems([1, 2, 3, 4, 5], [2])).toEqual([[1, 2], [3, 4, 5]]);
    expect(splitSystems([1, 2, 3], [])).toEqual([[1, 2, 3]]);
  });
});

describe('parsePhrases', () => {
  const plain = { bars: [], doubles: [], ticks: [], moras: [], episemas: [], ictus: [], groups: [] };

  it('turns bars between phrases into note indexes', () => {
    expect(parsePhrases('cde|edc|cdd')).toEqual({ ...plain, notes: 'cdeedccdd', bars: [3, 6] });
    expect(parsePhrases(' cd | e ')).toEqual({ ...plain, notes: 'cde', bars: [2] });
    expect(parsePhrases('fgh')).toEqual({ ...plain, notes: 'fgh' });
  });

  it('reads a dot as a mora on the note before it', () => {
    expect(parsePhrases('cd.e')).toEqual({ ...plain, notes: 'cde', moras: [1] });
    expect(parsePhrases('c.d|e.f')).toEqual({ ...plain, notes: 'cdef', bars: [2], moras: [0, 2] });
  });

  it('reads an underscore as an episema on the note before it', () => {
    expect(parsePhrases('c_de_.')).toEqual({ ...plain, notes: 'cde', episemas: [0, 2], moras: [2] });
  });

  it('reads two bars together as a double bar, which is also a bar', () => {
    expect(parsePhrases('cd||ef|gh')).toEqual({ ...plain, notes: 'cdefgh', bars: [2, 4], doubles: [2] });
    expect(parsePhrases('cd | | ef').doubles).toEqual([2]);
  });

  it('reads a comma as a tick, which is not a bar', () => {
    expect(parsePhrases('c,def')).toEqual({ ...plain, notes: 'cdef', ticks: [1] });
  });

  it('ignores a bar or tick before the first note or after the last', () => {
    expect(parsePhrases('|cd||')).toEqual({ ...plain, notes: 'cd' });
    expect(parsePhrases(',cd,')).toEqual({ ...plain, notes: 'cd' });
  });

  it('rejects a dot or episema that follows nothing or the same mark twice', () => {
    expect(() => parsePhrases('.cd')).toThrow();
    expect(() => parsePhrases('cd..')).toThrow();
    expect(() => parsePhrases('_c')).toThrow();
    expect(() => parsePhrases('c|.d')).toThrow();
  });
});

describe('groups of notes', () => {
  it('reads square brackets as notes on one syllable', () => {
    const parsed = parsePhrases('c[de]f[ghg]');
    expect(parsed.notes).toBe('cdefghg');
    expect(parsed.groups).toEqual([{ start: 1, length: 2 }, { start: 4, length: 3 }]);
  });

  it('puts a bar or tick before a group, at its first note', () => {
    const parsed = parsePhrases('c|[de],[fg]');
    expect(parsed.bars).toEqual([1]);
    expect(parsed.ticks).toEqual([3]);
  });

  it('lets a dot after a group go on its last note, and an episema over all of them', () => {
    expect(parsePhrases('c[de].').moras).toEqual([2]);
    expect(parsePhrases('c[de]_').episemas).toEqual([1, 2]);
    expect(parsePhrases('[de]_.')).toMatchObject({ episemas: [0, 1], moras: [1] });
  });

  it('rejects groups that are unfinished, nested, tiny, or hold a bar', () => {
    for (const bad of ['c[de', 'cd]e', 'c[[de]]', 'c[d]e', 'c[d|e]f', 'c[d,e]f', 'c[]d']) {
      expect(() => parsePhrases(bad)).toThrow();
    }
  });

  it('counts a syllable for each group and for each note on its own', () => {
    const chant = makeChant('c[de]f[ghg]', 2);
    expect(units(chant)).toEqual([
      { start: 0, length: 1 },
      { start: 1, length: 2 },
      { start: 3, length: 1 },
      { start: 4, length: 3 },
    ]);
    expect([0, 1, 2, 3, 4, 5, 6].map((k) => unitIndexOf(chant, k))).toEqual([0, 1, 1, 2, 3, 3, 3]);
    expect(unitLabels(chant, ['do', 're', 'mi', 'fa', 'sol', 'la', 'sol'])).toEqual(['do', 're mi', 'fa', 'sol la sol']);
  });

  it('refuses a group that cannot be drawn as one figure', () => {
    expect(() => makeChant('c[dd]e', 2)).toThrow(/single figure/);
    expect(() => makeChant('c[fedc]e', 2)).toThrow(/single figure/);
    expect(() => makeChant('c[de]e', 2)).not.toThrow();
  });
});

describe('separators', () => {
  it('lists every bar and tick in order', () => {
    expect(separators({ bars: [6, 3], ticks: [1] })).toEqual([1, 3, 6]);
  });
});

describe('layoutBreaks', () => {
  it('does not split at a tick, only at the bars between phrases', () => {
    // a tick after the first note must not leave that note alone on a line
    expect(layoutBreaks(10, [1], [], 6, [])).toEqual([5]);
    // with no bar to split at, the notes are shared out: no stray note on the last line
    expect(layoutBreaks(11, [], [], 5)).toEqual([4, 8]);
    // and a bar that is too far along to fit is not used either
    expect(layoutBreaks(10, [1, 8], [], 6, [8])).toEqual([5]);
    expect(layoutBreaks(10, [1, 5], [], 6, [5])).toEqual([5]);
  });

  it('counts a bar as extra room', () => {
    expect(systemUnits(0, 6, [3])).toBeCloseTo(6 + BAR_UNITS);
    expect(systemUnits(3, 6, [3])).toBe(3); // a bar at the start of a line isn't drawn
  });

  it('keeps forced breaks and does not split short lines', () => {
    expect(layoutBreaks(15, [], [8], 20)).toEqual([8]);
    expect(layoutBreaks(5, [], [], 11)).toEqual([]);
  });

  it('splits an over-long line at a bar', () => {
    // 3 + 3 + 3 + 3 + 3 notes with bars between, room for about 11 notes
    const bars = [3, 6, 9, 12];
    expect(layoutBreaks(15, bars, [], 11)).toEqual([9]);
  });

  it('splits mid-phrase when a phrase is longer than a line', () => {
    // evenly, rather than filling lines to capacity and leaving a stray pair at the end
    expect(layoutBreaks(12, [], [], 5)).toEqual([4, 8]);
  });

  it('never makes a line longer than the capacity', () => {
    const bars = [4, 8, 13];
    const breaks = layoutBreaks(18, bars, [], 7);
    const edges = [0, ...breaks, 18];
    for (let i = 0; i < edges.length - 1; i++) {
      expect(systemUnits(edges[i], edges[i + 1], bars)).toBeLessThanOrEqual(7);
    }
  });
});
