import { hzToMidi } from './music';
import { HOP_LENGTH, PitchPipeline } from './pitchPipeline';

const SR = 44100;

/** Pseudo-random noise at a given RMS. */
function noise(frames: number, rms: number, seed = 5): Float32Array {
  const out = new Float32Array(frames * HOP_LENGTH);
  let x = seed;
  for (let i = 0; i < out.length; i++) {
    x = (x * 16807) % 2147483647;
    out[i] = (x / 2147483647 - 0.5) * 2 * Math.sqrt(3) * rms;
  }
  return out;
}

/** A voice-like tone (a few harmonics) at a given RMS. */
function tone(frames: number, hz: number, rms: number): Float32Array {
  const out = new Float32Array(frames * HOP_LENGTH);
  for (let i = 0; i < out.length; i++) {
    const t = (2 * Math.PI * hz * i) / SR;
    out[i] = Math.sin(t) + 0.5 * Math.sin(2 * t) + 0.3 * Math.sin(3 * t);
  }
  let energy = 0;
  for (const v of out) energy += v * v;
  const scale = rms / Math.sqrt(energy / out.length);
  return out.map((v) => v * scale);
}

function run(...parts: Float32Array[]): (number | null)[] {
  const pipeline = new PitchPipeline(SR);
  const audio = new Float32Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    audio.set(p, at);
    at += p.length;
  }
  const out: (number | null)[] = [];
  for (let i = 0; i + HOP_LENGTH <= audio.length; i += HOP_LENGTH) {
    out.push(pipeline.push(audio.subarray(i, i + HOP_LENGTH), SR).midi);
  }
  return out;
}

const voiced = (frames: (number | null)[]) => frames.filter((m) => m !== null).length;

describe('PitchPipeline listening level', () => {
  it('hears a quiet note once it has heard how quiet the room is', () => {
    // a quiet room, then a soft note well under the old fixed cut-off of 0.010
    const frames = run(noise(30, 0.002), tone(30, 220, 0.0075));
    const soft = frames.slice(34);
    expect(voiced(soft)).toBeGreaterThanOrEqual(24);
    const midi = soft.filter((m): m is number => m !== null);
    expect(midi.reduce((a, b) => a + b, 0) / midi.length).toBeCloseTo(hzToMidi(220), 0);
  });

  it('does not hear the room itself', () => {
    expect(voiced(run(noise(60, 0.002)))).toBe(0);
    expect(voiced(run(noise(60, 0.006)))).toBe(0);
  });

  it('still hears a normal-level note', () => {
    const frames = run(noise(20, 0.002), tone(30, 220, 0.04));
    expect(voiced(frames.slice(24))).toBeGreaterThanOrEqual(24);
  });

  it('keeps its old cut-off when it has not yet heard a quiet room', () => {
    // a soft note from the very start: nothing has shown it is quieter than 0.010
    expect(voiced(run(tone(40, 220, 0.0075)))).toBe(0);
  });

  it('forgets the room after a reset', () => {
    const pipeline = new PitchPipeline(SR);
    const feed = (audio: Float32Array) => {
      const out: (number | null)[] = [];
      for (let i = 0; i + HOP_LENGTH <= audio.length; i += HOP_LENGTH) {
        out.push(pipeline.push(audio.subarray(i, i + HOP_LENGTH), SR).midi);
      }
      return out;
    };
    feed(noise(30, 0.002));
    pipeline.reset();
    expect(voiced(feed(tone(40, 220, 0.0075)))).toBe(0);
  });
});
