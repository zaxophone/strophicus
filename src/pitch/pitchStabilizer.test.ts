import { hzToMidi, midiToHz } from './music';
import { PitchStabilizer } from './pitchStabilizer';

function rng(seed = 7) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647 - 0.5;
  };
}

function std(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(
    values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length,
  );
}

const A3 = midiToHz(57);

describe('PitchStabilizer', () => {
  it('smooths jitter on a held note', () => {
    const random = rng();
    const tracker = new PitchStabilizer();
    const input: number[] = [];
    const output: number[] = [];
    for (let i = 0; i < 120; i++) {
      const midi = 57 + random() * 0.6; // ±30 cents of wobble
      const out = tracker.push(midiToHz(midi));
      if (i >= 20) {
        input.push(midi);
        output.push(out!);
      }
    }
    expect(std(output)).toBeLessThan(std(input) * 0.4);
  });

  it('follows a two semitone step within about 200ms', () => {
    const tracker = new PitchStabilizer();
    for (let i = 0; i < 40; i++) tracker.push(A3);
    let out = 0;
    let frames = 0;
    while (frames < 40) {
      out = tracker.push(midiToHz(59))!;
      frames++;
      if (Math.abs(out - 59) < 0.3) break;
    }
    expect(Math.abs(out - 59)).toBeLessThan(0.3);
    expect(frames).toBeLessThanOrEqual(9);
  });

  it('folds stray octave errors back to the sung note', () => {
    const tracker = new PitchStabilizer();
    const outputs: number[] = [];
    for (let i = 0; i < 100; i++) {
      const hz = i % 9 === 4 ? A3 * 2 : i % 13 === 6 ? A3 / 2 : A3;
      outputs.push(tracker.push(hz)!);
    }
    expect(Math.max(...outputs.map((o) => Math.abs(o - 57)))).toBeLessThan(0.1);
  });

  it('accepts a sustained octave leap', () => {
    const tracker = new PitchStabilizer();
    for (let i = 0; i < 30; i++) tracker.push(A3);
    let out = 0;
    for (let i = 0; i < 60; i++) out = tracker.push(A3 * 2)!;
    expect(Math.abs(out - 69)).toBeLessThan(0.3);
  });

  it('ignores a single-frame spike', () => {
    const tracker = new PitchStabilizer();
    for (let i = 0; i < 30; i++) tracker.push(A3);
    const spike = tracker.push(midiToHz(57 + 5));
    expect(Math.abs(spike! - 57)).toBeLessThan(0.1);
    expect(Math.abs(tracker.push(A3)! - 57)).toBeLessThan(0.1);
  });

  it('keeps the note through a consonant but forgets it after silence', () => {
    const tracker = new PitchStabilizer();
    for (let i = 0; i < 20; i++) tracker.push(A3);
    for (let i = 0; i < 5; i++) expect(tracker.push(null)).toBeNull();
    expect(tracker.active).toBe(true);
    expect(Math.abs(tracker.push(A3)! - 57)).toBeLessThan(0.1);

    for (let i = 0; i < 12; i++) tracker.push(null);
    expect(tracker.active).toBe(false);
    // A new phrase starts exactly where it is sung, with no glide from before.
    expect(tracker.push(midiToHz(64))).toBeCloseTo(64, 5);
  });

  it('reads back the pitch it was given', () => {
    const tracker = new PitchStabilizer();
    expect(hzToMidi(A3)).toBeCloseTo(57, 5);
    expect(tracker.push(A3)).toBeCloseTo(57, 5);
  });

  describe('with foldOctaves', () => {
    const fold = () => new PitchStabilizer({ foldOctaves: true });

    it('moves an octave-high reading of the next step back near the last note', () => {
      const tracker = fold();
      for (let i = 0; i < 30; i++) tracker.push(A3);
      // "re" two semitones up, but the detector hears it an octave high
      let out = 0;
      for (let i = 0; i < 30; i++) out = tracker.push(midiToHz(57 + 2 + 12))!;
      expect(Math.abs(out - 59)).toBeLessThan(0.3);
    });

    it('moves a third-harmonic reading (octave and a fifth high) back too', () => {
      const tracker = fold();
      for (let i = 0; i < 30; i++) tracker.push(A3);
      let out = 0;
      for (let i = 0; i < 30; i++) out = tracker.push(midiToHz(57 + 2 + 19.02))!;
      expect(Math.abs(out - 59)).toBeLessThan(0.3);
    });

    it('anchors to the previous note through a pause', () => {
      const tracker = fold();
      for (let i = 0; i < 30; i++) tracker.push(A3);
      for (let i = 0; i < 20; i++) tracker.push(null); // longer than a consonant
      expect(tracker.active).toBe(false);
      let out = 0;
      for (let i = 0; i < 20; i++) out = tracker.push(midiToHz(57 + 2 + 12))!;
      expect(Math.abs(out - 59)).toBeLessThan(0.3);
    });

    it('forgets the anchor after a long silence', () => {
      const tracker = fold();
      for (let i = 0; i < 30; i++) tracker.push(A3);
      for (let i = 0; i < 120; i++) tracker.push(null);
      expect(tracker.push(midiToHz(57 + 12))).toBeCloseTo(69, 5);
    });

    it('still follows ordinary steps and leaps up to a fifth or so', () => {
      const tracker = fold();
      for (let i = 0; i < 30; i++) tracker.push(A3);
      let out = 0;
      for (let i = 0; i < 40; i++) out = tracker.push(midiToHz(57 + 7))!;
      expect(Math.abs(out - 64)).toBeLessThan(0.3);
    });

    it('does not fold by default', () => {
      const tracker = new PitchStabilizer();
      for (let i = 0; i < 30; i++) tracker.push(A3);
      let out = 0;
      for (let i = 0; i < 40; i++) out = tracker.push(midiToHz(57 + 14))!;
      expect(Math.abs(out - 71)).toBeLessThan(0.3);
    });
  });
});
