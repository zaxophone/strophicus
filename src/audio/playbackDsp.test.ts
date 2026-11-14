import { parseWav, prepareForPlayback, resample, softenCuts } from './playbackDsp';

function wav(samples: number[], sampleRate: number, bits: 16 | 32 = 16): ArrayBuffer {
  const width = bits / 8;
  const buffer = new ArrayBuffer(44 + samples.length * width);
  const view = new DataView(buffer);
  const text = (at: number, s: string) => [...s].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)));
  text(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * width, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, bits === 32 ? 3 : 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * width, true);
  view.setUint16(32, width, true);
  view.setUint16(34, bits, true);
  text(36, 'data');
  view.setUint32(40, samples.length * width, true);
  samples.forEach((s, i) =>
    bits === 32 ? view.setFloat32(44 + i * 4, s, true) : view.setInt16(44 + i * 2, Math.round(s * 32767), true),
  );
  return buffer;
}

const sine = (hz: number, rate: number, seconds: number, amp = 1) =>
  Float32Array.from({ length: Math.round(rate * seconds) }, (_, i) => amp * Math.sin((2 * Math.PI * hz * i) / rate));

const rms = (x: Float32Array) => Math.sqrt(x.reduce((a, v) => a + v * v, 0) / x.length);

describe('parseWav', () => {
  it('reads 16-bit samples and the rate', () => {
    const { samples, sampleRate } = parseWav(wav([0, 0.5, -0.5, 1], 44100));
    expect(sampleRate).toBe(44100);
    expect(Array.from(samples).map((v) => +v.toFixed(3))).toEqual([0, 0.5, -0.5, 1]);
  });

  it('reads float32 samples', () => {
    const { samples } = parseWav(wav([0.25, -0.75], 48000, 32));
    expect(Array.from(samples)).toEqual([0.25, -0.75]);
  });

  it('rejects other data', () => {
    expect(() => parseWav(new ArrayBuffer(20))).toThrow();
  });
});

describe('resample', () => {
  it('keeps a sine at the same pitch and length in seconds', () => {
    const input = sine(220, 44100, 0.5);
    const out = resample(input, 44100, 48000);
    expect(out.length).toBe(24000);
    const reference = sine(220, 48000, 0.5);
    let worst = 0;
    for (let i = 10; i < out.length - 10; i++) worst = Math.max(worst, Math.abs(out[i] - reference[i]));
    expect(worst).toBeLessThan(0.002);
  });

  it('returns the input when rates match', () => {
    const input = sine(100, 44100, 0.1);
    expect(resample(input, 44100, 44100)).toBe(input);
  });
});

describe('prepareForPlayback', () => {
  it('brings a quiet voice to the target loudness', () => {
    const out = prepareForPlayback(sine(220, 44100, 1, 0.03), 44100);
    expect(rms(out.subarray(1000, out.length - 1000))).toBeCloseTo(0.2, 1);
  });

  it('is not held down by one stray peak', () => {
    const quiet = sine(220, 44100, 1, 0.03);
    quiet[20000] = 0.9;
    const out = prepareForPlayback(quiet, 44100);
    expect(rms(out.subarray(1000, out.length - 1000))).toBeGreaterThan(0.12);
  });

  it('never exceeds full scale', () => {
    const out = prepareForPlayback(sine(220, 44100, 1, 0.95), 44100, { targetRms: 0.9 });
    expect(Math.max(...Array.from(out).map(Math.abs))).toBeLessThanOrEqual(1);
  });

  it('removes a constant offset', () => {
    const input = sine(220, 44100, 1, 0.05).map((v) => v + 0.2);
    const out = prepareForPlayback(input, 44100);
    const mean = out.reduce((a, v) => a + v, 0) / out.length;
    expect(Math.abs(mean)).toBeLessThan(0.005);
  });

  it('leaves silence silent and fades the ends', () => {
    expect(Math.max(...prepareForPlayback(new Float32Array(1000), 44100))).toBe(0);
    const out = prepareForPlayback(sine(220, 44100, 0.2, 0.3), 44100);
    expect(Math.abs(out[0])).toBe(0);
    expect(Math.abs(out[out.length - 1])).toBe(0);
  });
});

describe('softenCuts', () => {
  const step = (x: Float32Array) => Math.max(...Array.from(x.subarray(1)).map((v, i) => Math.abs(v - x[i])));

  it('removes the step where a voice is cut to silence, wherever the cut falls', () => {
    const voice = sine(220, 44100, 0.5, 0.2);
    // cuts at a peak of the waveform, mid-window and on a window edge
    for (const cut of [11025 + 50, 11025 + 77, 11088]) {
      const gated = new Float32Array(voice.length);
      gated.set(voice.subarray(0, cut));
      const before = step(gated.subarray(cut - 60, cut + 60));
      const after = step(softenCuts(gated, 44100).subarray(cut - 60, cut + 60));
      expect(before).toBeGreaterThan(0.02);
      expect(after).toBeLessThan(before / 3);
    }
  });

  it('removes the step where a voice starts abruptly', () => {
    const voice = sine(220, 44100, 0.5, 0.2);
    const gated = new Float32Array(voice.length);
    gated.set(voice.subarray(11075), 11075);
    const before = step(gated.subarray(11015, 11135));
    const after = step(softenCuts(gated, 44100).subarray(11015, 11135));
    expect(before).toBeGreaterThan(0.02);
    expect(after).toBeLessThan(before / 3);
  });

  it('leaves continuous singing untouched', () => {
    const voice = sine(220, 44100, 0.5, 0.2);
    expect(softenCuts(voice, 44100)).toEqual(voice);
  });

  it('leaves a gradual fade alone', () => {
    const voice = sine(220, 44100, 0.5, 0.2).map((v, i, a) => v * (1 - i / a.length));
    expect(softenCuts(voice, 44100)).toEqual(voice);
  });
});
