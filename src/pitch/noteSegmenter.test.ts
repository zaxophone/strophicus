import { NoteSegmenter } from './noteSegmenter';

function feed(seg: NoteSegmenter, values: (number | null)[]) {
  values.forEach((v) => seg.push(v));
}
const hold = (midi: number, frames: number) => Array(frames).fill(midi);
const silence = (frames: number) => Array<null>(frames).fill(null);

describe('NoteSegmenter', () => {
  it('finds one note in a held pitch', () => {
    const seg = new NoteSegmenter();
    feed(seg, hold(57, 20));
    expect(seg.notes).toHaveLength(1);
    expect(seg.notes[0].midi).toBeCloseTo(57, 5);
    expect(seg.notes[0].open).toBe(true);
  });

  it('ignores notes shorter than the minimum', () => {
    const seg = new NoteSegmenter();
    feed(seg, [...hold(57, 5), ...silence(4)]);
    expect(seg.notes).toHaveLength(0);
  });

  it('treats vibrato around a pitch as one note', () => {
    const seg = new NoteSegmenter();
    feed(seg, Array.from({ length: 40 }, (_, i) => 57 + 0.35 * Math.sin(i)));
    expect(seg.notes).toHaveLength(1);
  });

  it('splits two notes sung without a break', () => {
    const seg = new NoteSegmenter();
    feed(seg, [...hold(57, 15), ...hold(59, 15)]);
    expect(seg.notes.map((n) => Math.round(n.midi))).toEqual([57, 59]);
    expect(seg.notes[0].open).toBe(false);
    expect(seg.notes[1].open).toBe(true);
  });

  it('counts the same pitch after a gap as a repeated note', () => {
    const seg = new NoteSegmenter();
    feed(seg, [...hold(57, 12), ...silence(4), ...hold(57, 12)]);
    expect(seg.notes).toHaveLength(2);
  });

  it('keeps a note across a one frame dropout', () => {
    const seg = new NoteSegmenter();
    feed(seg, [...hold(57, 12), null, ...hold(57, 12)]);
    expect(seg.notes).toHaveLength(1);
  });

  it('ignores a brief blip to another pitch', () => {
    const seg = new NoteSegmenter();
    feed(seg, [...hold(57, 12), ...hold(62, 3), ...hold(57, 12)]);
    expect(seg.notes).toHaveLength(1);
    expect(seg.notes[0].midi).toBeCloseTo(57, 5);
  });

  it('ignores the glide into a note when reading its pitch', () => {
    const seg = new NoteSegmenter();
    feed(seg, [57, 57.2, 57.4, ...hold(57.5, 20)]);
    expect(seg.notes[0].midi).toBeCloseTo(57.5, 1);
  });

  it('starts fresh after reset', () => {
    const seg = new NoteSegmenter();
    feed(seg, hold(57, 20));
    seg.reset();
    expect(seg.notes).toHaveLength(0);
  });

  it('does not mistake a slow glide for a note', () => {
    const seg = new NoteSegmenter();
    // A singer drifts toward the next note while the previous one fades.
    const glide = Array.from({ length: 14 }, (_, i) => 57.6 + i * 0.09);
    feed(seg, [...hold(57, 15), ...glide, ...silence(1), ...hold(59, 15)]);
    expect(seg.notes.map((n) => Math.round(n.midi))).toEqual([57, 59]);
  });
});

describe('NoteSegmenter.finish', () => {
  it('closes the note being sung', () => {
    const seg = new NoteSegmenter();
    feed(seg, hold(57, 20));
    expect(seg.notes[0].open).toBe(true);
    seg.finish();
    expect(seg.notes).toHaveLength(1);
    expect(seg.notes[0].open).toBe(false);
    expect(seg.notes[0].midi).toBeCloseTo(57, 5);
  });

  it('keeps every note and drops a pitch that had not yet held', () => {
    const seg = new NoteSegmenter();
    feed(seg, [...hold(57, 15), ...silence(4), ...hold(59, 3)]);
    seg.finish();
    expect(seg.notes.map((n) => Math.round(n.midi))).toEqual([57]);
  });

  it('does nothing when no note is being sung', () => {
    const seg = new NoteSegmenter();
    seg.finish();
    expect(seg.notes).toHaveLength(0);
  });

  it('lets a later note start fresh', () => {
    const seg = new NoteSegmenter();
    feed(seg, hold(57, 15));
    seg.finish();
    feed(seg, hold(57, 15));
    expect(seg.notes).toHaveLength(2);
  });
});

