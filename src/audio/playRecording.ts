import { File } from 'expo-file-system';
import { AudioContext, AudioManager } from 'react-native-audio-api';

import type { Playback } from './playMelody';
import { parseWav, prepareForPlayback, resample } from './playbackDsp';

export interface RecordingPlayback extends Playback {
  /**
   * Resolves once the audio has loaded and is scheduled, with when it begins
   * (performance.now() time) and how long it lasts; null if nothing played.
   */
  started: Promise<{ startsAt: number; duration: number } | null>;
}

/** What to play: the recorder's own files, with the captured audio as a fallback. */
export interface RecordedAudio {
  files: string[];
  samples: Float32Array;
  sampleRate: number;
}

interface Prepared {
  samples: Float32Array<ArrayBuffer>;
  sampleRate: number;
}

const LEAD_SECONDS = 0.1;

/** Reads a recorded WAV straight from disk, exactly as the recorder wrote it. */
async function readWavFile(uri: string) {
  return parseWav(await new File(uri).arrayBuffer());
}

/** The recording as the recorder wrote it, or the copy kept in memory if that can't be read. */
async function loadAudio(audio: RecordedAudio): Promise<{ samples: Float32Array; sampleRate: number }> {
  if (audio.files.length > 0) {
    try {
      const loaded = await Promise.all(audio.files.map(readWavFile));
      const joined = new Float32Array(loaded.reduce((n, w) => n + w.samples.length, 0));
      let at = 0;
      for (const w of loaded) {
        joined.set(w.samples, at);
        at += w.samples.length;
      }
      if (__DEV__) {
        console.log(
          'REC_LENGTHS',
          `file=${(joined.length / loaded[0].sampleRate).toFixed(2)}s`,
          `memory=${(audio.samples.length / audio.sampleRate).toFixed(2)}s`,
          `fileRate=${loaded[0].sampleRate}`,
        );
      }
      return { samples: joined, sampleRate: loaded[0].sampleRate };
    } catch (error) {
      if (__DEV__) console.log('REC_FILE_FAILED', String(error));
    }
  }
  return { samples: audio.samples, sampleRate: audio.sampleRate };
}

/** Audio at the output rate, cleaned up and levelled, ready to hand to the engine. */
async function prepare(audio: RecordedAudio, outputRate: number): Promise<Prepared> {
  const { samples, sampleRate } = await loadAudio(audio);
  const started = performance.now();
  const ready = prepareForPlayback(resample(samples, sampleRate, outputRate), outputRate);
  if (__DEV__) console.log('REC_PREP_MS', Math.round(performance.now() - started));
  return { samples: ready, sampleRate: outputRate };
}

// Preparing takes a noticeable moment, so it is done ahead of time (when the
// attempt ends) and kept for the one most recent recording.
let cached: { key: string; ready: Promise<Prepared> } | null = null;
const keyFor = (audio: RecordedAudio, rate: number) => `${audio.files.join('|')}@${rate}`;

function prepared(audio: RecordedAudio, outputRate: number): Promise<Prepared> {
  if (audio.files.length === 0) return prepare(audio, outputRate);
  const key = keyFor(audio, outputRate);
  if (cached?.key !== key) cached = { key, ready: prepare(audio, outputRate) };
  return cached.ready;
}

/** Gets a recording ready for playback in the background, so playing it starts at once. */
export function warmRecording(audio: RecordedAudio): void {
  if (audio.files.length === 0) return;
  prepared(audio, AudioManager.getDevicePreferredSampleRate()).catch(() => {});
}

/** Plays back what the microphone recorded. */
export function playRecording(audio: RecordedAudio): RecordingPlayback {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let context: AudioContext | undefined;
  let finish: () => void = () => {};
  const done = new Promise<void>((resolve) => (finish = resolve));
  let begin: (info: { startsAt: number; duration: number } | null) => void = () => {};
  const started = new Promise<{ startsAt: number; duration: number } | null>(
    (resolve) => (begin = resolve),
  );

  const end = () => {
    if (!stopped) {
      stopped = true;
      if (timer) clearTimeout(timer);
      context?.close().catch(() => {});
      context = undefined;
    }
    begin(null);
    finish();
  };

  (async () => {
    try {
      AudioManager.setSystemOptions({
        ios: { category: 'playback', mode: 'default', options: [] },
      });
      await AudioManager.setAudioSessionActivity(true);
      if (stopped) return;

      context = new AudioContext();
      // Hand the engine audio at its own output rate so it plays 1:1.
      const playable = (await prepared(audio, context.sampleRate)).samples;
      if (stopped || playable.length === 0) return end();

      const buffer = context.createBuffer(1, playable.length, context.sampleRate);
      buffer.copyToChannel(playable, 0);
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      source.start(context.currentTime + LEAD_SECONDS);

      const duration = playable.length / context.sampleRate;
      begin({ startsAt: performance.now() + LEAD_SECONDS * 1000, duration });
      timer = setTimeout(end, (LEAD_SECONDS + duration + 0.3) * 1000);
    } catch {
      end();
    }
  })();

  return { stop: end, done, started };
}
