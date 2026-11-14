import { PitchStabilizer } from './pitchStabilizer';
import { detectPitch } from './yin';

/** Samples per audio callback; smaller means lower latency. */
export const HOP_LENGTH = 1024;
/** Analysis window, which must span two periods of the lowest pitch. */
const WINDOW_LENGTH = 3072;
const DECIMATE = 4;

// Quiet singing must not be mistaken for silence, but the quietest level worth
// listening to depends on the microphone and the room. So the pipeline tracks
// the background level and listens down to a few times that, never being
// stricter than a fixed ceiling.
/** Background level (RMS) assumed until quieter frames are heard. */
const INITIAL_NOISE_FLOOR = 0.004;
/** How much louder than the background a frame must be to count as sound. */
const NOISE_MARGIN = 2.5;
/** The quietest and the loudest the cut-off may be (RMS). */
const MIN_LEVEL = 0.003;
const MAX_LEVEL = 0.01;
/** Fraction of the gap the background estimate climbs per frame; it drops at once. */
const FLOOR_RISE = 0.0005;

export interface PitchPipelineOptions {
  /** Treat pitch as octave-equivalent; see `PitchStabilizerOptions`. */
  foldOctaves?: boolean;
}

export interface PitchFrame {
  /** Stabilised pitch as fractional MIDI, null when nothing is sung. */
  midi: number | null;
  /** 0..1 confidence of the raw reading; 0 when unvoiced. */
  clarity: number;
  /** Loudness of this chunk of audio (RMS, 0..1). */
  level: number;
}

/** Audio chunks in, one stabilised pitch reading per chunk out. */
export class PitchPipeline {
  private window = new Float32Array(WINDOW_LENGTH);
  private stabilizer: PitchStabilizer;
  private noiseFloor = INITIAL_NOISE_FLOOR;

  constructor(
    private readonly sampleRate = 44100,
    private readonly options: PitchPipelineOptions = {},
  ) {
    this.stabilizer = this.makeStabilizer();
  }

  /** True while a note is being followed, including across brief gaps. */
  get active(): boolean {
    return this.stabilizer.active;
  }

  push(chunk: Float32Array, sampleRate = this.sampleRate): PitchFrame {
    const n = Math.min(chunk.length, WINDOW_LENGTH);
    this.window.copyWithin(0, n);
    this.window.set(chunk.subarray(chunk.length - n), WINDOW_LENGTH - n);

    let windowEnergy = 0;
    for (let i = 0; i < WINDOW_LENGTH; i++) windowEnergy += this.window[i] * this.window[i];
    const windowLevel = Math.sqrt(windowEnergy / WINDOW_LENGTH);
    this.noiseFloor =
      windowLevel < this.noiseFloor
        ? windowLevel
        : this.noiseFloor + (windowLevel - this.noiseFloor) * FLOOR_RISE;
    const minRms = Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, NOISE_MARGIN * this.noiseFloor));

    const raw = detectPitch(this.window, sampleRate, { decimate: DECIMATE, minRms });
    const midi = this.stabilizer.push(raw ? raw.hz : null);
    let energy = 0;
    for (let i = 0; i < chunk.length; i++) energy += chunk[i] * chunk[i];
    const level = chunk.length > 0 ? Math.sqrt(energy / chunk.length) : 0;
    return { midi, clarity: raw ? raw.clarity : 0, level };
  }

  reset(): void {
    this.noiseFloor = INITIAL_NOISE_FLOOR;
    this.window = new Float32Array(WINDOW_LENGTH);
    this.stabilizer = this.makeStabilizer();
  }

  private makeStabilizer(): PitchStabilizer {
    return new PitchStabilizer({
      hopSeconds: HOP_LENGTH / this.sampleRate,
      foldOctaves: this.options.foldOctaves,
    });
  }
}

