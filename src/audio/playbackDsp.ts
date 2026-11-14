/** Reads the first channel of a PCM16, PCM24 or float32 WAV into samples in -1..1. */
export function parseWav(bytes: ArrayBuffer): { samples: Float32Array; sampleRate: number } {
  const view = new DataView(bytes);
  const tag = (at: number) => String.fromCharCode(...new Uint8Array(bytes, at, 4));
  if (bytes.byteLength < 12 || tag(0) !== 'RIFF' || tag(8) !== 'WAVE') {
    throw new Error('not a WAV file');
  }
  let format = 1;
  let channels = 1;
  let sampleRate = 44100;
  let bits = 16;
  for (let pos = 12; pos + 8 <= bytes.byteLength; ) {
    const size = view.getUint32(pos + 4, true);
    if (tag(pos) === 'fmt ') {
      format = view.getUint16(pos + 8, true);
      channels = view.getUint16(pos + 10, true);
      sampleRate = view.getUint32(pos + 12, true);
      bits = view.getUint16(pos + 22, true);
    } else if (tag(pos) === 'data') {
      const width = bits / 8;
      const available = Math.min(size, bytes.byteLength - pos - 8);
      const frames = Math.floor(available / (width * channels));
      const samples = new Float32Array(frames);
      for (let i = 0; i < frames; i++) {
        const at = pos + 8 + i * width * channels;
        samples[i] =
          format === 3
            ? view.getFloat32(at, true)
            : bits === 16
              ? view.getInt16(at, true) / 32768
              : ((view.getUint8(at) | (view.getUint8(at + 1) << 8) | (view.getInt8(at + 2) << 16)) / 8388608);
      }
      return { samples, sampleRate };
    }
    pos += 8 + size + (size % 2);
  }
  throw new Error('WAV has no audio data');
}

/**
 * Converts audio to another sample rate with cubic interpolation, so the audio
 * engine can play it 1:1 instead of resampling it coarsely itself. Only
 * upsampling or a small downsampling is expected (microphone to speaker rate).
 */
export function resample(samples: Float32Array, from: number, to: number): Float32Array {
  if (from === to || samples.length === 0) return samples;
  const length = Math.floor((samples.length * to) / from);
  const out = new Float32Array(length);
  const last = samples.length - 1;
  const step = from / to;
  for (let i = 0; i < length; i++) {
    const t = i * step;
    const k = Math.floor(t);
    const f = t - k;
    const p0 = samples[k > 0 ? k - 1 : 0];
    const p1 = samples[k];
    const p2 = samples[k < last ? k + 1 : last];
    const p3 = samples[k + 2 <= last ? k + 2 : last];
    // Catmull-Rom spline through p1 and p2
    out[i] =
      p1 +
      0.5 *
        f *
        (p2 - p0 + f * (2 * p0 - 5 * p1 + 4 * p2 - p3 + f * (3 * (p1 - p2) + p3 - p0)));
  }
  return out;
}

export interface PrepareOptions {
  /** Loudness of the voiced parts after normalising (RMS, 0..1); about -14 dBFS. */
  targetRms?: number;
  /** Most the audio is ever amplified. */
  maxGain?: number;
  fadeSeconds?: number;
}

/**
 * Smooths hard gating in a recording. Where the level collapses (or jumps up)
 * within a few milliseconds the waveform has a step in it, which clicks when
 * played; this fades the loud side down to (or up from) zero over a few
 * milliseconds so the cut is inaudible. Gentle fades and normal speech
 * consonants are left alone.
 */
export function softenCuts(
  samples: Float32Array<ArrayBuffer>,
  sampleRate: number,
  { ratio = 12, fadeSeconds = 0.006, minLevel = 0.002 } = {},
): Float32Array<ArrayBuffer> {
  const win = Math.max(1, Math.round(0.003 * sampleRate));
  const fade = Math.max(2, Math.round(fadeSeconds * sampleRate));
  const count = Math.floor(samples.length / win);
  const level = new Float32Array(count);
  for (let w = 0; w < count; w++) {
    let sum = 0;
    for (let i = w * win; i < (w + 1) * win; i++) sum += samples[i] * samples[i];
    level[w] = Math.sqrt(sum / win) + 1e-6;
  }
  const out = Float32Array.from(samples);
  for (let w = 1; w < count; w++) {
    if (level[w - 1] > minLevel && level[w] < level[w - 1] / ratio) {
      // loud then silent: find where the sound really stops and fade out to it
      let cut = w * win;
      while (cut > 0 && Math.abs(out[cut - 1]) <= 0.05 * level[w - 1]) cut--;
      for (let i = 0; i < fade && cut - 1 - i >= 0; i++) out[cut - 1 - i] *= i / fade;
    }
    if (level[w] > minLevel && level[w - 1] < level[w] / ratio) {
      // silent then loud: find where the sound really starts and fade in from it
      let cut = w * win;
      while (cut < out.length && Math.abs(out[cut]) <= 0.05 * level[w]) cut++;
      for (let i = 0; i < fade && cut + i < out.length; i++) out[cut + i] *= i / fade;
    }
  }
  return out;
}

const WINDOW_SECONDS = 0.02;
/** Peaks above this are squeezed smoothly toward 1 instead of clipping. */
const KNEE = 0.6;

/**
 * Makes a recording comfortable to hear: removes any constant offset, brings
 * the voiced parts to a consistent loudness (by RMS, so one stray peak can't
 * keep the voice quiet), softly limits peaks, and fades the ends so playback
 * doesn't click.
 */
export function prepareForPlayback(
  samples: Float32Array,
  sampleRate: number,
  { targetRms = 0.2, maxGain = 40, fadeSeconds = 0.01 }: PrepareOptions = {},
): Float32Array<ArrayBuffer> {
  const n = samples.length;
  const out = new Float32Array(n);
  if (n === 0) return out;

  let mean = 0;
  for (let i = 0; i < n; i++) mean += samples[i];
  mean /= n;
  for (let i = 0; i < n; i++) out[i] = samples[i] - mean;
  out.set(softenCuts(out, sampleRate));

  // Loudness of the voiced parts: windows at least a quarter as loud as the loudest.
  const win = Math.max(1, Math.round(WINDOW_SECONDS * sampleRate));
  const energies: number[] = [];
  for (let start = 0; start + win <= n; start += win) {
    let sum = 0;
    for (let i = start; i < start + win; i++) sum += out[i] * out[i];
    energies.push(sum / win);
  }
  const loudest = Math.max(0, ...energies);
  let voiced = 0;
  let count = 0;
  for (const e of energies) {
    if (e >= loudest * 0.0625) {
      voiced += e;
      count++;
    }
  }
  const rms = count > 0 ? Math.sqrt(voiced / count) : 0;
  const gain = rms > 1e-4 ? Math.min(maxGain, targetRms / rms) : 1;

  const room = 1 - KNEE;
  for (let i = 0; i < n; i++) {
    const x = out[i] * gain;
    const a = Math.abs(x);
    out[i] = a <= KNEE ? x : Math.sign(x) * (KNEE + room * Math.tanh((a - KNEE) / room));
  }

  const fade = Math.min(Math.round(fadeSeconds * sampleRate), n >> 1);
  for (let i = 0; i < fade; i++) {
    const g = i / fade;
    out[i] *= g;
    out[n - 1 - i] *= g;
  }
  return out;
}
