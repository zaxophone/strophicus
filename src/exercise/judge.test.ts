import type { SungNote } from '../pitch/noteSegmenter';
import { describeError, isComplete, judgeMelody, SETTLE_FRAMES } from './judge';

const sing = (...midis: number[]): SungNote[] =>
  midis.map((midi, i) => ({
    midi,
    startFrame: i * 20,
    frames: 15,
    open: i === midis.length - 1,
  }));

const DO_RE_MI_RE_DO = [0, 2, 4, 2, 0];

describe('judgeMelody', () => {
  it('passes a correct melody from any starting pitch', () => {
    for (const start of [50, 60.4, 71.7]) {
      const j = judgeMelody(
        sing(start, start + 2, start + 4, start + 2, start),
        DO_RE_MI_RE_DO,
      );
      expect(j.passed).toBe(true);
    }
  });

  it('accepts notes within tolerance of their place', () => {
    const j = judgeMelody(sing(60, 62.3, 63.8, 62, 60.2), DO_RE_MI_RE_DO);
    expect(j.passed).toBe(true);
  });

  it('flags a flat third and the notes that follow it only if they are wrong too', () => {
    // mi is a half step flat, but re and do come back to the right places
    const j = judgeMelody(sing(60, 62, 63, 62, 60), DO_RE_MI_RE_DO);
    expect(j.results.map((r) => r.status)).toEqual(['ok', 'ok', 'off', 'ok', 'ok']);
    expect(j.results[2].errorCents).toBeCloseTo(-100, 5);
    expect(j.passed).toBe(false);
  });

  it('does not let the key move: right intervals sagging down are wrong', () => {
    // every step is correct but each note lands lower than the one it repeats
    const j = judgeMelody(sing(60, 62, 64, 61.4, 58.6), DO_RE_MI_RE_DO);
    expect(j.results.map((r) => r.status)).toEqual(['ok', 'ok', 'ok', 'off', 'off']);
    expect(j.passed).toBe(false);
  });

  it('flags the wrong direction', () => {
    const j = judgeMelody(sing(60, 58, 56, 58, 60), DO_RE_MI_RE_DO);
    expect(j.results[1].status).toBe('off');
    expect(j.results[1].errorCents).toBeCloseTo(-400, 5);
  });

  it('marks unsung notes pending and does not pass', () => {
    const j = judgeMelody(sing(60, 62), DO_RE_MI_RE_DO);
    expect(j.results.map((r) => r.status)).toEqual([
      'ok', 'ok', 'pending', 'pending', 'pending',
    ]);
    expect(j.passed).toBe(false);
  });

  it('reports which notes are still being sung', () => {
    const j = judgeMelody(sing(60, 62), DO_RE_MI_RE_DO);
    expect(j.results[0].final).toBe(true);
    expect(j.results[1].final).toBe(false);
  });

  it('handles a melody that starts above its tonic', () => {
    // sol fa mi re do: the first note sung is sol, and the key is fixed from it
    const offsets = [7, 5, 4, 2, 0];
    const j = judgeMelody(sing(67, 65, 64, 62, 60), offsets);
    expect(j.passed).toBe(true);
  });
});

