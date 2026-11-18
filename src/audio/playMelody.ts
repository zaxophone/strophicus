import { AudioContext, AudioManager } from 'react-native-audio-api';

import { midiToHz } from '../pitch/music';

export interface Playback {
  stop: () => void;
  /** Resolves when playback has finished or been stopped. */
  done: Promise<void>;
}

export interface MelodyOptions {
  /** Time from the start of each note to the start of the next, in beats; one each if omitted. */
  beats?: number[];
  /**
   * How long each note sounds, in beats, where that is less than the time
   * until the next (so there is a rest after it). The same as `beats` if omitted.
   */
  held?: number[];
  bpm?: number;
  /** Called as each note begins, and with null once playback ends. */
  onNote?: (index: number | null) => void;
}

/** Time between asking the audio engine to start and the first note sounding. */
const LEAD_SECONDS = 0.1;

/**
 * Plays a melody given as semitone offsets from `tonicMidi`, as soft tones.
 * It's only a reference to hear the shape and timing; nothing is judged
 * against it.
 */
export function playMelody(
  tonicMidi: number,
  offsets: number[],
  { beats, held, bpm = 120, onNote }: MelodyOptions = {},
): Playback {
  let stopped = false;
  let timers: ReturnType<typeof setTimeout>[] = [];
  let context: AudioContext | undefined;
  let finish: () => void = () => {};
  const done = new Promise<void>((resolve) => (finish = resolve));

  const end = () => {
    if (stopped) return;
    stopped = true;
    timers.forEach(clearTimeout);
    timers = [];
    context?.close().catch(() => {});
    context = undefined;
    onNote?.(null);
    finish();
  };

  (async () => {
    try {
      AudioManager.setSystemOptions({
        ios: { category: 'playback', mode: 'default', options: [] },
      });
      await AudioManager.setAudioSessionActivity(true);
      if (stopped) return;

      const beatSeconds = 60 / bpm;
      const starts: number[] = [];
      let at = 0;
      for (let i = 0; i < offsets.length; i++) {
        starts.push(at);
        at += (beats?.[i] ?? 1) * beatSeconds;
      }

      context = new AudioContext();
      const origin = context.currentTime + LEAD_SECONDS;
      offsets.forEach((offset, i) => {
        const osc = context!.createOscillator();
        const gain = context!.createGain();
        osc.type = 'triangle';
        osc.frequency.value = midiToHz(tonicMidi + offset);
        osc.connect(gain);
        gain.connect(context!.destination);

        const t = origin + starts[i];
        const length = (held?.[i] ?? beats?.[i] ?? 1) * beatSeconds * 0.92;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.35, t + 0.04);
        gain.gain.setValueAtTime(0.35, t + length - 0.08);
        gain.gain.linearRampToValueAtTime(0, t + length);
        osc.start(t);
        osc.stop(t + length + 0.02);
        timers.push(setTimeout(() => onNote?.(i), (LEAD_SECONDS + starts[i]) * 1000));
      });
      timers.push(setTimeout(end, (LEAD_SECONDS + at + 0.2) * 1000));
    } catch {
      end();
    }
  })();

  return { stop: end, done };
}
