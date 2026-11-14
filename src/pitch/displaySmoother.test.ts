import { DisplaySmoother } from './displaySmoother';

const DT = 1 / 60;

function peak(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.max(...values.map((v) => Math.abs(v - mean)));
}

describe('DisplaySmoother', () => {
  it('flattens vibrato on a held note', () => {
    const smoother = new DisplaySmoother();
    const input: number[] = [];
    const output: number[] = [];
    for (let i = 0; i < 360; i++) {
      const midi = 57 + 0.4 * Math.sin(2 * Math.PI * 5.5 * i * DT);
      const out = smoother.push(midi, DT)!;
      if (i >= 60) {
        input.push(midi);
        output.push(out);
      }
    }
    expect(peak(output)).toBeLessThan(peak(input) * 0.25);
  });

  it('steadies slow drift and random jitter', () => {
    const smoother = new DisplaySmoother();
    let seed = 11;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5;
    const input: number[] = [];
    const output: number[] = [];
    for (let i = 0; i < 360; i++) {
      const midi = 57 + rand() * 0.6;
      const out = smoother.push(midi, DT)!;
      if (i >= 60) {
        input.push(midi);
        output.push(out);
      }
    }
    expect(peak(output)).toBeLessThan(peak(input) * 0.3);
  });

  it('still lands a two semitone note change within about half a second', () => {
    const smoother = new DisplaySmoother();
    for (let i = 0; i < 120; i++) smoother.push(57, DT);
    let t = 0;
    let out = 57;
    while (t < 2 && Math.abs(out - 59) > 0.2) {
      out = smoother.push(59, DT)!;
      t += DT;
    }
    expect(t).toBeLessThan(0.55);
  });

  it('forgets everything when nothing is sung', () => {
    const smoother = new DisplaySmoother();
    for (let i = 0; i < 60; i++) smoother.push(57, DT);
    expect(smoother.push(null, DT)).toBeNull();
    expect(smoother.push(64, DT)).toBe(64);
  });
});