describe('judgeMelody with a skipped note', () => {
  const SCALE = [0, 2, 4, 5, 7, 9, 11, 12, 11, 9, 7, 5, 4, 2, 0];

  it('marks only the skipped note, not everything after it', () => {
    // la then straight to the high do, missing ti; the descent is right
    const sungOffsets = [0, 2, 4, 5, 7, 9, 12, 11, 9, 7, 5, 4, 2, 0];
    const j = judgeMelody(sing(...sungOffsets.map((o) => 60 + o)), SCALE);
    const statuses = j.results.map((r) => r.status);
    expect(statuses[6]).toBe('off');
    expect(j.results[6].skipped).toBe(true);
    expect(statuses.filter((s) => s === 'off')).toHaveLength(1);
    expect(j.results[7].status).toBe('ok');
    expect(j.passed).toBe(false);
  });

  it('describes it as skipped', () => {
    const j = judgeMelody(sing(60, 64), [0, 2, 4]);
    expect(describeError(j.results[1])).toBe('skipped');
    expect(j.results.map((r) => r.status)).toEqual(['ok', 'off', 'ok']);
  });

  it('does not treat a wrong note as a skip', () => {
    // 3 semitones is not re (2) and not mi (4) within tolerance
    const j = judgeMelody(sing(60, 63), [0, 2, 4]);
    expect(j.results[1].skipped).toBeUndefined();
    expect(j.results[1].status).toBe('off');
    expect(j.results[2].status).toBe('pending');
  });

  it('prefers the expected note over skipping when a note repeats', () => {
    const j = judgeMelody(sing(60, 60, 62), [0, 0, 2]);
    expect(j.results.map((r) => r.status)).toEqual(['ok', 'ok', 'ok']);
  });

  it('allows only one skip at a time', () => {
    // sol and la both missing: this lands on la's slot as re-mi-fa-sol-?
    const j = judgeMelody(sing(60, 62, 69), [0, 2, 4, 5, 7, 9]);
    expect(j.results.map((r) => r.status)).toEqual(['ok', 'ok', 'off', 'pending', 'pending', 'pending']);
  });

  it('judges a slightly sharp note as itself, not as its neighbour', () => {
    // mi sung 54 cents sharp is out of tolerance, but nearer to fa than a skip would explain
    const j = judgeMelody(sing(60, 62.2, 64.54, 65, 67.34, 69.2, 71), SCALE);
    expect(j.results.slice(0, 7).map((r) => r.status)).toEqual([
      'ok', 'ok', 'off', 'ok', 'ok', 'ok', 'ok',
    ]);
    expect(j.results[2].skipped).toBeUndefined();
  });

  it('ignores a stray extra note', () => {
    const j = judgeMelody(sing(60, 62, 66.5, 64), [0, 2, 4]);
    expect(j.results.map((r) => r.status)).toEqual(['ok', 'ok', 'ok']);
  });

  it('still reports a wrong note rather than ignoring it', () => {
    const j = judgeMelody(sing(60, 67, 64), [0, 2, 4]);
    expect(j.results.map((r) => r.status)).toEqual(['ok', 'off', 'ok']);
  });

  it('can skip the last note of the melody', () => {
    const j = judgeMelody(sing(60, 62), [0, 2, 4]);
    expect(j.results[2].status).toBe('pending');
  });
});

describe('describeError', () => {
  it('says nothing for a good note', () => {
    expect(describeError(judgeMelody(sing(60, 62), [0, 2]).results[1])).toBe('');
  });

  it('says whether a note was high or low', () => {
    expect(describeError(judgeMelody(sing(60, 61), [0, 2]).results[1])).toBe('too low');
    expect(describeError(judgeMelody(sing(60, 63.5), [0, 2]).results[1])).toBe('too high');
    expect(describeError(judgeMelody(sing(60, 58), [0, 2]).results[1])).toBe('too low');
  });
});

describe('isComplete', () => {
  const melody = [0, 2, 4];
  const held = (frames: number, open: boolean): SungNote[] => [
    { midi: 60, startFrame: 0, frames: 20, open: false },
    { midi: 62, startFrame: 30, frames: 20, open: false },
    { midi: 64, startFrame: 60, frames, open },
  ];

  it('is done once the last note has held, without waiting for the voice to stop', () => {
    expect(isComplete(judgeMelody(held(SETTLE_FRAMES, true), melody))).toBe(true);
    expect(isComplete(judgeMelody(held(40, true), melody))).toBe(true);
  });

  it('waits until the last note has held a moment', () => {
    expect(isComplete(judgeMelody(held(SETTLE_FRAMES - 1, true), melody))).toBe(false);
  });

  it('is done when the last note has ended, however short', () => {
    expect(isComplete(judgeMelody(held(8, false), melody))).toBe(true);
  });

  it('is not done while any note is wrong or missing', () => {
    const wrong = held(30, true);
    wrong[2] = { ...wrong[2], midi: 66 };
    expect(isComplete(judgeMelody(wrong, melody))).toBe(false);
    expect(isComplete(judgeMelody(held(30, true).slice(0, 2), melody))).toBe(false);
  });

  it('is not done before anything is sung', () => {
    expect(isComplete(judgeMelody([], melody))).toBe(false);
  });
});

describe('legato repeated notes', () => {
  /** Notes with explicit lengths: [midi, startFrame, frames]. */
  const timed = (...notes: [number, number, number][]): SungNote[] =>
    notes.map(([midi, startFrame, frames], i) => ({
      midi,
      startFrame,
      frames,
      open: i === notes.length - 1,
    }));
  const DO_RE_RE_RE_DO = [0, 2, 2, 2, 0];

  it('counts one held note as the repeats it is long enough for', () => {
    // do, one long re (about three notes' worth), do
    const j = judgeMelody(timed([60, 0, 18], [62, 20, 58], [60, 80, 18]), DO_RE_RE_RE_DO);
    expect(j.results.map((r) => r.status)).toEqual(['ok', 'ok', 'ok', 'ok', 'ok']);
    expect(j.results.map((r) => !!r.merged)).toEqual([false, true, true, true, false]);
    expect(j.passed).toBe(true);
  });

  it('does not stretch a note that is too short for the repeats', () => {
    const j = judgeMelody(timed([60, 0, 18], [62, 20, 24], [60, 44, 18]), DO_RE_RE_RE_DO);
    expect(j.passed).toBe(false);
    expect(j.results.some((r) => r.merged)).toBe(false);
  });

  it('prefers notes sung separately to one note stretched over them', () => {
    const j = judgeMelody(
      timed([60, 0, 18], [62, 20, 18], [62, 40, 18], [62, 60, 18], [60, 80, 18]),
      DO_RE_RE_RE_DO,
    );
    expect(j.passed).toBe(true);
    expect(j.results.some((r) => r.merged)).toBe(false);
  });

  it('only merges notes of the same pitch', () => {
    // a long note cannot stand for re then mi
    const j = judgeMelody(timed([60, 0, 18], [62, 20, 40], [60, 60, 18]), [0, 2, 4, 0]);
    expect(j.results.some((r) => r.merged)).toBe(false);
  });
});

