export interface PitchResult {
  hz: number;
  /** 0..1, higher means a cleaner periodic signal. */
  clarity: number;
}

export interface YinOptions {
  /** CMND threshold for accepting a period; lower is stricter. */
  threshold?: number;
  minHz?: number;
  maxHz?: number;
  /** Frames quieter than this RMS are treated as silence. */
  minRms?: number;
  /**
   * Average this many samples into one before analysis. Voice pitch needs far
   * less than 44.1 kHz, and the cost drops with the square of the factor.
   */
  decimate?: number;
}

const DEFAULTS: Required<YinOptions> = {
  threshold: 0.15,
  minHz: 70,
  maxHz: 1000,
  minRms: 0.01,
  decimate: 1,
};

/**
 * YIN pitch detection (de Cheveigné & Kawahara, 2002) for one mono frame.
 * Returns null for silence or unvoiced/noisy frames. The frame should hold at
 * least two periods of the lowest pitch you care about.
 */
export function detectPitch(
  frame: Float32Array,
  sampleRate: number,
  options: YinOptions = {},
): PitchResult | null {
  const { threshold, minHz, maxHz, minRms, decimate } = {
    ...DEFAULTS,
    ...options,
  };

  if (decimate > 1) {
    const length = Math.floor(frame.length / decimate);
    const reduced = new Float32Array(length);
    for (let i = 0; i < length; i++) {
      let sum = 0;
      for (let j = 0; j < decimate; j++) sum += frame[i * decimate + j];
      reduced[i] = sum / decimate;
    }
    return detectPitch(reduced, sampleRate / decimate, {
      ...options,
      decimate: 1,
    });
  }

  let energy = 0;
  for (let i = 0; i < frame.length; i++) energy += frame[i] * frame[i];
  if (Math.sqrt(energy / frame.length) < minRms) return null;

  const tauMin = Math.max(2, Math.floor(sampleRate / maxHz));
  const tauMax = Math.min(
    Math.floor(sampleRate / minHz),
    Math.floor(frame.length / 2),
  );
  if (tauMax <= tauMin + 1) return null;
  const window = frame.length - tauMax;

  // Difference function, then cumulative mean normalised difference (CMND).
  const cmnd = new Float32Array(tauMax + 1);
  cmnd[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau <= tauMax; tau++) {
    let d = 0;
    for (let i = 0; i < window; i++) {
      const delta = frame[i] - frame[i + tau];
      d += delta * delta;
    }
    runningSum += d;
    cmnd[tau] = runningSum === 0 ? 1 : (d * tau) / runningSum;
  }

  // First dip below the threshold, followed down to its local minimum.
  let tau = -1;
  for (let t = tauMin; t < tauMax; t++) {
    if (cmnd[t] < threshold) {
      while (t + 1 < tauMax && cmnd[t + 1] < cmnd[t]) t++;
      tau = t;
      break;
    }
  }
  if (tau === -1) return null;

  // Parabolic interpolation around the minimum for sub-sample accuracy.
  const a = cmnd[tau - 1];
  const b = cmnd[tau];
  const c = cmnd[tau + 1];
  const denom = a - 2 * b + c;
  const refined = denom === 0 ? tau : tau + (a - c) / (2 * denom);

  return { hz: sampleRate / refined, clarity: Math.max(0, 1 - b) };
}
