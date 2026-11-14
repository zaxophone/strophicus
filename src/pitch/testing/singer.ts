import { midiToHz } from '../music';
import { HOP_LENGTH, PitchPipeline, PitchPipelineOptions } from '../pitchPipeline';
import { NoteSegmenter, SungNote } from '../noteSegmenter';

/** Small deterministic random source so simulated singers are repeatable. */
export function makeRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  const uniform = () => (s = (s * 16807) % 2147483647) / 2147483647;
  return {
    uniform,
    between: (a: number, b: number) => a + (b - a) * uniform(),
    gauss: () => {
      let sum = 0;
      for (let i = 0; i < 6; i++) sum += uniform();
      return (sum - 3) / 0.7;
    },
  };
}

const HARMONICS = [0.3, 0.15, 0.08, 0.04];

export interface NoteSpec {
  /** Intended pitch above the first note, in semitones. */
  semitones: number;
  seconds: number;
  /** Unvoiced time after the note, like a consonant or a breath. */
  gapAfter?: number;
}

/** How a real voice departs from the clean intended pitch. */
export interface SingingStyle {
  /** Seconds taken to slide from the previous note. */
  glideSeconds: number;
  /** Semitones off at the start of a note: negative scoops up, positive overshoots. */
  onsetOffset: number;
  onsetTau: number;
  /** Fraction of the way toward the next note reached by the end of a note. */
  anticipation: number;
  anticipationSeconds: number;
  vibratoDepth: number;
  vibratoHz: number;
  jitter: number;
  /** Strength of each harmonic; vowels with a weak fundamental fool detectors. */
  harmonics: number[];
  /** Overrides `harmonics` for individual notes, by index. */
  noteHarmonics?: (number[] | undefined)[];
}

/** A vowel-like spectrum: `weak` scales the fundamental, formants lift 2nd/3rd. */
export function vowelHarmonics(weak: number, boost: number): number[] {
  return [0.3 * weak, 0.15 * boost, 0.1 * boost, 0.05, 0.03];
}

export function randomStyle(random: ReturnType<typeof makeRandom>): SingingStyle {
  return {
    glideSeconds: random.between(0.04, 0.12),
    onsetOffset: random.between(-1.2, 0.8),
    onsetTau: random.between(0.04, 0.1),
    anticipation: random.between(0, 0.7),
    anticipationSeconds: random.between(0.08, 0.16),
    vibratoDepth: random.between(0.04, 0.22),
    vibratoHz: random.between(4.5, 6.5),
    jitter: random.between(0.03, 0.12),
    harmonics: HARMONICS,
  };
}

const smoothstep = (x: number) => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};

/** Renders mono audio of a singer performing `notes` starting at `baseMidi`. */
export function renderSinger(
  notes: NoteSpec[],
  baseMidi: number,
  style: SingingStyle,
  random: ReturnType<typeof makeRandom>,
  sampleRate = 44100,
  lead = 0.4,
  tail = 0.5,
): Float32Array {
  const starts: number[] = [];
  let t = lead;
  for (const n of notes) {
    starts.push(t);
    t += n.seconds + (n.gapAfter ?? 0);
  }
  const total = t + tail;
  const out = new Float32Array(Math.floor(total * sampleRate));

  const vibratoPhase = random.between(0, 2 * Math.PI);
  let jitter = 0;
  let phase = 0;
  for (let i = 0; i < out.length; i++) {
    const time = i / sampleRate;
    let k = -1;
    for (let j = 0; j < notes.length; j++) {
      if (time >= starts[j] && time < starts[j] + notes[j].seconds) k = j;
    }

    let sample = random.gauss() * 0.006;
    if (k >= 0) {
      const note = notes[k];
      const u = time - starts[k];
      const prev = k > 0 ? notes[k - 1].semitones : note.semitones;
      let semis = prev + (note.semitones - prev) * smoothstep(u / style.glideSeconds);
      semis += style.onsetOffset * Math.exp(-u / style.onsetTau);
      if (k + 1 < notes.length) {
        const w = (u - (note.seconds - style.anticipationSeconds)) / style.anticipationSeconds;
        semis += (notes[k + 1].semitones - note.semitones) * style.anticipation * smoothstep(w);
      }
      semis += style.vibratoDepth * Math.sin(2 * Math.PI * style.vibratoHz * time + vibratoPhase);
      jitter += 0.002 * (random.gauss() * style.jitter * 8 - jitter * 20);
      semis += jitter;

      phase += (2 * Math.PI * midiToHz(baseMidi + semis)) / sampleRate;
      const envelope =
        Math.min(1, u / 0.025) * Math.min(1, (note.seconds - u) / 0.04);
      let voiced = 0;
      (style.noteHarmonics?.[k] ?? style.harmonics).forEach(
        (a, h) => (voiced += a * Math.sin((h + 1) * phase)),
      );
      sample += voiced * envelope + random.gauss() * 0.1 * Math.exp(-u / 0.02) * 0.2;
    }
    out[i] = sample;
  }
  return out;
}

/** Runs rendered audio through the same chain the app uses. */
export function sing(
  audio: Float32Array,
  sampleRate = 44100,
  options: PitchPipelineOptions = {},
): SungNote[] {
  const pipeline = new PitchPipeline(sampleRate, options);
  const segmenter = new NoteSegmenter();
  for (let i = 0; i + HOP_LENGTH <= audio.length; i += HOP_LENGTH) {
    segmenter.push(pipeline.push(audio.subarray(i, i + HOP_LENGTH), sampleRate).midi);
  }
  return segmenter.notes;
}