describe('rhythm', () => {
  /** A rhythm where each note follows the last, worth the given beats. */
  const plain = (beats: number[]) => ({
    advance: beats,
    held: beats,
    rest: beats.map(() => false),
  });
  /** Notes starting at the given frames, each held nearly until the next. */
  const at = (...starts: number[]): SungNote[] =>
    starts.map((startFrame, i) => ({
      midi: 60 + [0, 2, 4, 5, 7, 9][i],
      startFrame,
      frames: i < starts.length - 1 ? starts[i + 1] - startFrame - 2 : 16,
      open: i === starts.length - 1,
    }));
  const OFFSETS = [0, 2, 4, 5, 7, 9];
  const run = (starts: number[], t = plain(OFFSETS.map(() => 1))) =>
    judgeMelody(at(...starts), OFFSETS, 50, t);

  it('accepts an even pulse, at any speed', () => {
    expect(run([0, 20, 40, 60, 80, 100]).timingOk).toBe(true);
    expect(run([0, 40, 80, 120, 160, 200]).timingOk).toBe(true);
  });

  it('accepts the ordinary unevenness of singing', () => {
    expect(run([0, 22, 38, 63, 80, 104]).timingOk).toBe(true);
  });

  it('calls a clipped note short', () => {
    const j = run([0, 20, 40, 48, 68, 88]); // the fourth note starts 8 frames after the third
    expect(j.timingOk).toBe(false);
    expect(j.results[2].timing).toBe('short');
  });

  it('calls a dragged note long', () => {
    const j = run([0, 20, 40, 100, 120, 140]); // 60 frames on the third
    expect(j.timingOk).toBe(false);
    expect(j.results[2].timing).toBe('long');
  });

  it('expects a dotted note to last twice as long', () => {
    const beats = [1, 1, 2, 1, 1, 1];
    expect(run([0, 20, 40, 80, 100, 120], plain(beats)).timingOk).toBe(true);
    // the same singing is wrong if the note was not dotted
    expect(run([0, 20, 40, 80, 100, 120]).timingOk).toBe(false);
    // and a dotted note sung short is caught
    expect(run([0, 20, 40, 60, 80, 100], plain(beats)).results[2].timing).toBe('short');
  });

  it('does not judge the rhythm before it knows the pulse', () => {
    const j = judgeMelody(at(0, 5), OFFSETS, 50, plain(OFFSETS.map(() => 1)));
    expect(j.timingOk).toBe(true);
    expect(j.results[0].timing).toBeUndefined();
  });

  it('does not judge the rhythm when none is given', () => {
    const j = judgeMelody(at(0, 20, 40, 41, 80, 100), OFFSETS);
    expect(j.timingOk).toBe(true);
    expect(j.results.every((r) => r.timing === undefined)).toBe(true);
  });

  it('measures only notes sung one right after the other', () => {
    // a stray note sits between the third and fourth, so that gap is unknown
    const notes = at(0, 20, 40, 80, 100, 120);
    notes.splice(3, 0, { midi: 90, startFrame: 55, frames: 4, open: false });
    const j = judgeMelody(notes, OFFSETS, 50, plain(OFFSETS.map(() => 1)));
    expect(j.results[2].timing).toBeUndefined();
  });

  it('holds back completion while the rhythm is off', () => {
    const j = run([0, 20, 40, 100, 120, 140]);
    expect(isComplete(j)).toBe(false);
    expect(isComplete(run([0, 20, 40, 60, 80, 100]))).toBe(true);
  });
});

