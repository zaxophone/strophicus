import { detectPitch } from './yin';
import { centsBetween, octaveFreeCentsError } from './music';

const SR = 44100;

function tone(hz: number, harmonics = [1], length = 2048): Float32Array {
  const out = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    for (let h = 0; h < harmonics.length; h++) {
      out[i] +=
        (0.3 * Math.sin((2 * Math.PI * hz * (h + 1) * i) / SR)) / harmonics[h];
    }
  }
  return out;
}

describe('detectPitch', () => {
  it.each([110, 196, 220, 261.63, 440, 880])('finds a %f Hz sine', (hz) => {
    const result = detectPitch(tone(hz), SR);
    expect(result).not.toBeNull();
    expect(Math.abs(centsBetween(hz, result!.hz))).toBeLessThan(3);
  });

  it('finds the fundamental of a harmonic-rich tone', () => {
    const result = detectPitch(tone(196, [1, 2, 3, 4]), SR);
    expect(result).not.toBeNull();
    expect(Math.abs(centsBetween(196, result!.hz))).toBeLessThan(3);
  });

  it('gives the same answer with decimation', () => {
    const result = detectPitch(tone(196, [1, 2, 3]), SR, { decimate: 4 });
    expect(result).not.toBeNull();
    expect(Math.abs(centsBetween(196, result!.hz))).toBeLessThan(5);
  });

  it('returns null for silence', () => {
    expect(detectPitch(new Float32Array(2048), SR)).toBeNull();
  });

  it('returns null for white noise', () => {
    let seed = 1;
    const noise = new Float32Array(2048).map(() => {
      seed = (seed * 16807) % 2147483647;
      return (seed / 2147483647 - 0.5) * 0.6;
    });
    expect(detectPitch(noise, SR)).toBeNull();
  });
});

describe('octaveFreeCentsError', () => {
  it('ignores octave displacement', () => {
    expect(octaveFreeCentsError(110, 220)).toBeCloseTo(0);
    expect(octaveFreeCentsError(440, 220)).toBeCloseTo(0);
  });

  it('keeps the sign of a small error', () => {
    expect(octaveFreeCentsError(222, 220)).toBeGreaterThan(0);
    expect(octaveFreeCentsError(218, 220)).toBeLessThan(0);
  });
});
