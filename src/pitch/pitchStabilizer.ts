import { hzToMidi } from './music';
import { OneEuroFilter } from './oneEuro';

export interface PitchStabilizerOptions {
  /** Seconds between pushed frames. */
  hopSeconds?: number;
  /** Unvoiced frames tolerated (a consonant) before the note is forgotten. */
  holdFrames?: number;
  /** Frames an octave-displaced reading must persist to count as a real leap. */
  octaveConfirmFrames?: number;
  /** A change bigger than this many semitones needs confirming. */
  jumpSemitones?: number;
  jumpConfirmFrames?: number;
  minCutoff?: number;
  beta?: number;
  /**
   * Treat readings as octave-equivalent: a reading too far from the previous
   * note to be a plausible step is moved by octaves to sit near it. This hides
   * the detector's octave errors, at the cost of never reporting a real
   * octave leap, so it suits exercises rather than a tuner.
   */
  foldOctaves?: boolean;
  /** Largest leap in semitones believed to be real when folding. */
  maxLeapSemitones?: number;
  /** Frames of silence after which the previous note stops anchoring octaves. */
  anchorFrames?: number;
}

const DEFAULTS: Required<PitchStabilizerOptions> = {
  hopSeconds: 1024 / 44100,
  holdFrames: 8,
  octaveConfirmFrames: 6,
  jumpSemitones: 2.5,
  jumpConfirmFrames: 3,
  minCutoff: 1.2,
  beta: 0.4,
  foldOctaves: false,
  maxLeapSemitones: 8.5,
  anchorFrames: 90,
};

/**
 * Semitones between a note and its 2nd, 3rd, 4th and 5th harmonics. A detector
 * that locks onto a harmonic reads the note this far too high, and the octave
 * is only one of the possible errors: the third harmonic (an octave and a
 * fifth up) is as common on some vowels.
 */
const HARMONIC_SHIFTS = [0, 12, 19.02, 24, 27.86].flatMap((s) => (s === 0 ? [0] : [s, -s]));

/** Moves a reading by whichever harmonic error brings it closest to `near`. */
function foldToward(midi: number, near: number): number {
  let best = midi;
  for (const shift of HARMONIC_SHIFTS) {
    const candidate = midi - shift;
    if (Math.abs(candidate - near) < Math.abs(best - near)) best = candidate;
  }
  return best;
}

/**
 * Turns raw per-frame pitch readings into a steady line: folds octave errors,
 * holds back unconfirmed spikes, bridges consonant gaps and smooths jitter.
 * Output is fractional MIDI, or null while nothing is being sung.
 */
export class PitchStabilizer {
  private readonly o: Required<PitchStabilizerOptions>;
  private readonly filter: OneEuroFilter;
  private ref: number | null = null;
  /** Last accepted pitch, remembered through pauses to anchor the octave. */
  private anchor: number | null = null;
  private silent = 0;
  private last: number | null = null;
  private gap = 0;
  private octaveStreak = 0;
  private pending: { midi: number; count: number } | null = null;

  constructor(options: PitchStabilizerOptions = {}) {
    this.o = { ...DEFAULTS, ...options };
    this.filter = new OneEuroFilter(this.o.minCutoff, this.o.beta);
  }

  /** True while a note is being followed, including across brief gaps. */
  get active(): boolean {
    return this.ref !== null;
  }

  push(hz: number | null): number | null {
    if (hz === null) {
      if (++this.silent > this.o.anchorFrames) this.anchor = null;
      if (this.ref !== null && ++this.gap > this.o.holdFrames) this.reset();
      return null;
    }
    this.silent = 0;

    const dt = this.o.hopSeconds * (1 + this.gap);
    this.gap = 0;
    let midi = hzToMidi(hz);

    const near = this.ref ?? this.anchor;
    if (this.o.foldOctaves && near !== null) {
      const away = midi - near;
      if (Math.abs(away) > this.o.maxLeapSemitones) {
        midi = foldToward(midi, near);
      }
    }

    if (this.ref === null) {
      this.ref = this.anchor = midi;
      return (this.last = this.filter.filter(midi, dt));
    }

    const octaves = Math.round((midi - this.ref) / 12);
    if (octaves !== 0 && Math.abs(midi - 12 * octaves - this.ref) < 1.5) {
      if (++this.octaveStreak < this.o.octaveConfirmFrames) {
        midi -= 12 * octaves;
      }
    } else {
      this.octaveStreak = 0;
    }

    if (Math.abs(midi - this.ref) > this.o.jumpSemitones) {
      const p = this.pending;
      this.pending =
        p && Math.abs(midi - p.midi) < 1
          ? { midi, count: p.count + 1 }
          : { midi, count: 1 };
      if (this.pending.count < this.o.jumpConfirmFrames) return this.last;
    }
    this.pending = null;

    this.ref = this.anchor = midi;
    return (this.last = this.filter.filter(midi, dt));
  }

  private reset(): void {
    this.ref = null;
    this.last = null;
    this.gap = 0;
    this.octaveStreak = 0;
    this.pending = null;
    this.filter.reset();
  }
}