describe('the half bar, a one-beat rest', () => {
  // do re mi | fa sol la: a half bar after the third note
  const OFFSETS = [0, 2, 4, 5, 7, 9];
  const REST_AFTER = [false, false, true, false, false, false];
  /** A plain note before the bar sounds one beat then rests one: it takes two beats. */
  const plainBeforeBar = {
    advance: [1, 1, 2, 1, 1, 1],
    held: [1, 1, 1, 1, 1, 1],
    rest: REST_AFTER,
  };
  /** A dotted note before the bar: the rest takes the dot's beat, so it sounds one beat and takes two. */
  const dottedBeforeBar = {
    advance: [1, 1, 2, 1, 1, 1],
    held: [1, 1, 1, 1, 1, 1],
    rest: REST_AFTER,
  };
  /** Notes with their start frame and how many frames they sound for. */
  const sungNotes = (...notes: [number, number][]): SungNote[] =>
    notes.map(([startFrame, frames], i) => ({
      midi: 60 + OFFSETS[i],
      startFrame,
      frames,
      open: i === notes.length - 1,
    }));
  const go = (notes: SungNote[], spec = plainBeforeBar) => judgeMelody(notes, OFFSETS, 50, spec);

  // A pulse of 20 frames. Each note sounds about 16 frames, then the detector
  // holds its pitch for 8 more, so a note shows as 24 frames long.
  it('accepts a note sung for one beat, then a one-beat rest', () => {
    // third note starts at 40, sounds, then the rest: the next starts at 80
    const j = go(sungNotes([0, 22], [20, 22], [40, 22], [80, 22], [100, 22], [120, 22]));
    expect(j.timingOk).toBe(true);
    expect(j.results[2].timing).toBe('ok');
  });

  it('expects two beats from the start of the note before the bar to the next note', () => {
    // the next note comes only 14 frames after the third began: far too soon
    const j = go(sungNotes([0, 22], [20, 22], [40, 22], [54, 22], [74, 22], [94, 22]));
    expect(j.results[2].timing).toBe('short');
  });

  it('reports no rest when the next note follows at once', () => {
    const j = go(sungNotes([0, 22], [20, 22], [40, 22], [60, 22], [80, 22], [100, 22]));
    expect(j.results[2].timing).toBe('rest');
  });

  it('wants silence at the bar, not just a gap in the timing', () => {
    // the third note is sung straight through the rest, then the next begins on time
    const j = go(sungNotes([0, 22], [20, 22], [40, 40], [80, 22], [100, 22], [120, 22]));
    expect(j.results[2].timing).toBe('rest');
    expect(j.timingOk).toBe(false);
  });

  it('cuts off the second beat of a dotted note before the bar', () => {
    // mi is dotted: the notes before it are plain, the bar follows. Sounding for two beats is wrong.
    const dotted = { ...dottedBeforeBar };
    const sungThrough = go(
      sungNotes([0, 22], [20, 22], [40, 52], [100, 22], [120, 22], [140, 22]),
      dotted,
    );
    expect(sungThrough.results[2].timing).toBe('cut');
    // sounding for one beat and resting for one is right
    const cut = go(sungNotes([0, 22], [20, 22], [40, 22], [80, 22], [100, 22], [120, 22]), dotted);
    expect(cut.results[2].timing).toBe('ok');
  });

  it('allows the rest to be a little shorter or longer', () => {
    expect(go(sungNotes([0, 22], [20, 22], [40, 20], [74, 22], [94, 22], [114, 22])).timingOk).toBe(true);
    expect(go(sungNotes([0, 22], [20, 22], [40, 22], [92, 22], [112, 22], [132, 22])).timingOk).toBe(true);
  });

  it('calls a rest that goes on far too long a long note', () => {
    const j = go(sungNotes([0, 22], [20, 22], [40, 22], [130, 22], [150, 22], [170, 22]));
    expect(j.results[2].timing).toBe('long');
  });

  it('does not use the notes before a bar to set the pulse', () => {
    // a slow rest does not make the quick notes seem fast
    const j = go(sungNotes([0, 22], [20, 22], [40, 22], [90, 22], [110, 22], [130, 22]));
    expect(j.results[0].timing).toBe('ok');
    expect(j.results[3].timing).toBe('ok');
  });
});

describe('flickers', () => {
  it('ignores a tiny extra piece rather than a held note, even if the piece is closer in pitch', () => {
    // sung: do, re (held, a little sharp), a 5-frame blip right on re, mi
    const sung: SungNote[] = [
      { midi: 60, startFrame: 0, frames: 18, open: false },
      { midi: 62.3, startFrame: 20, frames: 30, open: false },
      { midi: 62.0, startFrame: 52, frames: 5, open: false },
      { midi: 64, startFrame: 60, frames: 20, open: true },
    ];
    const j = judgeMelody(sung, [0, 2, 4]);
    expect(j.passed).toBe(true);
    expect(j.results[1].frames).toBe(30);
  });
});