describe('NoteSegmenter with loudness', () => {
  /** Feeds a held pitch together with the loudness of each frame. */
  function sing(seg: NoteSegmenter, midi: number, levels: number[]) {
    levels.forEach((level) => seg.push(midi, level));
  }

  // Loudness (x1000) of three "re"s sung legato on one pitch, measured from a
  // real recording: three humps with dips between them, and no break in pitch.
  const THREE_RES = [
    20, 23, 25, 28, 27, 28, 30, 32, 32, 31, 24, 19, 17, 19, 20, 20, 23, 23, 22, 20, 20, 24, 26, 27,
    26, 22, 20, 18, 16, 21, 20, 17, 16, 14, 12, 12, 12, 11, 8,
  ].map((v) => v / 1000);

  it('hears a repeated note when the voice gets quieter and louder again', () => {
    const seg = new NoteSegmenter();
    sing(seg, 62, THREE_RES);
    expect(seg.notes).toHaveLength(3);
    for (const note of seg.notes) expect(note.midi).toBeCloseTo(62, 5);
  });

  it('keeps every frame, split between the notes', () => {
    const seg = new NoteSegmenter();
    sing(seg, 62, THREE_RES);
    expect(seg.notes.reduce((n, note) => n + note.frames, 0)).toBe(THREE_RES.length);
  });

  it('keeps one note for a fading note', () => {
    const seg = new NoteSegmenter();
    sing(seg, 62, Array.from({ length: 40 }, (_, i) => 0.06 - i * 0.0013));
    expect(seg.notes).toHaveLength(1);
  });

  it('keeps one note through tremolo in the loudness', () => {
    const seg = new NoteSegmenter();
    sing(seg, 62, Array.from({ length: 50 }, (_, i) => 0.04 * (1 + 0.15 * Math.sin(i * 0.9))));
    expect(seg.notes).toHaveLength(1);
  });

  it('keeps one note for a steady loudness', () => {
    const seg = new NoteSegmenter();
    sing(seg, 62, Array(40).fill(0.03));
    expect(seg.notes).toHaveLength(1);
  });

  it('does not split without loudness, as before', () => {
    const seg = new NoteSegmenter();
    feed(seg, hold(62, 40));
    expect(seg.notes).toHaveLength(1);
  });

  it('does not split a dip right at the start of a note', () => {
    const seg = new NoteSegmenter();
    // a short attack, a dip, then the note swells: all one note
    sing(seg, 62, [0.04, 0.045, 0.012, 0.014, 0.03, 0.04, 0.045, 0.045, 0.045, 0.04, 0.04, 0.04]);
    expect(seg.notes).toHaveLength(1);
  });

  it('does not count a piece split off that ends before it has held', () => {
    const seg = new NoteSegmenter();
    // loud, dip, then just a few louder frames before the voice stops
    sing(seg, 62, [...Array(10).fill(0.05), 0.015, 0.015, 0.016, 0.04, 0.045, 0.05]);
    feed(seg, silence(4));
    expect(seg.notes).toHaveLength(1);
  });

  it('does not show a new piece until it has held a moment', () => {
    const seg = new NoteSegmenter();
    sing(seg, 62, [...Array(10).fill(0.05), 0.015, 0.015, 0.016, 0.04, 0.045]);
    expect(seg.notes).toHaveLength(1);
  });

  it('still starts a new note when the pitch changes', () => {
    const seg = new NoteSegmenter();
    sing(seg, 60, Array(15).fill(0.04));
    sing(seg, 62, Array(15).fill(0.04));
    expect(seg.notes.map((n) => Math.round(n.midi))).toEqual([60, 62]);
  });
});
